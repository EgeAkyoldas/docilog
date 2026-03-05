import { NextRequest, NextResponse } from "next/server";
import {
  loadAIPromptsFromDB,
  loadAIPrompts,
  getPersona,
  interpolate,
} from "@/lib/ai-prompts";
import type { AIPromptConfig } from "@/lib/ai-prompts";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";

/**
 * POST /api/v1/[project-slug]/ai-assist — AI text generation using Google Gemini.
 * Supports multi-persona system: persona-specific system instructions and prompt injection.
 * Loads project-specific prompts from database.
 */

interface AIRequest {
  action:
    | "improve"
    | "expand"
    | "summarize"
    | "translate"
    | "generate"
    | "custom"
    | "bilingual"
    | "seo-optimize"
    | "auto_blog"
    | "blog_ready"
    | "chat";
  content?: string;
  title?: string;
  language?: string;
  prompt?: string;
  seoIssues?: string;
  persona?: string;
  history?: { role: string; content: string }[];
  referenceImages?: string[];
}

// Dynamic temperature: analytical tasks low, creative tasks high
const TEMPERATURE_MAP: Record<string, number> = {
  summarize: 0.2,
  translate: 0.3,
  seo_optimize: 0.25,
  improve: 0.5,
  blog_ready: 0.6,
  expand: 0.7,
  bilingual: 0.7,
  custom: 0.7,
  chat: 0.7,
  generate: 0.85,
  auto_blog: 0.85,
};

function buildSystemInstruction(
  persona: ReturnType<typeof getPersona>,
  config: AIPromptConfig
): string {
  const base = config.system_instruction;
  const globalNeg = config.global_rules?.negative_constraints || "";
  const globalStyle = config.global_rules?.writing_style_rules || "";

  // Build persona-augmented system instruction
  return [
    base,
    `\n--- ACTIVE PERSONA: ${persona.name} ---`,
    `TONE: ${persona.tone}`,
    persona.instruction,
    persona.writing_style_rules
      ? `WRITING STYLE:\n${persona.writing_style_rules}`
      : "",
    `GLOBAL WRITING RULES:\n${globalStyle}`,
    `GLOBAL NEGATIVE CONSTRAINTS:\n${globalNeg}`,
    persona.negative_constraints
      ? `PERSONA NEGATIVE CONSTRAINTS:\n${persona.negative_constraints}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildPrompt(
  data: AIRequest,
  persona: ReturnType<typeof getPersona>,
  config: AIPromptConfig
): string {
  const lang = data.language === "en" ? "en" : "tr";
  const langName = lang === "en" ? "English" : "Türkçe";
  const targetLang = lang === "tr" ? "English" : "Türkçe";

  const vars: Record<string, string> = {
    language: langName,
    target_language: targetLang,
    content: data.content ?? "(boş)",
    title: data.title ?? "",
    prompt: data.prompt ?? "",
    seo_issues: data.seoIssues ?? "",
    dimension: "",
    // Persona variables for auto_blog and blog_ready
    persona_name: persona.name,
    persona_instruction: persona.instruction || "",
    persona_negative_constraints: persona.negative_constraints || "",
    persona_writing_style: persona.writing_style_rules || "",
  };

  const actionKey =
    data.action === "seo-optimize" ? "seo_optimize" : data.action;
  const template = config.actions[actionKey];

  if (template) {
    return interpolate(template, vars);
  }

  return data.prompt || "";
}

/**
 * Build multi-turn contents array for chat mode.
 * Gemini expects alternating user/model messages.
 */
function buildChatContents(
  data: AIRequest,
  _config: AIPromptConfig
): { role: string; parts: { text: string }[] }[] {
  const lang = data.language === "en" ? "English" : "Türkçe";

  // Build initial context message with document content
  const contextParts: string[] = [
    `[DOCUMENT CONTEXT — EDITING MODE]`,
    `Title: ${data.title || "(untitled)"}`,
    `Language: ${lang}`,
    `\nDocument Content:\n${data.content || "(empty document)"}`,
  ];

  // Reference images
  if (data.referenceImages?.length) {
    contextParts.push(`\nReference Images: ${data.referenceImages.join(", ")}`);
  }

  contextParts.push(`\n[USER MESSAGE]\n${data.prompt || ""}`);

  // Build multi-turn contents
  const contents: { role: string; parts: { text: string }[] }[] = [];

  // If there's history, include previous turns
  if (data.history && data.history.length > 1) {
    // First message gets the document context injected
    for (let i = 0; i < data.history.length; i++) {
      const msg = data.history[i];
      const role = msg.role === "user" ? "user" : "model";

      if (i === 0 && role === "user") {
        // Inject doc context into first user message
        contents.push({
          role: "user",
          parts: [{ text: `${contextParts.join("\n")}\n\n(Note: Document context is provided above for reference.)` }],
        });
      } else if (i === data.history.length - 1 && role === "user") {
        // Last user message = current question with fresh context
        contents.push({
          role: "user",
          parts: [{ text: `[CURRENT DOCUMENT STATE]\n${data.content || ""}\n\n[USER]\n${msg.content}` }],
        });
      } else {
        contents.push({
          role,
          parts: [{ text: msg.content }],
        });
      }
    }
  } else {
    // Single message — use full context
    contents.push({
      role: "user",
      parts: [{ text: contextParts.join("\n") }],
    });
  }

  // Ensure contents alternate user/model (Gemini requirement)
  // If two consecutive same-role messages exist, merge them
  const merged: typeof contents = [];
  for (const c of contents) {
    if (merged.length > 0 && merged[merged.length - 1].role === c.role) {
      merged[merged.length - 1].parts[0].text += "\n\n" + c.parts[0].text;
    } else {
      merged.push(c);
    }
  }

  return merged;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string }> }
) {
  try {
    const { "project-slug": projectSlug } = await params;
    const user = await verifyAuth(request);
    if (!user || !(await checkProjectAccess(user, projectSlug))) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: project } = await supabase.from("projects").select("id").eq("slug", projectSlug).single();
    // Do not return 404 here. If project doesn't exist, we will use YAML fallback.

    const body: AIRequest = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Load config from DB (with YAML fallback) for this project
    const config = project ? await loadAIPromptsFromDB(project.id) : loadAIPrompts(projectSlug);

    // Resolve persona (falls back to philosopher_editor)
    const persona = getPersona(body.persona, config);
    const systemInstruction = buildSystemInstruction(persona, config);
    const prompt = buildPrompt(body, persona, config);
    const actionKey =
      body.action === "seo-optimize" ? "seo_optimize" : body.action;

    // Enable Google Search grounding for auto_blog and blog_ready to get real sources
    const useSearch =
      body.action === "auto_blog" || body.action === "blog_ready";

    // Build request body
    const geminiBody: Record<string, unknown> = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: body.action === "chat"
        ? buildChatContents(body, config)
        : [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: TEMPERATURE_MAP[actionKey] ?? 0.7,
        topP: 0.9,
        maxOutputTokens: 8192,
      },
    };

    // Add google search tool for auto_blog
    if (useSearch) {
      geminiBody.tools = [{ googleSearch: {} }];
    }

    const FALLBACK_MODEL = "gemini-2.5-flash";
    const PRIMARY_TIMEOUT_MS = 30_000; // 30 seconds

    // Helper: call Gemini with a specific model + optional timeout
    async function callGemini(targetModel: string, timeoutMs?: number) {
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;

      if (timeoutMs) {
        timer = setTimeout(() => controller.abort(), timeoutMs);
      }

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geminiBody),
            signal: controller.signal,
          }
        );
        if (timer) clearTimeout(timer);
        return response;
      } catch (err) {
        if (timer) clearTimeout(timer);
        throw err;
      }
    }

    // Try primary model with 30s timeout
    let res: Response;
    let usedModel = model;

    try {
      res = await callGemini(model, model !== FALLBACK_MODEL ? PRIMARY_TIMEOUT_MS : undefined);

      // Fallback on HTTP errors (502, 503, 429, 404)
      if (!res.ok && [502, 503, 429, 404].includes(res.status) && model !== FALLBACK_MODEL) {
        const primaryErr = await res.text();
        console.warn(`[AI] Primary model ${model} failed (${res.status}), falling back to ${FALLBACK_MODEL}`, primaryErr);
        res = await callGemini(FALLBACK_MODEL);
        usedModel = FALLBACK_MODEL;
      }
    } catch (err) {
      // Timeout or network error on primary → fallback
      if (model !== FALLBACK_MODEL) {
        const reason = (err as Error).name === "AbortError" ? "timeout (30s)" : (err as Error).message;
        console.warn(`[AI] Primary model ${model} ${reason}, falling back to ${FALLBACK_MODEL}`);
        res = await callGemini(FALLBACK_MODEL);
        usedModel = FALLBACK_MODEL;
      } else {
        throw err;
      }
    }

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini API error:", res.status, err);
      return NextResponse.json(
        { error: "AI service error", details: err, status: res.status, model: usedModel },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract grounding metadata if available (for auto_blog w/ search)
    const groundingMeta = data.candidates?.[0]?.groundingMetadata;
    const groundingChunks =
      groundingMeta?.groundingChunks
        ?.map(
          (chunk: { web?: { uri?: string; title?: string } }) => ({
            url: chunk.web?.uri ?? "",
            title: chunk.web?.title ?? "",
          })
        )
        ?.filter((c: { url: string }) => c.url) ?? [];

    return NextResponse.json({
      result: text,
      model: usedModel,
      ...(groundingChunks.length > 0 && { groundingChunks }),
    });
  } catch (error) {
    console.error("AI assist error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

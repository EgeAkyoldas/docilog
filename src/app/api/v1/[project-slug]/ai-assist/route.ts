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
    | "blog_ready";
  content?: string;
  title?: string;
  language?: string;
  prompt?: string;
  seoIssues?: string;
  persona?: string;
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
      contents: [{ parts: [{ text: prompt }] }],
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

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini API error:", err);
      return NextResponse.json(
        { error: "AI service error" },
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

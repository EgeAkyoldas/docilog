import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

/**
 * POST /api/v1/[project-slug]/campaign-ai
 * Campaign-specific AI chat.
 * Supports multimodal input (reference images) via Gemini Vision.
 * Outputs structured <post_data> XML for "Apply" pattern on the frontend.
 */

interface CampaignAIRequest {
  userMessage: string;
  campaignAim?: string;
  personaName?: string;
  postContext?: {
    caption?: string;
    captionEn?: string;
    hashtags?: string[];
    visualPrompt?: string;
    postType?: string;
    aspectRatio?: string;
  };
  history?: { role: "user" | "model"; parts: { text: string }[] }[];
  referenceImages?: string[]; // base64 data URLs, max 3
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadPrompts(): any {
  const candidates = [
    path.join(process.cwd(), "src/config/ai-prompts-social-campaign.yaml"),
    path.join(process.cwd(), "src/config/ai-prompts-boterma-social.yaml"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return yaml.load(fs.readFileSync(p, "utf-8"));
  }
  throw new Error("No campaign AI prompt config found");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callGemini(systemInstruction: string, contents: any[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const primaryModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const fallbackModel = "gemini-2.5-flash";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function attempt(model: string, signal?: AbortSignal): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.65, maxOutputTokens: 1800 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);
  try {
    const text = await attempt(primaryModel, controller.signal);
    clearTimeout(timer);
    return text;
  } catch {
    clearTimeout(timer);
    return await attempt(fallbackModel);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string }> }
) {
  const { "project-slug": projectSlug } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CampaignAIRequest = await request.json();
    const {
      userMessage,
      campaignAim = "",
      personaName = "Aura",
      postContext,
      history = [],
      referenceImages = [],
    } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let config: any = {};
    try {
      config = loadPrompts();
    } catch (e) {
      console.warn("[campaign-ai] Could not load YAML config:", e);
    }

    // Build post context string
    const postCtxStr = postContext
      ? `caption_tr: ${postContext.caption || "-"} | caption_en: ${postContext.captionEn || "-"} | hashtags: ${postContext.hashtags?.join(" ") || "-"} | visual_prompt: ${postContext.visualPrompt || "-"} | type: ${postContext.postType || "feed"} | ratio: ${postContext.aspectRatio || "1:1"}`
      : "boş — henüz içerik yok";

    const rawTemplate = config?.actions?.chat ?? "";
    const chatTemplate = typeof rawTemplate === "string" ? rawTemplate : String(rawTemplate);

    let systemInstruction: string;
    if (chatTemplate.length > 0) {
      systemInstruction = chatTemplate
        .replaceAll("{campaign_aim}", campaignAim || "Genel kampanya")
        .replaceAll("{persona_name}", personaName)
        .replaceAll("{post_context}", postCtxStr)
        .replaceAll("{prompt}", userMessage);
    } else {
      // Fallback — always produce structured XML
      systemInstruction = `Sen Aura'sın — Boterma sosyal medya içerik editörü.
Kampanya: ${campaignAim || "Genel kampanya"} | Persona: ${personaName}
Mevcut Post: ${postCtxStr}

ZORUNLU: Tüm içerikleri <post_data> XML bloğu içinde ver. Preamble yok, açıklama yok.

<post_data>
<caption_tr>Türkçe caption</caption_tr>
<caption_en>English caption</caption_en>
<hashtags>#boterma #botermaev #tag3 #tag4</hashtags>
<tags>@boterma</tags>
<visual_prompt>Photorealistic interior design lifestyle photo. [scene]. Warm golden hour, Sony A7R V 35mm.</visual_prompt>
<cta>Kısa CTA</cta>
<location>Istanbul, Turkey</location>
</post_data>

Soru soracaksan sadece: [tek cümle] <options>A|B|C</options>

Kullanıcı: ${userMessage}`;
    }

    // ── Build multimodal user message parts ──────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userParts: any[] = [{ text: userMessage }];

    // Attach reference images as inline data (max 3)
    const validImages = referenceImages.slice(0, 3).filter(Boolean);
    for (const dataUrl of validImages) {
      // Extract mime type and base64 data from data URL
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        userParts.push({
          inline_data: {
            mime_type: match[1],
            data: match[2],
          },
        });
      }
    }

    // ── Build conversation contents ───────────────────────────────────
    const contents = [
      ...history,
      { role: "user", parts: userParts },
    ];

    const responseText = await callGemini(systemInstruction, contents);

    return NextResponse.json({ content: responseText });
  } catch (err) {
    console.error("[campaign-ai POST]", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { loadAIPromptsFromDB, loadAIPrompts, interpolate } from "@/lib/ai-prompts";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";

const BUCKET = "articles";

/** Ensure storage bucket exists — create if missing */
async function ensureBucket() {
  const supabase = createAdminClient();
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    console.log(`[AI Image] Creating storage bucket: ${BUCKET}`);
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"],
    });
    if (error) {
      console.error(`[AI Image] Failed to create bucket:`, error.message);
    }
  }
}

/**
 * POST /api/v1/[project-slug]/ai-image — Generate an image using Gemini Image Model.
 * Image prompt template is loaded from project's ai config.
 */
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

    await ensureBucket();
    const { prompt, articleSlug, aspectRatio, articleTitle, articleContext, referenceImages } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-exp";

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    // Map aspect ratio to dimension instruction
    const dimensionMap: Record<string, string> = {
      "1:1": "square format (1:1 aspect ratio)",
      "3:4": "portrait format (3:4 aspect ratio)",
      "9:16": "tall portrait format (9:16 aspect ratio)",
      "16:9": "wide landscape format (16:9 aspect ratio)",
      landscape: "wide landscape format (16:9 aspect ratio)",
      portrait: "tall portrait format (9:16 aspect ratio)",
      square: "square format (1:1 aspect ratio)",
    };
    const dimensionHint = dimensionMap[aspectRatio] || "square format (1:1 aspect ratio)";

    // Load image prompt from Project Config or Fallback
    const config = project ? await loadAIPromptsFromDB(project.id) : loadAIPrompts(projectSlug);
    const imagePrompt = interpolate(config.image_prompt, {
      dimension: dimensionHint,
      prompt,
      article_title: articleTitle || "Social Media Post",
      article_context: articleContext || "Lifestyle interior design and home decor",
    });

    // Build multimodal parts — include reference images if provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];

    const validRefs: string[] = Array.isArray(referenceImages)
      ? referenceImages.slice(0, 3).filter(Boolean)
      : [];

    if (validRefs.length > 0) {
      // Prepend reference images with a style instruction
      parts.push({
        text: `Use the following ${validRefs.length} reference image(s) as visual style references. Match their composition, lighting mood, color temperature, and interior design aesthetic. Do NOT copy them exactly — use them to inform the visual style of the new image.`,
      });
      for (const dataUrl of validRefs) {
        const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
        }
      }
      parts.push({ text: `\n\nGenerate a NEW image based on this description:\n${imagePrompt}` });
    } else {
      parts.push({ text: imagePrompt });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini image error:", err);
      return NextResponse.json({ error: "Image generation failed" }, { status: 502 });
    }

    const data = await res.json();

    // Extract image from response
    const responseParts = data.candidates?.[0]?.content?.parts ?? [];
    const imagePart = responseParts.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    );

    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: "No image generated" }, { status: 502 });
    }

    const { mimeType, data: base64Data } = imagePart.inlineData;

    if (!base64Data) {
      console.error("AI image: base64Data is empty");
      return NextResponse.json({ error: "Generated image has no data" }, { status: 502 });
    }

    // Upload to Supabase Storage
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const sanitizedSlug = (articleSlug || "untitled").replace(/[^a-z0-9-]/gi, "-").slice(0, 40);
    const filename = `ai-gen/${sanitizedSlug}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(base64Data, "base64");
    console.log(`[AI Image] Uploading: bucket=articles, path=${filename}, size=${buffer.length} bytes, mime=${mimeType}`);

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      console.error("Upload error:", uploadErr.message, uploadErr);

      // Fallback: try without subfolder
      const fallbackName = `${sanitizedSlug}-${Date.now()}.${ext}`;
      console.log(`[AI Image] Retrying with fallback path: ${fallbackName}`);

      const { error: fallbackErr } = await supabase.storage
        .from(BUCKET)
        .upload(fallbackName, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (fallbackErr) {
        console.error("Fallback upload also failed:", fallbackErr.message, fallbackErr);
        return NextResponse.json(
          { error: `Upload failed: ${uploadErr.message}. Fallback: ${fallbackErr.message}` },
          { status: 500 }
        );
      }

      // Fallback succeeded
      const { data: fbUrl } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fallbackName);

      return NextResponse.json({ url: fbUrl.publicUrl });
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error("AI image error:", error);
    return NextResponse.json({ error: `Internal Server Error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
  }
}

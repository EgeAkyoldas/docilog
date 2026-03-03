import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";

/**
 * POST /api/v1/[project-slug]/upload — Upload image to Supabase Storage.
 * Accepts multipart form data with `file` and optional `folder` fields.
 * Returns the public URL of the uploaded file.
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) ?? "articles";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      // Images
      "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif",
      // Video
      "video/mp4", "video/webm", "video/quicktime",
      // Audio
      "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/aac", "audio/x-m4a",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: jpg, png, webp, gif, mp4, webm, mov, mp3, wav, ogg, m4a" },
        { status: 400 }
      );
    }

    // Max 50MB for video/audio, 5MB for images
    const isMedia = file.type.startsWith("video/") || file.type.startsWith("audio/");
    const maxSize = isMedia ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large. Max ${isMedia ? "50MB" : "5MB"}.` }, { status: 400 });
    }

    const supabase = createAdminClient();

    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${projectSlug}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // All files go to "articles" bucket (images, video, audio all allowed)
    const { data, error } = await supabase.storage
      .from("articles")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("[Upload] Storage error:", JSON.stringify(error));
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrl } = supabase.storage
      .from("articles")
      .getPublicUrl(data.path);

    console.log(`[Upload] Success: ${file.type} → ${publicUrl.publicUrl}`);

    return NextResponse.json({
      url: publicUrl.publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

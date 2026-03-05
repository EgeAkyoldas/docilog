import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";
import { z } from "zod";

/**
 * GET    /api/v1/[project-slug]/campaigns/[id]/posts/[postId]
 * PUT    /api/v1/[project-slug]/campaigns/[id]/posts/[postId]
 * DELETE /api/v1/[project-slug]/campaigns/[id]/posts/[postId]
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string; id: string; postId: string }> }
) {
  const { "project-slug": projectSlug, postId } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data: post, error } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error || !post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post });
  } catch (err) {
    console.error("[post GET]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const updatePostSchema = z.object({
  image_url: z.string().nullable().optional(),
  caption: z.string().optional(),
  caption_en: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().nullable().optional(),
  alt_text: z.string().optional(),
  cta: z.string().nullable().optional(),
  visual_prompt: z.string().optional(),
  aspect_ratio: z.enum(["1:1", "3:4", "9:16", "16:9"]).optional(),
  post_type: z.enum(["feed", "reel", "story", "carousel"]).optional(),
  status: z.enum(["draft", "ready", "published"]).optional(),
  scheduled_at: z.string().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string; id: string; postId: string }> }
) {
  const { "project-slug": projectSlug, postId } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = updatePostSchema.parse(body);
    const supabase = createAdminClient();

    const { data: post, error } = await supabase
      .from("social_posts")
      .update(data)
      .eq("id", postId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ post });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: err.issues }, { status: 400 });
    }
    console.error("[post PUT]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string; id: string; postId: string }> }
) {
  const { "project-slug": projectSlug, postId } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("social_posts").delete().eq("id", postId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[post DELETE]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

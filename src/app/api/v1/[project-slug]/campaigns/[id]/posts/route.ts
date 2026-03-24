import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";
import { z } from "zod";

/**
 * GET    /api/v1/[project-slug]/campaigns/[id]/posts — List posts
 * POST   /api/v1/[project-slug]/campaigns/[id]/posts — Create post
 * DELETE /api/v1/[project-slug]/campaigns/[id]/posts — Bulk delete posts
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string; id: string }> }
) {
  const { "project-slug": projectSlug, id: campaignId } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data: posts, error } = await supabase
      .from("social_posts")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ posts: posts ?? [] });
  } catch (err) {
    console.error("[posts GET]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const createPostSchema = z.object({
  image_url: z.string().nullable().optional(),
  caption: z.string().default(""),
  caption_en: z.string().default(""),
  hashtags: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  location: z.string().nullable().optional(),
  alt_text: z.string().default(""),
  cta: z.string().nullable().optional(),
  visual_prompt: z.string().default(""),
  aspect_ratio: z.enum(["1:1", "3:4", "9:16", "16:9"]).default("1:1"),
  post_type: z.enum(["feed", "reel", "story", "carousel"]).default("feed"),
  status: z.enum(["draft", "ready", "published"]).default("draft"),
  scheduled_at: z.string().nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string; id: string }> }
) {
  const { "project-slug": projectSlug, id: campaignId } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createPostSchema.parse(body);
    const supabase = createAdminClient();

    // Resolve project_id
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", projectSlug)
      .single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { data: post, error } = await supabase
      .from("social_posts")
      .insert({ ...data, campaign_id: campaignId, project_id: project.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: err.issues }, { status: 400 });
    }
    console.error("[posts POST]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string; id: string }> }
) {
  const { "project-slug": projectSlug, id: campaignId } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids } = z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(body);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("social_posts")
      .delete()
      .eq("campaign_id", campaignId)
      .in("id", ids);

    if (error) throw error;
    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: err.issues }, { status: 400 });
    }
    console.error("[posts BULK DELETE]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

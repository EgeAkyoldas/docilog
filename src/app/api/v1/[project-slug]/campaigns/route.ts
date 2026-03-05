import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";
import { z } from "zod";

/**
 * GET  /api/v1/[project-slug]/campaigns — List all campaigns
 * POST /api/v1/[project-slug]/campaigns — Create a campaign
 */

async function resolveProject(supabase: ReturnType<typeof createAdminClient>, slug: string) {
  const { data, error } = await supabase.from("projects").select("id").eq("slug", slug).single();
  if (error || !data) return null;
  return data;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string }> }
) {
  const { "project-slug": projectSlug } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const project = await resolveProject(supabase, projectSlug);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { data: campaigns, error } = await supabase
      .from("social_campaigns")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Enrich with post counts
    const enriched = await Promise.all(
      (campaigns ?? []).map(async (c) => {
        const { count } = await supabase
          .from("social_posts")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", c.id);
        return { ...c, post_count: count ?? 0 };
      })
    );

    return NextResponse.json({ campaigns: enriched });
  } catch (err) {
    console.error("[campaigns GET]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  aim: z.string().default(""),
  persona_name: z.string().default(""),
  platform: z.string().default("instagram"),
});

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
    const body = await request.json();
    const data = createSchema.parse(body);
    const supabase = createAdminClient();
    const project = await resolveProject(supabase, projectSlug);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { data: campaign, error } = await supabase
      .from("social_campaigns")
      .insert({ ...data, project_id: project.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: err.issues }, { status: 400 });
    }
    console.error("[campaigns POST]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

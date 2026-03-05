import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";
import { z } from "zod";

/**
 * GET    /api/v1/[project-slug]/campaigns/[id]
 * PUT    /api/v1/[project-slug]/campaigns/[id]
 * DELETE /api/v1/[project-slug]/campaigns/[id]
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string; id: string }> }
) {
  const { "project-slug": projectSlug, id } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data: campaign, error } = await supabase
      .from("social_campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error("[campaign GET]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  aim: z.string().optional(),
  persona_name: z.string().optional(),
  platform: z.string().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string; id: string }> }
) {
  const { "project-slug": projectSlug, id } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);
    const supabase = createAdminClient();

    const { data: campaign, error } = await supabase
      .from("social_campaigns")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ campaign });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: err.issues }, { status: 400 });
    }
    console.error("[campaign PUT]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string; id: string }> }
) {
  const { "project-slug": projectSlug, id } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("social_campaigns").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[campaign DELETE]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

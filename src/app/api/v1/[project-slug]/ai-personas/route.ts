import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { loadAIPrompts } from "@/lib/ai-prompts";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";

/**
 * GET /api/v1/[project-slug]/ai-personas — List all personas for project
 * Falls back to YAML configuration when DB is empty or project not yet migrated.
 */
export async function GET(
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

    // If project not in DB yet, serve personas from YAML
    if (!project) {
      try {
        const yaml = loadAIPrompts(projectSlug);
        const personaRows = Object.entries(yaml.personas || {}).map(
          ([id, p], index) => ({
            id,
            project_id: "preview-mode",
            name: p.name,
            tone: p.tone || "",
            instruction: p.instruction || "",
            writing_style_rules: p.writing_style_rules ?? "",
            negative_constraints: p.negative_constraints ?? "",
            sort_order: index,
            is_active: true,
          })
        );
        return NextResponse.json({ personas: personaRows });
      } catch {
        return NextResponse.json({ personas: [] });
      }
    }

    const { data, error } = await supabase
      .from("project_personas")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If DB has personas, use them
    if (data && data.length > 0) {
      return NextResponse.json({ personas: data });
    }

    // DB empty — fallback to YAML and return (without seeding)
    try {
      const yaml = loadAIPrompts(projectSlug);
      const personaRows = Object.entries(yaml.personas || {}).map(
        ([id, p], index) => ({
          id,
          project_id: project.id,
          name: p.name,
          tone: p.tone || "",
          instruction: p.instruction || "",
          writing_style_rules: p.writing_style_rules ?? "",
          negative_constraints: p.negative_constraints ?? "",
          sort_order: index,
          is_active: true,
        })
      );
      return NextResponse.json({ personas: personaRows });
    } catch {
      return NextResponse.json({ personas: [] });
    }
  } catch (error) {
    console.error("Personas list error:", error);
    return NextResponse.json(
      { error: "Failed to load personas" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/[project-slug]/ai-personas — Create a new persona
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

    const body = await request.json();
    const supabase = createAdminClient();

    const { data: project } = await supabase.from("projects").select("id").eq("slug", projectSlug).single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (!body.id || !body.name) {
      return NextResponse.json(
        { error: "id and name are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("project_personas").insert({
      id: body.id,
      project_id: project.id,
      name: body.name,
      tone: body.tone ?? "",
      instruction: body.instruction ?? "",
      writing_style_rules: body.writing_style_rules ?? "",
      negative_constraints: body.negative_constraints ?? "",
      sort_order: body.sort_order ?? 99,
      is_active: body.is_active ?? true,
    });

    if (error) {
      console.error("Persona create error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Persona create error:", error);
    return NextResponse.json(
      { error: "Failed to create persona" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/[project-slug]/ai-personas — Update an existing persona
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string }> }
) {
  try {
    const { "project-slug": projectSlug } = await params;
    const user = await verifyAuth(request);
    if (!user || !(await checkProjectAccess(user, projectSlug))) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createAdminClient();

    const { data: project } = await supabase.from("projects").select("id").eq("slug", projectSlug).single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (!body.id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("project_personas")
      .update({
        name: body.name,
        tone: body.tone,
        instruction: body.instruction,
        writing_style_rules: body.writing_style_rules,
        negative_constraints: body.negative_constraints,
        sort_order: body.sort_order,
        is_active: body.is_active,
      })
      .eq("id", body.id)
      .eq("project_id", project.id);

    if (error) {
      console.error("Persona update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Persona update error:", error);
    return NextResponse.json(
      { error: "Failed to update persona" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/[project-slug]/ai-personas — Delete a persona
 */
export async function DELETE(
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
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("project_personas")
      .delete()
      .eq("id", id)
      .eq("project_id", project.id);

    if (error) {
      console.error("Persona delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Persona delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete persona" },
      { status: 500 }
    );
  }
}

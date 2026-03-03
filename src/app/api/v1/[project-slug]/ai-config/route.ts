import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { loadAIPrompts } from "@/lib/ai-prompts";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";

/**
 * GET /api/v1/[project-slug]/ai-config — Load AI configuration
 * Returns config from database, seeded from YAML if empty.
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
    
    // If project is not in DB yet, serve directly from YAML without saving
    if (!project) {
      const yaml = loadAIPrompts(projectSlug);
      const personaRows = Object.entries(yaml.personas).map(
        ([id, p], index) => ({
          id,
          project_id: "preview-mode",
          name: p.name,
          tone: p.tone,
          instruction: p.instruction,
          writing_style_rules: p.writing_style_rules ?? "",
          negative_constraints: p.negative_constraints ?? "",
          sort_order: index,
          is_active: true,
        })
      );

      return NextResponse.json({
        config: {
          system_instruction: yaml.system_instruction,
          global_rules: yaml.global_rules,
          actions: yaml.actions,
          image_prompt: yaml.image_prompt,
          persona_defaults: yaml.persona ?? {},
        },
        personas: personaRows,
      });
    }

    // Try loading from DB
    const { data: config } = await supabase
      .from("project_ai_config")
      .select("*")
      .eq("project_id", project.id)
      .single();

    const { data: personas } = await supabase
      .from("project_personas")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true });

    // If DB is empty, seed from YAML
    if (!config) {
      const yaml = loadAIPrompts(projectSlug);

      const configRow = {
        project_id: project.id,
        system_instruction: yaml.system_instruction,
        global_rules: yaml.global_rules,
        actions: yaml.actions,
        image_prompt: yaml.image_prompt,
        persona_defaults: yaml.persona ?? {},
      };

      await supabase.from("project_ai_config").upsert(configRow, { onConflict: "project_id" });

      // Seed personas
      const personaRows = Object.entries(yaml.personas).map(
        ([id, p], index) => ({
          id,
          project_id: project.id,
          name: p.name,
          tone: p.tone,
          instruction: p.instruction,
          writing_style_rules: p.writing_style_rules ?? "",
          negative_constraints: p.negative_constraints ?? "",
          sort_order: index,
          is_active: true,
        })
      );

      if (personaRows.length > 0) {
        await supabase.from("project_personas").upsert(personaRows, { onConflict: "id,project_id" });
      }

      return NextResponse.json({
        config: configRow,
        personas: personaRows,
      });
    }

    return NextResponse.json({
      config,
      personas: personas ?? [],
    });
  } catch (error) {
    console.error("AI config load error:", error);
    return NextResponse.json(
      { error: "Failed to load AI config" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/[project-slug]/ai-config — Update AI configuration
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

    const { error } = await supabase
      .from("project_ai_config")
      .upsert({
        project_id: project.id,
        system_instruction: body.system_instruction,
        global_rules: body.global_rules,
        actions: body.actions,
        image_prompt: body.image_prompt,
        persona_defaults: body.persona_defaults ?? {},
      }, { onConflict: "project_id" });

    if (error) {
      console.error("AI config update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AI config update error:", error);
    return NextResponse.json(
      { error: "Failed to update AI config" },
      { status: 500 }
    );
  }
}

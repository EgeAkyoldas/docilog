import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";
import { z } from "zod";

/**
 * GET /api/v1/[project-slug]/articles/[id] — Get single article with all translations.
 * PUT /api/v1/[project-slug]/articles/[id] — Update article + upsert translation.
 * DELETE /api/v1/[project-slug]/articles/[id] — Delete article (cascades to translations).
 */

// GET — Single article with translations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string; id: string }> }
) {
  const { "project-slug": projectSlug, id } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();

  // Resolve slug → project UUID
  const { data: proj } = await supabase.from("projects").select("id").eq("slug", projectSlug).single();
  if (!proj) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: article, error: artErr } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .eq("project_id", proj.id)
    .single();

  if (artErr || !article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: translations } = await supabase
    .from("article_translations")
    .select("*")
    .eq("article_id", id);

  return NextResponse.json({ article, translations: translations ?? [] });
}

// PUT — Update article + upsert translation
const updateSchema = z.object({
  slug: z.string().optional(),
  category: z.string().optional(),
  language: z.enum(["tr", "en"]),
  title: z.string().min(1),
  content: z.string().min(1),
  thumbnail: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]),
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

    // Update article metadata if provided
    if (data.slug || data.category) {
      const updates: Record<string, string> = { updated_at: new Date().toISOString() };
      if (data.slug) updates.slug = data.slug;
      if (data.category) updates.category = data.category;

      // Resolve slug → project UUID
      const { data: proj2 } = await supabase.from("projects").select("id").eq("slug", projectSlug).single();
      if (!proj2) return NextResponse.json({ error: "Project not found" }, { status: 404 });
      const { data: existing, error: err } = await supabase.from("articles").select("id").eq("id", id).eq("project_id", proj2.id).single();
      if (!existing || err) {
         return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
      }

      await supabase.from("articles").update(updates).eq("id", id);
    }

    // Upsert translation (insert or update based on article_id + language)
    const { error: transErr } = await supabase
      .from("article_translations")
      .upsert(
        {
          article_id: id,
          language: data.language,
          title: data.title,
          content: data.content,
          status: data.status,
          thumbnail: data.thumbnail ?? null,
          meta_description: data.meta_description ?? null,
        },
        { onConflict: "article_id,language" }
      );

    if (transErr) throw transErr;

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update article:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE — Delete article (cascades to translations via FK)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string; id: string }> }
) {
  const { "project-slug": projectSlug, id } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Resolve slug → project UUID
  const { data: proj3 } = await supabase.from("projects").select("id").eq("slug", projectSlug).single();
  if (!proj3) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const { data: existing, error: err } = await supabase.from("articles").select("id").eq("id", id).eq("project_id", proj3.id).single();
  if (!existing || err) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
  }

  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createAdminClient } from "@/lib/supabase";

/**
 * GET /api/v1/[project-slug]/public/articles/[slug] — Public single article detail.
 * Query params: ?locale=tr (default: tr)
 *
 * This is the endpoint your CONSUMER website will call for article detail pages.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string; slug: string }> }
) {
  try {
    const { "project-slug": projectSlug, slug } = await params;
    const locale = request.nextUrl.searchParams.get("locale") || "tr";
    const supabasePublic = createPublicClient();
    const supabaseAdmin = createAdminClient();

    // Verify project exists and get its ID
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("id, is_active")
      .eq("slug", projectSlug)
      .single();

    if (!project || !project.is_active) {
      return NextResponse.json({ error: "Project not found or inactive" }, { status: 404 });
    }

    // Get article by slug and project_id
    const { data: article, error: artErr } = await supabasePublic
      .from("articles")
      .select("id, slug, category, created_at, project_id")
      .eq("slug", slug)
      .eq("project_id", project.id)
      .single();

    if (artErr || !article) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get translation for locale
    const { data: translation } = await supabasePublic
      .from("article_translations")
      .select("*")
      .eq("article_id", article.id)
      .eq("language", locale)
      .eq("status", "published")
      .single();

    if (!translation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      article: {
        id: article.id,
        slug: article.slug,
        category: article.category,
        created_at: article.created_at,
        title: translation.title,
        content: translation.content,
        language: translation.language,
        meta_description: translation.meta_description ?? null,
        thumbnail: translation.thumbnail ?? null,
      },
    });
  } catch (error) {
    console.error("Article detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

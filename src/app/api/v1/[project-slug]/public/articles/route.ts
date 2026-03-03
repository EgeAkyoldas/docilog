import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createAdminClient } from "@/lib/supabase";

/**
 * GET /api/v1/[project-slug]/public/articles — Public list of published articles.
 * Query params: ?locale=tr (default: tr)
 *
 * This is the endpoint your CONSUMER website will call to fetch a project's articles.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string }> }
) {
  try {
    const { "project-slug": projectSlug } = await params;
    const locale = request.nextUrl.searchParams.get("locale") || "tr";
    const supabasePublic = createPublicClient();
    const supabaseAdmin = createAdminClient();

    // Verify project exists and is active, getting its ID
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("id, is_active")
      .eq("slug", projectSlug)
      .single();

    if (!project || !project.is_active) {
      return NextResponse.json({ error: "Project not found or inactive" }, { status: 404 });
    }

    const { data: translations, error } = await supabasePublic
      .from("article_translations")
      .select(`
        title,
        status,
        article_id,
        articles!inner (
          id,
          slug,
          category,
          project_id,
          created_at
        )
      `)
      .eq("language", locale)
      .eq("status", "published")
      .eq("articles.project_id", project.id)
      .order("article_id", { ascending: false });

    if (error) throw error;

    const articles = (translations ?? []).map((t) => {
      const article = t.articles as unknown as {
        id: string;
        slug: string;
        category: string;
        created_at: string;
      };
      return {
        id: article.id,
        slug: article.slug,
        category: article.category,
        created_at: article.created_at,
        title: t.title,
        status: t.status,
      };
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Public articles error:", error);
    return NextResponse.json({ articles: [] });
  }
}

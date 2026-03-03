import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";
import { z } from "zod";

/**
 * GET /api/v1/[project-slug]/articles — List all articles for project.
 * POST /api/v1/[project-slug]/articles — Create a new article.
 */

// GET — List all
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

    // Resolve slug → project UUID
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", projectSlug)
      .single();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: allArticles, error: artErr } = await supabase
      .from("articles")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (artErr) throw artErr;

    const result = await Promise.all(
      (allArticles ?? []).map(async (article) => {
        const { data: translations } = await supabase
          .from("article_translations")
          .select("language, title, status")
          .eq("article_id", article.id);

        const tr = translations?.find((t) => t.language === "tr");
        const en = translations?.find((t) => t.language === "en");

        return {
          id: article.id,
          slug: article.slug,
          category: article.category,
          created_at: article.created_at,
          tr_title: tr?.title ?? null,
          tr_status: tr?.status ?? null,
          en_title: en?.title ?? null,
          en_status: en?.status ?? null,
        };
      })
    );

    return NextResponse.json({ articles: result });
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST — Create new article
const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  category: z.string().min(1),
  language: z.enum(["tr", "en"]),
  content: z.string().min(1),
  thumbnail: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]),
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

    // Sanitize category — AI may send "macro_economics/global_markets/..." → take first
    const sanitizedCategory = data.category.includes("/")
      ? data.category.split("/")[0].trim()
      : data.category;

    // Resolve slug → project UUID
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", projectSlug)
      .single();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create article
    const { data: article, error: artErr } = await supabase
      .from("articles")
      .insert({ slug: data.slug, category: sanitizedCategory, project_id: project.id })
      .select()
      .single();

    if (artErr) throw artErr;

    // Create translation
    const { error: transErr } = await supabase
      .from("article_translations")
      .insert({
        article_id: article.id,
        language: data.language,
        title: data.title,
        content: data.content,
        status: data.status,
        thumbnail: data.thumbnail ?? null,
        meta_description: data.meta_description ?? null,
      });

    if (transErr) throw transErr;

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create article:", JSON.stringify(error, null, 2));
    const supaErr = error as { message?: string; code?: string; hint?: string; details?: string };
    return NextResponse.json(
      { error: supaErr?.message ?? "Internal Server Error", code: supaErr?.code, hint: supaErr?.hint, details: supaErr?.details },
      { status: 500 }
    );
  }
}

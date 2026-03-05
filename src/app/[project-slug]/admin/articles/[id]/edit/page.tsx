import ArticleEditor from "@/components/admin/ArticleEditor";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.log(`[INDEX-12] Rendering EditArticlePage (/admin/articles/${id}/edit)`);
  return <ArticleEditor articleId={id} />;
}

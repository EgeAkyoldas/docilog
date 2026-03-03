import { redirect } from "next/navigation";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ "project-slug": string }>;
}) {
  const { "project-slug": slug } = await params;
  redirect(`/${slug}/admin/articles`);
}

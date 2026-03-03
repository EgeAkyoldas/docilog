import type { Metadata } from "next";

/* Slug → display name mapping */
const PROJECT_NAMES: Record<string, string> = {
  "music-blog": "Müzik Eğitimi",
  "finance-blog": "Finans & Ekonomi",
  "psychology-blog": "Psikoloji",
  "law-blog": "Hukuk",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "project-slug": string }>;
}): Promise<Metadata> {
  const { "project-slug": slug } = await params;
  const projectName = PROJECT_NAMES[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return {
    title: {
      template: `%s — ${projectName}`,
      default: `${projectName} — Docilog`,
    },
    description: `${projectName} blog yönetim paneli — Docilog`,
  };
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

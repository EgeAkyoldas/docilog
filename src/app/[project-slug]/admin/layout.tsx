import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/project-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faPenFancy,
  faWandMagicSparkles,
  faGlobe,
  faCircleQuestion,
  faHome,
} from "@fortawesome/free-solid-svg-icons";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ "project-slug": string }>;
}) {
  const { "project-slug": slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="w-[260px] bg-pure-white border-r border-border shrink-0 sticky top-0 h-screen overflow-y-auto hidden lg:flex flex-col">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/hub"
              className="text-muted hover:text-heading transition-colors text-[11px] font-medium uppercase tracking-wider no-underline flex items-center gap-1.5"
            >
              <FontAwesomeIcon icon={faHome} className="fa-sm" />
              Hub
            </Link>
          </div>
          <Link
            href={`/${slug}/admin/articles`}
            className="no-underline flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-lg bg-charcoal flex items-center justify-center text-lg text-white">
              {project.icon}
            </div>
            <div>
              <div className="text-heading text-[15px] font-bold tracking-tight">
                {project.name}
              </div>
              <div className="text-muted text-[10px] font-semibold tracking-widest uppercase">
                Yönetim Paneli
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="label text-muted px-3 mb-2">İÇERİK</div>
          <Link
            href={`/${slug}/admin/articles`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-secondary hover:text-heading hover:bg-surface transition-all no-underline"
          >
            <FontAwesomeIcon icon={faFileLines} className="fa-sm w-4" />
            Makaleler
          </Link>
          <Link
            href={`/${slug}/admin/articles/new`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-secondary hover:text-heading hover:bg-surface transition-all no-underline"
          >
            <FontAwesomeIcon icon={faPenFancy} className="fa-sm w-4" />
            Yeni Makale
          </Link>
          <Link
            href={`/${slug}/admin/campaigns`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-secondary hover:text-heading hover:bg-surface transition-all no-underline"
          >
            <span className="w-4 text-center text-[13px]">📱</span>
            Kampanyalar
          </Link>

          <div className="label text-muted px-3 mb-2 mt-6">AYARLAR</div>
          <Link
            href={`/${slug}/admin/ai-config`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-secondary hover:text-heading hover:bg-surface transition-all no-underline"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} className="fa-sm w-4" />
            AI Ayarları
          </Link>

          <div className="label text-muted px-3 mb-2 mt-6">GÖRÜNTÜLE</div>
          <Link
            href={`/${slug}/blog`}
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-secondary hover:text-heading hover:bg-surface transition-all no-underline"
          >
            <FontAwesomeIcon icon={faGlobe} className="fa-sm w-4" />
            Blog Sayfası
          </Link>

          <div className="label text-muted px-3 mb-2 mt-6">YARDIM</div>
          <Link
            href={`/${slug}/admin/guide`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-secondary hover:text-heading hover:bg-surface transition-all no-underline"
          >
            <FontAwesomeIcon icon={faCircleQuestion} className="fa-sm w-4" />
            Editör Rehberi
          </Link>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <p className="text-[10px] text-muted font-medium line-clamp-1">
            {project.description}
          </p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-pure-white border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/hub" className="text-muted pr-2 border-r border-border">
            <FontAwesomeIcon icon={faHome} />
          </Link>
          <Link
            href={`/${slug}/admin/articles`}
            className="no-underline flex items-center gap-2"
          >
            <div className="w-7 h-7 rounded-md bg-charcoal flex items-center justify-center text-sm text-white">
              {project.icon}
            </div>
            <span className="text-heading text-[14px] font-bold">
              {project.name}
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${slug}/admin/articles`}
            className="text-muted hover:text-heading no-underline"
          >
            <FontAwesomeIcon icon={faFileLines} />
          </Link>
          <Link
            href={`/${slug}/admin/articles/new`}
            className="text-muted hover:text-heading no-underline"
          >
            <FontAwesomeIcon icon={faPenFancy} />
          </Link>
          <Link
            href={`/${slug}/admin/ai-config`}
            className="text-muted hover:text-heading no-underline"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} />
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:px-10 lg:py-8 px-4 py-4 pt-16 lg:pt-8 overflow-x-hidden">
        <div className="max-w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}

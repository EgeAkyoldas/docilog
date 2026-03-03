"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth";

interface ProjectCard {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  article_count?: number;
  updated_at: string;
}

export default function HubPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Check auth
      const meRes = await fetch("/api/v1/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      // Load projects
      const projRes = await fetch("/api/v1/hub/projects");
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData.projects ?? []);
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-muted-slate border-t-charcoal rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-pure-white border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-charcoal flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <div>
              <h1
                className="text-heading text-[16px] font-bold tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Docilog
              </h1>
              <p className="text-muted text-[10px] font-semibold tracking-widest uppercase">
                {user?.role === "master_admin" ? "Master Admin" : "Projelerim"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-heading text-[13px] font-medium">
                {user?.display_name}
              </p>
              <p className="text-muted text-[10px]">@{user?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary text-[11px] py-1.5 px-3"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h2
            className="text-heading text-[24px]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Projeler
          </h2>
          <p className="text-secondary text-[13px] mt-1">
            Blog projelerinizi yönetin ve yeni projeler oluşturun
          </p>
        </motion.div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, i) => (
            <motion.button
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              onClick={() => router.push(`/${project.slug}/admin/articles`)}
              className="card-boutique p-6 text-left group cursor-pointer"
            >
              {/* Icon + Name */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center text-xl shrink-0 group-hover:bg-surface-raised transition-colors">
                  {project.icon}
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-heading text-[15px] font-semibold truncate group-hover:text-charcoal transition-colors"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {project.name}
                  </h3>
                  <p className="text-muted text-[11px] font-mono">
                    /{project.slug}
                  </p>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-secondary text-[12px] leading-relaxed line-clamp-2 mb-4">
                  {project.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 pt-3 border-t border-border">
                <span className="text-muted text-[11px]">
                  {project.article_count ?? 0} makale
                </span>
                <span className="text-muted text-[10px]">
                  {new Date(project.updated_at).toLocaleDateString("tr-TR")}
                </span>
              </div>
            </motion.button>
          ))}

          {/* New Project Card (master admin only) */}
          {user?.role === "master_admin" && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: projects.length * 0.08 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              onClick={() => router.push("/hub/projects/new")}
              className="border-2 border-dashed border-border rounded-[10px] p-6 flex flex-col items-center justify-center gap-3 min-h-[180px] text-muted hover:text-heading hover:border-charcoal transition-all cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center text-2xl group-hover:bg-surface-raised transition-colors">
                +
              </div>
              <span className="text-[13px] font-medium">Yeni Proje</span>
            </motion.button>
          )}
        </div>

        {/* Empty State */}
        {projects.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-20"
          >
            <p className="text-secondary text-[14px]">
              Henüz hiç proje bulunmuyor.
            </p>
            {user?.role === "master_admin" && (
              <button
                onClick={() => router.push("/hub/projects/new")}
                className="btn-primary mt-4"
              >
                İlk Projeyi Oluştur
              </button>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

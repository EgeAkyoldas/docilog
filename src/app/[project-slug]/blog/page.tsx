"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Tag } from "lucide-react";

interface ArticleSummary {
  id: string;
  slug: string;
  category: string;
  created_at: string;
  title: string;
  status: string;
}

const categoryLabels: Record<string, string> = {
  theory: "Müzik Teorisi",
  instrument: "Enstrüman",
  ear_training: "Kulak Eğitimi",
  sight_reading: "Deşifre",
  performance: "Performans",
  exam_prep: "Sınav Hazırlık",
  other: "Genel",
};

export default function ProjectBlogPage() {
  const params = useParams<{ "project-slug": string }>();
  const projectSlug = params["project-slug"];
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/${projectSlug}/public/articles`);
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectSlug]);

  const published = articles.filter((a) => a.status === "published");

  return (
    <section className="section-pad bg-surface min-h-screen">
      <div className="mx-auto max-w-[900px]">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-heading text-[36px] mb-8"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Blog
        </motion.h1>

        {loading ? (
          <p className="text-muted text-center py-20">Yükleniyor...</p>
        ) : published.length === 0 ? (
          <p className="text-secondary text-center py-20">
            Henüz yayınlanmış makale bulunmuyor.
          </p>
        ) : (
          <div className="space-y-6">
            {published.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/${projectSlug}/blog/${article.slug}`}
                  className="block p-6 rounded-lg border border-border bg-surface-raised hover:border-gold-accent/40 transition-all no-underline group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="label text-muted text-[10px] bg-surface px-2.5 py-1 rounded flex items-center gap-1.5">
                      <Tag size={10} />
                      {categoryLabels[article.category] ?? article.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] text-muted">
                      <Calendar size={12} />
                      {new Date(article.created_at).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h2 className="text-heading text-[20px] group-hover:text-gold-accent transition-colors">
                    {article.title ?? article.slug}
                  </h2>
                  <span className="flex items-center gap-1 text-[13px] text-secondary mt-3 group-hover:text-gold-accent transition-colors">
                    Devamını oku <ArrowRight size={14} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

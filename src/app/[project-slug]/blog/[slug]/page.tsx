"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft, Tag, BookOpen, Type } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ArticleData {
  id: string;
  slug: string;
  category: string;
  created_at: string;
  title: string;
  content: string;
  language: string;
  thumbnail: string | null;
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

export default function ProjectBlogDetailPage() {
  const params = useParams<{ "project-slug": string; slug: string }>();
  const projectSlug = params["project-slug"];
  const slug = params.slug;

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/v1/${projectSlug}/public/articles/${slug}`
        );
        if (res.ok) {
          const data = await res.json();
          setArticle(data.article);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectSlug, slug]);

  if (loading) {
    return (
      <section className="section-pad bg-surface min-h-screen">
        <div className="mx-auto max-w-[800px] text-center text-muted py-20">
          Yükleniyor...
        </div>
      </section>
    );
  }

  if (notFound || !article) {
    return (
      <section className="section-pad bg-surface min-h-screen">
        <div className="mx-auto max-w-[800px] text-center py-20">
          <h2
            className="text-heading text-[28px] mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Makale Bulunamadı
          </h2>
          <p className="text-secondary text-[15px] mb-8">
            Bu makale henüz yayınlanmamış veya mevcut değil.
          </p>
          <Link
            href={`/${projectSlug}/blog`}
            className="btn-primary no-underline inline-flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            Tüm Makaleler
          </Link>
        </div>
      </section>
    );
  }

  const text = article.content.replace(/<[^>]*>/g, "").trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const readMin = Math.max(1, Math.round(words / 200));

  return (
    <section className="section-pad bg-surface min-h-screen">
      <article className="mx-auto max-w-[800px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-10"
        >
          <Link
            href={`/${projectSlug}/blog`}
            className="flex items-center gap-2 text-[13px] text-secondary hover:text-deep-navy dark:hover:text-gold-accent transition-colors no-underline"
          >
            <ArrowLeft size={14} />
            Tüm Makaleler
          </Link>
        </motion.div>

        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="label text-muted text-[10px] bg-surface-raised dark:bg-surface px-2.5 py-1 micro-radius flex items-center gap-1.5">
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
            <span className="flex items-center gap-1.5 text-[12px] text-muted">
              <BookOpen size={12} />
              {readMin} dk okuma
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-muted">
              <Type size={12} />
              {words.toLocaleString("tr-TR")} kelime
            </span>
          </div>

          <h1
            className="text-heading text-[32px] md:text-[42px] leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {article.title}
          </h1>

          {article.thumbnail && (
            <div
              className="mt-8 rounded-lg overflow-hidden relative w-full"
              style={{ aspectRatio: "16/7" }}
            >
              <Image
                src={article.thumbnail}
                alt={article.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 800px) 100vw, 800px"
              />
            </div>
          )}
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="article-content max-w-none"
          style={{
            fontFamily: "var(--font-body)",
            lineHeight: "1.9",
            fontSize: "16px",
          }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-16 pt-8 border-t border-border"
        >
          <Link
            href={`/${projectSlug}/blog`}
            className="flex items-center gap-2 text-[13px] text-secondary hover:text-deep-navy dark:hover:text-gold-accent transition-colors no-underline"
          >
            <ArrowLeft size={14} />
            Tüm Makalelere Dön
          </Link>
        </motion.div>
      </article>
    </section>
  );
}

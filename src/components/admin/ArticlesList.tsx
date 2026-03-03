"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faPlus,
  faTrashCan,
  faPen,
  faEye,
  faCalendar,
  faSquareCheck,
  faSquare,
  faFileWord,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

interface Article {
  id: string;
  slug: string;
  category: string;
  created_at: string;
  tr_title: string | null;
  tr_status: string | null;
  en_title: string | null;
  en_status: string | null;
}

const categoryLabels: Record<string, string> = {
  theory: "Teori",
  instrument: "Enstrüman",
  ear_training: "Kulak Eğitimi",
  sight_reading: "Deşifre",
  performance: "Performans",
  exam_prep: "Sınav Haz.",
  other: "Diğer",
};

/* ─── Export helpers ─── */
function htmlToMarkdown(html: string): string {
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, "![]($1)");
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  md = md.replace(/<\/?[ou]l[^>]*>/gi, "\n");
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "> $1\n\n");
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<hr\s*\/?>/gi, "\n---\n\n");
  md = md.replace(/<[^>]+>/g, "");
  md = md.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function fetchArticleContent(id: string, slug: string): Promise<{ title: string; content: string } | null> {
  try {
    const res = await fetch(`/api/v1/${slug}/articles/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    const tr = data.translations?.find((t: { language: string }) => t.language === "tr");
    const en = data.translations?.find((t: { language: string }) => t.language === "en");
    const active = tr || en;
    return active ? { title: active.title, content: active.content } : null;
  } catch {
    return null;
  }
}

export function ArticlesList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const params = useParams();
  const slug = params["project-slug"] as string;

  const loadArticles = async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/v1/${slug}/articles`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) loadArticles();
  }, [slug]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = () => setSelected(new Set(articles.map((a) => a.id)));
  const deselectAll = () => setSelected(new Set());

  const handleDelete = (id: string, title: string) => {
    toast(
      `"${title}" makalesini silmek istediğinize emin misiniz?`,
      {
        duration: 8000,
        action: {
          label: "Evet, Sil",
          onClick: async () => {
            if (!slug) return;
            try {
              const res = await fetch(`/api/v1/${slug}/articles/${id}`, {
                method: "DELETE",
              });
              if (res.ok) {
                setArticles((prev) => prev.filter((a) => a.id !== id));
                setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
                toast.success("Makale başarıyla silindi");
              } else {
                toast.error("Silme işlemi başarısız oldu");
              }
            } catch {
              toast.error("Bir hata oluştu");
            }
          },
        },
        cancel: {
          label: "İptal",
          onClick: () => {},
        },
      }
    );
  };

  /* ─── Batch export ─── */
  const batchExport = async (format: "md" | "doc" | "pdf") => {
    if (selected.size === 0) return;
    setExporting(true);
    toast.info(`${selected.size} makale dışa aktarılıyor...`);

    const contents: { title: string; content: string }[] = [];
    for (const id of selected) {
      if (!slug) continue;
      const article = await fetchArticleContent(id, slug);
      if (article) contents.push(article);
    }

    if (contents.length === 0) {
      toast.error("Makale içeriği alınamadı");
      setExporting(false);
      return;
    }

    if (format === "md") {
      // Combined markdown
      const md = contents.map((c) => `# ${c.title}\n\n${htmlToMarkdown(c.content)}`).join("\n\n---\n\n");
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      downloadBlob(blob, `makaleler-${contents.length}.md`);
    } else if (format === "doc") {
      const docContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8">
        <style>
          body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; max-width: 680px; margin: 0 auto; }
          h1 { font-size: 22pt; font-weight: bold; margin-bottom: 12pt; page-break-before: always; }
          h1:first-child { page-break-before: avoid; }
          h2 { font-size: 16pt; font-weight: bold; margin-top: 18pt; }
          p { margin-bottom: 8pt; }
          img { max-width: 100%; }
        </style></head><body>
        ${contents.map((c) => `<h1>${c.title}</h1>${c.content}`).join("<hr>")}
        </body></html>`;
      const blob = new Blob([docContent], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      downloadBlob(blob, `makaleler-${contents.length}.doc`);
    } else {
      // PDF direct download via jspdf + html2canvas
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:680px;padding:40px;font-family:Inter,sans-serif;font-size:11pt;line-height:1.7;color:#1a1a1a;background:#fff;";
      container.innerHTML = contents
        .map((c) => `<h1 style="font-size:24pt;font-weight:700;margin-bottom:16pt;color:#0d0f1a">${c.title}</h1>${c.content}`)
        .join('<hr style="margin:32px 0;border:none;border-top:1px solid #ddd">');
      container.querySelectorAll("img").forEach((img) => {
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.crossOrigin = "anonymous";
      });
      document.body.appendChild(container);

      try {
        const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, windowWidth: 760 });
        const imgWidth = 190;
        const pageHeight = 277;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pdf = new jsPDF("p", "mm", "a4");
        let heightLeft = imgHeight;
        let position = 10;
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight + 10;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save(`makaleler-${contents.length}.pdf`);
      } finally {
        document.body.removeChild(container);
      }
    }

    toast.success(`${contents.length} makale dışa aktarıldı`);
    setExporting(false);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-10"
      >
        <div>
          <div className="label text-muted mb-1">İÇERİK YÖNETİMİ</div>
          <h1
            className="text-deep-navy text-[28px]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Makaleler
          </h1>
        </div>
        {slug && (
          <Link
            href={`/${slug}/admin/articles/new`}
            className="btn-primary no-underline flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} className="fa-sm" />
            Yeni Makale
          </Link>
        )}
      </motion.div>

      {/* Selection actions bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 card-boutique border-deep-navy flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-deep-navy">
                {selected.size} makale seçili
              </span>
              <button onClick={selectAll} className="text-[11px] text-secondary hover:text-heading underline">
                Tümünü Seç
              </button>
              <button onClick={deselectAll} className="text-[11px] text-secondary hover:text-heading underline">
                Seçimi Kaldır
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => batchExport("md")}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold micro-radius border border-border text-secondary hover:text-heading hover:border-heading transition-all disabled:opacity-40"
              >
                <FontAwesomeIcon icon={faFileLines} className="fa-sm" /> MD
              </button>
              <button
                onClick={() => batchExport("doc")}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold micro-radius border border-border text-secondary hover:text-heading hover:border-heading transition-all disabled:opacity-40"
              >
                <FontAwesomeIcon icon={faFileWord} className="fa-sm" /> DOC
              </button>
              <button
                onClick={() => batchExport("pdf")}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold micro-radius border border-border text-secondary hover:text-heading hover:border-heading transition-all disabled:opacity-40"
              >
                <FontAwesomeIcon icon={faFilePdf} className="fa-sm" /> PDF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-muted text-center py-20">Yükleniyor...</div>
      ) : articles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-boutique p-12 text-center"
        >
          <FontAwesomeIcon icon={faFileLines} className="fa-2xl text-muted-slate mx-auto mb-4 block" />
          <p className="text-secondary text-[14px] mb-6">Henüz makale yok</p>
          {slug && (
            <Link
              href={`/${slug}/admin/articles/new`}
              className="btn-primary no-underline inline-flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} className="fa-sm" />
              İlk Makaleyi Oluştur
            </Link>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-3"
        >
          {articles.map((article) => {
            const isSelected = selected.has(article.id);
            return (
              <div
                key={article.id}
                className={`card-boutique p-6 flex items-center group transition-all ${
                  isSelected
                    ? "border-deep-navy bg-soft-cream/50"
                    : "hover:border-deep-navy"
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(article.id)}
                  className="mr-4 text-muted hover:text-deep-navy transition-colors shrink-0"
                  title={isSelected ? "Seçimi kaldır" : "Seç"}
                >
                  {isSelected ? (
                    <FontAwesomeIcon icon={faSquareCheck} className="fa-lg text-deep-navy" />
                  ) : (
                    <FontAwesomeIcon icon={faSquare} className="fa-lg" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3
                      className="text-deep-navy text-[16px] truncate"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {article.tr_title ?? article.en_title ?? article.slug}
                    </h3>
                    <span className="label text-muted text-[10px] bg-soft-cream px-2 py-0.5 micro-radius shrink-0">
                      {categoryLabels[article.category] ?? article.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[12px] text-secondary">
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faCalendar} className="fa-sm" />
                      {new Date(article.created_at).toLocaleDateString("tr-TR")}
                    </span>
                    <span className="flex items-center gap-1">
                      🇹🇷
                      <span className={article.tr_status === "published" ? "text-emerald-600" : "text-amber-500"}>
                        {article.tr_status === "published" ? "Yayında" : article.tr_status ?? "—"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      🇬🇧
                      <span className={article.en_status === "published" ? "text-emerald-600" : "text-amber-500"}>
                        {article.en_status === "published" ? "Published" : article.en_status ?? "—"}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                  <Link
                    href={`/${slug}/blog/${article.slug}`}
                    target="_blank"
                    className="p-2 text-muted hover:text-deep-navy transition-colors no-underline"
                    title="Önizle"
                  >
                    <FontAwesomeIcon icon={faEye} className="fa-sm" />
                  </Link>
                  <Link
                    href={`/${slug}/admin/articles/${article.id}/edit`}
                    className="p-2 text-muted hover:text-deep-navy transition-colors no-underline"
                    title="Düzenle"
                  >
                    <FontAwesomeIcon icon={faPen} className="fa-sm" />
                  </Link>
                  <button
                    onClick={() =>
                      handleDelete(
                        article.id,
                        article.tr_title ?? article.en_title ?? article.slug
                      )
                    }
                    className="p-2 text-muted hover:text-red-500 transition-colors"
                    title="Sil"
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="fa-sm" />
                  </button>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

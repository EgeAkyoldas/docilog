"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileType, FileDown, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExportDropdownProps {
  title: string;
  content: string; // HTML content from editor
  language: "tr" | "en";
}

/* ─── HTML → Markdown converter (lightweight, no deps) ─── */
function htmlToMarkdown(html: string): string {
  let md = html;

  // Headers
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");

  // Bold, italic, underline
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
  md = md.replace(/<u[^>]*>(.*?)<\/u>/gi, "$1");

  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

  // Images
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, "![$2]($1)");
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, "![]($1)");

  // Lists
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  md = md.replace(/<\/?[ou]l[^>]*>/gi, "\n");

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "> $1\n\n");

  // Code blocks
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "```\n$1\n```\n\n");
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");

  // Paragraphs & breaks
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<hr\s*\/?>/gi, "\n---\n\n");

  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  md = md.replace(/&nbsp;/g, " ");

  // Clean up excess whitespace
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

/* ─── Download helper ─── */
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

/* ─── Slug for filename ─── */
function toFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    .slice(0, 60) || "article";
}

/* ─── DOCX export (Word-compatible HTML with embedded images) ─── */
async function exportAsDocx(title: string, html: string) {
  // Convert external images to base64 for embedding in Word
  const imgRegex = /<img[^>]*src="([^"]+)"[^>]*>/gi;
  let processedHtml = html;
  const imgMatches = [...html.matchAll(imgRegex)];

  for (const match of imgMatches) {
    const imgUrl = match[1];
    if (imgUrl.startsWith("data:")) continue; // Already base64
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      processedHtml = processedHtml.replace(imgUrl, base64);
    } catch {
      // Skip images that can't be fetched
    }
  }

  // Constrain image sizes for Word
  processedHtml = processedHtml.replace(
    /<img([^>]*)>/gi,
    '<img$1 style="max-width:500px;height:auto;display:block;margin:8pt 0" />'
  );

  // Remove float styles (Word doesn't handle CSS float well)
  processedHtml = processedHtml.replace(/float:\s*(?:left|right);?/gi, "");

  const docContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page { size: A4; margin: 2.5cm; }
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; }
        h1 { font-size: 22pt; font-weight: bold; margin-bottom: 12pt; color: #0d0f1a; page-break-after: avoid; }
        h2 { font-size: 16pt; font-weight: bold; margin-top: 18pt; margin-bottom: 8pt; color: #0d0f1a; page-break-after: avoid; }
        h3 { font-size: 13pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; page-break-after: avoid; }
        p { margin-bottom: 8pt; }
        img { max-width: 500px; height: auto; }
        blockquote { border-left: 3px solid #ccc; padding-left: 12pt; margin: 8pt 0; color: #555; font-style: italic; }
        code { font-family: 'Consolas', monospace; background: #f5f5f5; padding: 2pt 4pt; font-size: 10pt; }
        pre { font-family: 'Consolas', monospace; background: #f5f5f5; padding: 10pt; font-size: 10pt; white-space: pre-wrap; }
        table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
        td, th { border: 1px solid #ddd; padding: 6pt 8pt; }
        a { color: #0563C1; }
        footer { margin-top: 24pt; padding-top: 12pt; border-top: 1px solid #ccc; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${processedHtml}
    </body>
    </html>`;

  const blob = new Blob(['\ufeff' + docContent], {
    type: "application/msword",
  });
  downloadBlob(blob, `${toFilename(title)}.doc`);
}

/* ─── PDF export (direct download via jspdf + html2canvas) ─── */
async function exportAsPdf(title: string, html: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas");

  // Create offscreen container
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:680px;padding:40px;font-family:Inter,sans-serif;font-size:11pt;line-height:1.7;color:#1a1a1a;background:#fff;";
  container.innerHTML = `
    <h1 style="font-size:24pt;font-weight:700;margin-bottom:16pt;color:#0d0f1a">${title}</h1>
    ${html}
  `;
  // Style images
  container.querySelectorAll("img").forEach((img) => {
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.crossOrigin = "anonymous";
  });
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 760,
    });

    const imgWidth = 190; // A4 width minus margins
    const pageHeight = 277; // A4 height minus margins
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

    const filename = title
      .toLowerCase()
      .replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      .slice(0, 60) || "article";

    pdf.save(`${filename}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

/* ─── Markdown export ─── */
function exportAsMarkdown(title: string, html: string) {
  const md = `# ${title}\n\n${htmlToMarkdown(html)}`;
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, `${toFilename(title)}.md`);
}

/* ─── Menu items ─── */
const EXPORT_OPTIONS = [
  { key: "markdown", label: "Markdown (.md)", icon: FileText, action: exportAsMarkdown },
  { key: "docx", label: "Word (.doc)", icon: FileType, action: exportAsDocx },
  { key: "pdf", label: "PDF (.pdf)", icon: FileDown, action: exportAsPdf },
] as const;

/* ─── Component ─── */
export function ExportDropdown({ title, content, language }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleExport = async (action: (title: string, html: string) => void | Promise<void>) => {
    const exportTitle = `${title}${language === "en" ? " (EN)" : ""}`;
    await action(exportTitle, content);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 micro-radius text-[11px] font-bold tracking-wider border transition-all ${
          open
            ? "bg-charcoal text-pure-white border-charcoal"
            : "border-border text-secondary hover:text-heading hover:border-heading"
        }`}
        title="Dışa Aktar"
      >
        <Download size={13} />
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 z-50 bg-pure-white border border-border rounded-lg shadow-lg overflow-hidden min-w-[180px]"
          >
            <div className="py-1">
              {EXPORT_OPTIONS.map(({ key, label, icon: Icon, action }) => (
                <button
                  key={key}
                  onClick={() => handleExport(action)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-secondary hover:text-heading hover:bg-surface transition-all text-left"
                >
                  <Icon size={14} strokeWidth={1.5} className="shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

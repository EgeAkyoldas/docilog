"use client";
import { useParams } from "next/navigation";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { ResizableImage } from "./editor/ResizableImageExtension";
import { Youtube } from "./editor/extensions/YoutubeExtension";
import { Video } from "./editor/extensions/VideoExtension";
import { Audio } from "./editor/extensions/AudioExtension";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faSpinner, faExpand, faCompress, faCircleQuestion, faKeyboard } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

import { useArticleForm } from "./hooks/useArticleForm";
import { useEditorImages } from "./hooks/useEditorImages";
import { useAIAssistant } from "./hooks/useAIAssistant";

import { EditorToolbar } from "./editor/EditorToolbar";
import { AIImagePromptBar } from "./editor/AIImagePromptBar";
import { AIPanel } from "./editor/AIPanel";
import { SitePreview } from "./editor/SitePreview";
import { EditorFooter } from "./editor/EditorFooter";
import { FindReplaceBar } from "./editor/FindReplaceBar";
import { TemplateSelector } from "./editor/TemplateSelector";
import { ExportDropdown } from "./editor/ExportDropdown";

import { categories } from "./editor/constants";
import type { ViewMode } from "./editor/types";

interface Props { articleId?: string; }

// ── Keyboard Shortcuts Modal ─────────────────────────────────────────────────
const SHORTCUTS = [
  { keys: ["Ctrl", "B"], desc: "Kalın" },
  { keys: ["Ctrl", "I"], desc: "İtalik" },
  { keys: ["Ctrl", "U"], desc: "Altı çizili" },
  { keys: ["Ctrl", "Z"], desc: "Geri al" },
  { keys: ["Ctrl", "H"], desc: "Bul & Değiştir" },
  { keys: ["Ctrl", "S"], desc: "Kaydet" },
  { keys: ["F11"], desc: "Odak modu" },
  { keys: ["?"], desc: "Kısayollar" },
  { keys: ["Escape"], desc: "Odak modundan çık / Kapat" },
];

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94 }}
        className="bg-pure-white card-boutique p-8 w-full max-w-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-deep-navy text-[20px]" style={{ fontFamily: "var(--font-heading)" }}>
            Klavye Kısayolları
          </h2>
          <button onClick={onClose} className="text-charcoal/20 hover:text-charcoal/60">
            <FontAwesomeIcon icon={faCircleQuestion} className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.desc} className="flex items-center justify-between py-1.5 border-b border-muted-slate/20 last:border-0">
              <span className="text-[13px] text-charcoal/60">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="px-2 py-0.5 bg-soft-cream border border-muted-slate/30 micro-radius text-[10px] font-bold text-charcoal/50 font-mono">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ArticleEditor({ articleId }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [focusMode, setFocusMode] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!articleId); // show on new article
  const editorAreaRef = useRef<HTMLDivElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Link is separately imported to avoid duplicate
      }),
      Placeholder.configure({ placeholder: "Yazmaya başlayın..." }),
      Link.configure({ openOnClick: false }),
      ResizableImage,
      Youtube,
      Video,
      Audio,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Typography,
      CharacterCount,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: "",
    editorProps: {
      attributes: { class: "outline-none min-h-[480px]" },
    },
  });

  const params = useParams();
  const projectSlug = params["project-slug"] as string;

  const form = useArticleForm(articleId, projectSlug, editor);
  const {
    getThumbnail,
    setThumbnail,
    uploading,
    thumbnailRef,
    imageRef,
    handleThumbnailUpload,
    handleContentImage,
    handleContentImageFile,
  } = useEditorImages(projectSlug, editor);
  const ai = useAIAssistant(projectSlug, editor);

  // ── Derived state ─────────────────────────────────────────────
  // Read the active language's thumbnail (changes automatically when lang switches)
  const activeThumbnail = getThumbnail(form.language);

  // ── Global keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === "?" && !isInput) { e.preventDefault(); setShowShortcuts((v) => !v); }
      if (e.key === "Escape") {
        setFocusMode(false);
        setShowShortcuts(false);
        setShowFindReplace(false);
      }
      if (e.ctrlKey && e.key === "h") { e.preventDefault(); setShowFindReplace((v) => !v); }
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); form.handleSave("draft", activeThumbnail); }
      if (e.key === "F11") { e.preventDefault(); setFocusMode((v) => !v); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [form, activeThumbnail]);

  // ── Drag & Drop image upload ─────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    handleContentImageFile(file);
  }, [handleContentImageFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);

  // ── Media upload handlers ───────────────────────────────────────────────
  const handleMediaUpload = useCallback(async (file: File, type: "video" | "audio") => {
    if (!editor) return;

    const label = type === "video" ? "Video" : "Ses";
    const toastId = toast.loading(`${label} yükleniyor... (${(file.size / 1024 / 1024).toFixed(1)} MB)`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", type === "video" ? "videos" : "audio");

    try {
      const res = await fetch(`/api/v1/${projectSlug}/upload`, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        console.error("[MediaUpload] API error:", data);
        toast.error(`${label} yüklenemedi: ${data.error || "Bilinmeyen hata"}`, { id: toastId });
        return;
      }

      if (data.url) {
        if (type === "video") {
          editor.commands.setVideo({ src: data.url });
        } else {
          editor.commands.setAudio({ src: data.url });
        }
        toast.success(`${label} başarıyla eklendi`, { id: toastId });
      } else {
        toast.error(`${label} URL alınamadı`, { id: toastId });
      }
    } catch (err) {
      console.error("[MediaUpload] Network error:", err);
      toast.error(`${label} yüklenirken bir hata oluştu`, { id: toastId });
    }
  }, [editor, projectSlug]);

  // ── Character / word count ──────────────────────────────────────────────
  const characters = editor?.storage.characterCount.characters() ?? 0;
  const words = editor?.storage.characterCount.words() ?? 0;

  // ── Site preview ─────────────────────────────────────────────────────────
  if (viewMode === "site" && editor) {
    return (
      <SitePreview
        title={form.title}
        thumbnail={activeThumbnail}
        category={form.category}
        editor={editor}
        onBack={() => setViewMode("edit")}
      />
    );
  }

  // ── Focus Mode wrapper ──────────────────────────────────────────────────
  const containerClass = focusMode
    ? "fixed inset-0 z-40 bg-pure-white overflow-y-auto flex flex-col items-center"
    : "flex flex-col gap-6 max-w-full";

  const mainContentMaxW = focusMode ? "max-w-[720px] w-full px-8 py-12" : "";

  return (
    <div className={containerClass}>
      {/* Focus mode exit hint */}
      {focusMode && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 text-[11px] text-charcoal/30 bg-soft-cream px-3 py-1.5 micro-radius">
          <FontAwesomeIcon icon={faCompress} className="w-3 h-3" />
          <kbd className="font-mono font-bold">Esc</kbd> odak modundan çık
        </div>
      )}

      <div className={`w-full ${mainContentMaxW}`}>
        {/* Hidden file inputs */}
        <input ref={thumbnailRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => handleThumbnailUpload(e, form.language)} />
        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleContentImage} />
        <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f, "video"); e.target.value = ""; }} />
        <input ref={audioInputRef} type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f, "audio"); e.target.value = ""; }} />

        {/* Page Header — hidden in focus mode */}
        {!focusMode && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <div>
              <div className="label text-secondary mb-0.5">ÜST YÖNETİM</div>
              <h1 className="text-deep-navy text-[22px]" style={{ fontFamily: "var(--font-heading)" }}>
                {articleId ? "Makale Düzenle" : "Yeni Makale"}
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {uploading && (
                <div className="flex items-center gap-2 text-secondary text-[12px]">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3.5 h-3.5" /> Yükleniyor...
                </div>
              )}

              {/* View mode toggle */}
              <div className="flex micro-radius overflow-hidden border border-border bg-pure-white">
                {(["edit", "preview", "site"] as ViewMode[]).map((m) => {
                  const labels: Record<ViewMode, string> = { edit: "Editör", preview: "Önizleme", site: "Site" };
                  return (
                    <button key={m} onClick={() => setViewMode(m)}
                      className={`px-3 py-1.5 text-[11px] font-bold tracking-wider transition-colors ${
                        viewMode === m ? "bg-deep-navy text-pure-white" : "text-muted hover:text-heading hover:bg-surface-overlay"
                      }`}>
                      {labels[m]}
                    </button>
                  );
                })}
              </div>

              {/* Focus mode */}
              <button onClick={() => setFocusMode(true)} title="Odak Modu (F11)"
                className="p-2 text-muted hover:text-heading transition-colors border border-border micro-radius">
                <FontAwesomeIcon icon={faExpand} className="w-3.5 h-3.5" />
              </button>

              {/* Shortcuts */}
              <button onClick={() => setShowShortcuts(true)} title="Kısayollar (?)"
                className="p-2 text-muted hover:text-heading transition-colors border border-border micro-radius">
                <FontAwesomeIcon icon={faKeyboard} className="w-3.5 h-3.5" />
              </button>

              {/* Export dropdown */}
              <ExportDropdown
                title={form.title}
                content={editor?.getHTML() ?? ""}
                language={form.language}
              />

              {/* AI toggle */}
              <button onClick={() => ai.setAiOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 micro-radius text-[11px] font-bold tracking-wider border transition-all ${
                  ai.aiOpen
                    ? "bg-charcoal text-pure-white border-charcoal"
                    : "border-border text-secondary hover:text-heading hover:border-heading"
                }`}>
                <FontAwesomeIcon icon={faWandMagicSparkles} className="w-[13px] h-[13px]" />
                AI
              </button>
            </div>
          </motion.div>
        )}

        {/* Main layout */}
        <div className="flex gap-5 items-start">
          {/* Left column: meta + editor */}
          <div className="flex-1 min-w-0">
            {/* Language switch + meta fields — hidden in focus mode */}
            {!focusMode && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-boutique p-6 mb-5">
                {/* Language */}
                <div className="flex gap-2 mb-4">
                  {(["tr", "en"] as const).map((lang) => (
                    <button key={lang} onClick={() => {
                        form.switchLanguage(lang);
                        // Sync SEO meta panel to the target language's saved value (or null)
                        ai.setSeoMeta(form.getMetaDescription(lang) ?? null);
                      }}
                      className={`px-4 py-1.5 micro-radius text-[11px] font-bold tracking-widest border transition-all ${
                        form.language === lang
                          ? "bg-deep-navy text-pure-white border-deep-navy"
                          : "border-border text-muted hover:border-heading hover:text-heading"
                      }`}>
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* ─── Two-column: Fields (left) + Cover Image (right) ─── */}
                <div className="flex gap-4 flex-col lg:flex-row">

                  {/* LEFT: Title, Slug, Category */}
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Title */}
                    <div>
                      <label className="label text-secondary mb-1 block">BAŞLIK</label>
                      <input type="text" placeholder="Makale başlığı..." value={form.title}
                        onChange={(e) => form.autoSlug(e.target.value)}
                        className="input-boutique text-[15px] font-semibold w-full"
                        style={{ fontFamily: "var(--font-heading)" }} />
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="label text-secondary mb-1 block">SLUG</label>
                      <input type="text" value={form.slug} onChange={(e) => form.setSlug(e.target.value)}
                        className="input-boutique text-[12px] w-full font-mono" />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="label text-secondary mb-1 block">KATEGORİ</label>
                      {(() => {
                        const knownValues = categories.map((c: { value: string; label: string }) => c.value);
                        const isCustom = !knownValues.includes(form.category);
                        return (
                          <div className="space-y-1.5">
                            <select
                              value={isCustom ? "__custom__" : form.category}
                              onChange={(e) => {
                                if (e.target.value === "__custom__") {
                                  form.setCategory("");
                                } else {
                                  form.setCategory(e.target.value);
                                }
                              }}
                              className="input-boutique text-[12px] w-full"
                            >
                              {categories.map((c: { value: string; label: string }) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                              <option value="__custom__">✏️ Özel Kategori...</option>
                            </select>
                            {(isCustom || form.category === "") && (
                              <input
                                type="text"
                                placeholder="Kategori adı girin..."
                                value={isCustom ? form.category : ""}
                                onChange={(e) => form.setCategory(e.target.value)}
                                className="input-boutique text-[12px] w-full"
                                autoFocus
                              />
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* RIGHT: Cover Image */}
                  <div className="w-full lg:w-[250px]  shrink-0">
                    <label className="label text-secondary mb-1 flex items-center gap-1.5">
                      KAPAK GÖRSELİ
                      <span className="px-1 py-0.5 bg-deep-navy text-pure-white text-[8px] font-bold tracking-widest micro-radius">
                        {form.language.toUpperCase()}
                      </span>
                    </label>
                    {activeThumbnail ? (
                      <div className="relative group">
                        <div className="relative w-full aspect-[4/3] micro-radius overflow-hidden border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={activeThumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => thumbnailRef.current?.click()}
                            className="text-[9px] font-bold px-1.5 py-0.5 bg-pure-white/90 border border-muted-slate micro-radius hover:bg-deep-navy hover:text-pure-white hover:border-deep-navy transition-all">
                            Değiştir
                          </button>
                          <button onClick={() => setThumbnail(null, form.language)}
                            className="text-[9px] font-bold px-1.5 py-0.5 bg-pure-white/90 border border-muted-slate micro-radius hover:bg-rose-500 hover:text-pure-white hover:border-rose-500 transition-all">
                            Kaldır
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => thumbnailRef.current?.click()}
                        className="w-full aspect-[4/3] border-2 border-dashed border-border micro-radius text-muted hover:border-heading hover:text-heading hover:bg-surface-overlay transition-all flex flex-col items-center justify-center gap-1.5 text-[11px] font-bold tracking-wider">
                        {form.language.toUpperCase()} kapak
                        <span className="text-[9px] font-normal opacity-50">Yükle veya AI ile üret</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Editor card */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-boutique p-5">
              {/* Find & Replace */}
              <FindReplaceBar editor={editor} show={showFindReplace} onClose={() => setShowFindReplace(false)} />

              {/* Toolbar */}
              {viewMode === "edit" && editor && (
                <EditorToolbar
                  editor={editor}
                  imageRef={imageRef}
                  videoRef={videoInputRef}
                  audioRef={audioInputRef}
                  aiImageLoading={ai.aiImageLoading}
                  onAIImageClick={() => {
                    ai.setImagePromptText(form.title || "");
                    ai.setShowImagePrompt("toolbar");
                  }}
                />
              )}

              {/* AI Image Prompt Bar */}
              <AIImagePromptBar
                show={ai.showImagePrompt === "toolbar" ? "toolbar" : null}
                promptText={ai.imagePromptText}
                onPromptChange={ai.setImagePromptText}
                loading={ai.aiImageLoading}
                onSubmit={() => ai.insertAIImage(ai.imagePromptText, form.slug)}
                onClose={() => ai.setShowImagePrompt(null)}
                imageSize={ai.aiImageSize}
                onSizeChange={ai.setAiImageSize}
              />

              {/* Editor / Preview area */}
              <div
                ref={editorAreaRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 280px)" }}
              >
                {viewMode === "edit" ? (
                  <div className="mt-3" style={{ fontFamily: "var(--font-body)", lineHeight: "1.8" }}>
                    <EditorContent editor={editor} />
                    {/* Drag & Drop overlay hint */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="h-full"></div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 article-content max-w-none text-charcoal/80 min-h-[480px]"
                    style={{ fontFamily: "var(--font-body)", lineHeight: "1.9", fontSize: "16px" }}
                    dangerouslySetInnerHTML={{ __html: editor?.getHTML() ?? "" }} />
                )}
              </div>

              {/* Footer: stats + save buttons */}
              <EditorFooter
                characters={characters}
                words={words}
                title={form.title}
                saving={form.saving}
                lastSavedAt={form.lastSavedAt}
                isDirty={form.isDirty}
                saveError={form.saveError}
                metaDescription={form.getMetaDescription(form.language)}
                content={editor?.getHTML() ?? ""}
                language={form.language}
                onAIOptimize={(issues) => ai.handleSEOOptimize(issues, form.title, form.language)}
                onDraft={() => form.handleSave("draft", activeThumbnail, form.getMetaDescription(form.language))}
                onPublish={() => form.handleSave("published", activeThumbnail, form.getMetaDescription(form.language))}
              />
            </motion.div>
          </div>

          {/* Right: AI Panel */}
          <AIPanel
            projectSlug={projectSlug}
            open={ai.aiOpen}
            onClose={() => ai.setAiOpen(false)}
            language={form.language}
            aiLoading={ai.aiLoading}
            aiResult={ai.aiResult}
            setAiResult={ai.setAiResult}
            bilingualResult={ai.bilingualResult}
            customPrompt={ai.customPrompt}
            onCustomPromptChange={ai.setCustomPrompt}
            onCallAI={(action) => ai.callAI(action, form.title, form.language)}
            onApplyAIResult={ai.applyAIResult}
            onApplyBilingual={(lang, content) => { form.switchLanguage(lang); ai.applyAIResult(content); }}
            aiImageLoading={ai.aiImageLoading}
            imagePromptText={ai.imagePromptText}
            onImagePromptChange={ai.setImagePromptText}
            imageSize={ai.aiImageSize}
            onImageSizeChange={ai.setAiImageSize}
            onGenerateCoverImage={() =>
              ai.generateAIImage(form.title, form.slug, (url) => setThumbnail(url, form.language))
            }
            onOpenContentImagePrompt={() => ai.insertAIImage(ai.imagePromptText || form.title, form.slug)}
            generatedImages={ai.generatedImages}
            onInsertImage={ai.insertImageIntoEditor}
            onSetAsCover={(url) => setThumbnail(url, form.language)}
            seoMeta={ai.seoMeta}
            seoLoading={ai.seoLoading}
            onGenerateSEO={() => ai.generateSEOMeta(form.title)}
            onClearSEO={() => {
              ai.setSeoMeta(null);
              form.setMetaDescription(null, form.language);
            }}
            onSetSeoMeta={(text) => ai.setSeoMeta(text)}
            onApplySEOMeta={(text) => form.setMetaDescription(text, form.language)}
            autoBlogLoading={ai.autoBlogLoading}
            autoBlogProgress={ai.autoBlogProgress}
            autoBlogIncludeImages={ai.autoBlogIncludeImages}
            onAutoBlogIncludeImagesChange={ai.setAutoBlogIncludeImages}
            onGenerateAutoBlog={(topic) =>
              ai.generateAutoBlog(
                topic,
                form.slug,
                form.language,
                (url) => setThumbnail(url, form.language),
                form.autoSlug,
                form.setCategory,
                form.setSlug,
                (text) => form.setMetaDescription(text, form.language),
              )
            }
            autoTags={ai.autoTags}
            onRemoveTag={(tag) => ai.setAutoTags(prev => prev.filter(t => t !== tag))}
            onBlogReady={() =>
              ai.generateBlogReady(
                form.slug,
                form.language,
                (url) => setThumbnail(url, form.language),
                form.autoSlug,
                form.setCategory,
                form.setSlug,
                (text) => form.setMetaDescription(text, form.language),
              )
            }
            selectedPersona={ai.selectedPersona}
            onPersonaChange={ai.setSelectedPersona}
          />
        </div>

        {/* AI Image Prompt from Panel */}
        {ai.showImagePrompt === "panel" && (
          <div className="mt-4 card-boutique p-4">
            <AIImagePromptBar
              show="panel"
              promptText={ai.imagePromptText}
              onPromptChange={ai.setImagePromptText}
              loading={ai.aiImageLoading}
              onSubmit={() => ai.insertAIImage(ai.imagePromptText, form.slug)}
              onClose={() => ai.setShowImagePrompt(null)}
              imageSize={ai.aiImageSize}
              onSizeChange={ai.setAiImageSize}
            />
          </div>
        )}

        {/* Saved toast */}
        <AnimatePresence>
          {form.saved && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed bottom-8 right-8 bg-deep-navy text-pure-white px-5 py-3 micro-radius text-[13px] font-semibold shadow-xl flex items-center gap-2 z-50"
            >
              ✓ Kaydedildi
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showTemplates && (
          <TemplateSelector
            show={showTemplates}
            onSelect={(html) => { editor?.commands.setContent(html); setShowTemplates(false); }}
            onClose={() => setShowTemplates(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

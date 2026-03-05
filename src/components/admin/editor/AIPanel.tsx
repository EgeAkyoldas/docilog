"use client";

import {
  Sparkles, Loader2, X, ImageIcon, ImagePlus, Search, Trash2,
  Copy, Check, Monitor, Smartphone, Plus, Download,
  Zap, PenTool, Image as ImageLucide, MessageSquare,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { aiActions } from "./constants";
import type { AIAction } from "./types";
import { AIChatPanel } from "./AIChatPanel";
import type { ChatMessage } from "../hooks/useAIChat";

interface AIPanelProps {
  projectSlug: string;
  open: boolean;
  onClose: () => void;
  language: "tr" | "en";
  aiLoading: boolean;
  aiResult: string | null;
  setAiResult: (v: string | null) => void;
  bilingualResult: { tr: string; en: string } | null;
  customPrompt: string;
  onCustomPromptChange: (v: string) => void;
  onCallAI: (action: AIAction) => void;
  onApplyAIResult: (content?: string) => void;
  onApplyBilingual: (lang: "tr" | "en", content: string) => void;
  aiImageLoading: boolean;
  imagePromptText: string;
  onImagePromptChange: (v: string) => void;
  imageSize: "landscape" | "portrait" | "square";
  onImageSizeChange: (s: "landscape" | "portrait" | "square") => void;
  onGenerateCoverImage: () => void;
  onOpenContentImagePrompt: () => void;
  generatedImages: string[];
  onInsertImage: (url: string) => void;
  onSetAsCover: (url: string) => void;
  seoMeta: string | null;
  seoLoading: boolean;
  onGenerateSEO: () => void;
  onClearSEO: () => void;
  onSetSeoMeta: (text: string | null) => void;
  onApplySEOMeta: (text: string) => void;
  // Auto Blog
  autoBlogLoading: boolean;
  autoBlogProgress: string;
  autoBlogIncludeImages: boolean;
  onAutoBlogIncludeImagesChange: (v: boolean) => void;
  onGenerateAutoBlog: (topic: string, referenceImages?: string[]) => void;
  // Tags
  autoTags: string[];
  onRemoveTag: (tag: string) => void;
  // Blog Ready
  onBlogReady: () => void;
  // Persona
  selectedPersona: string;
  onPersonaChange: (persona: string) => void;
  // ─── Chat Mode ───
  panelMode: "assistant" | "chat";
  onPanelModeChange: (mode: "assistant" | "chat") => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  chatStreaming: boolean;
  chatAttachedImages: string[];
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  onChatSend: (text: string) => void;
  onChatInputChange: (v: string) => void;
  onChatPaste: (e: React.ClipboardEvent) => void;
  onChatRemoveImage: (i: number) => void;
  onChatGenerateImage: (prompt: string) => void;
  onChatInsertToEditor: (url: string) => void;
  onChatApplyEdit: (html: string) => void;
  onChatClearHistory: () => void;
}

const SIZE_OPTIONS = [
  { key: "landscape" as const, label: "16:9" },
  { key: "square" as const, label: "1:1" },
  { key: "portrait" as const, label: "9:16" },
];

const INITIAL_PERSONAS: { key: string; label: string; short: string }[] = [];

/* ─── İnline style helpers (brand token CSS vars) ─── */
const PANEL_BG: React.CSSProperties = { backgroundColor: "var(--color-brand-surface)" };
const BRAND_TEXT: React.CSSProperties = { color: "var(--color-brand-primary)" };
const BTN_FILLED: React.CSSProperties = {
  backgroundColor: "var(--color-brand-primary)",
  color: "var(--color-brand-primary-text)",
};

/* Collapsible section header component */
function SectionLabel({ icon: Icon, label, open, onToggle }: {
  icon: typeof Sparkles; label: string; open?: boolean; onToggle?: () => void;
}) {
  const isCollapsible = typeof open !== "undefined" && onToggle;
  return (
    <button
      onClick={isCollapsible ? onToggle : undefined}
      className={`flex items-center justify-between w-full mb-2 px-0.5 ${isCollapsible ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
      type="button"
    >
      <div className="flex items-center gap-1.5">
        <Icon size={10} className="text-muted" />
        <span className="text-[9px] font-bold text-muted tracking-[0.15em] uppercase">{label}</span>
      </div>
      {isCollapsible && (
        <ChevronDown
          size={12}
          className="text-muted transition-transform duration-200"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
      )}
    </button>
  );
}

function PanelContent({
  projectSlug,
  language,
  aiLoading, aiResult, setAiResult, bilingualResult,
  customPrompt, onCustomPromptChange, onCallAI, onApplyAIResult, onApplyBilingual,
  aiImageLoading, imagePromptText, onImagePromptChange, imageSize, onImageSizeChange,
  onGenerateCoverImage, onOpenContentImagePrompt,
  generatedImages, onInsertImage, onSetAsCover,
  seoMeta, seoLoading, onGenerateSEO, onClearSEO, onSetSeoMeta, onApplySEOMeta,
  autoBlogLoading, autoBlogProgress, autoBlogIncludeImages,
  onAutoBlogIncludeImagesChange, onGenerateAutoBlog,
  autoTags, onRemoveTag, onBlogReady,
  selectedPersona, onPersonaChange,
  onClose,
  panelMode, onPanelModeChange,
  chatMessages, chatInput, chatStreaming, chatAttachedImages, chatScrollRef,
  onChatSend, onChatInputChange, onChatPaste, onChatRemoveImage,
  onChatGenerateImage, onChatInsertToEditor, onChatApplyEdit, onChatClearHistory,
}: Omit<AIPanelProps, "open"> & { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [editMetaText, setEditMetaText] = useState("");
  const [autoBlogTopic, setAutoBlogTopic] = useState("");
  const [autoBlogRefImages, setAutoBlogRefImages] = useState<string[]>([]);

  // Handle paste for auto blog reference images
  const handleAutoBlogPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "reference");
        try {
          const res = await fetch(`/api/v1/${projectSlug}/upload`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.url) {
            setAutoBlogRefImages(prev => [...prev, data.url]);
          }
        } catch {
          const objectUrl = URL.createObjectURL(file);
          setAutoBlogRefImages(prev => [...prev, objectUrl]);
        }
        break;
      }
    }
  };
  // Dynamic personas from API
  const [personaOptions, setPersonaOptions] = useState(INITIAL_PERSONAS);
  useEffect(() => {
    fetch(`/api/v1/${projectSlug}/ai-personas`)
      .then((r) => r.json())
      .then((data) => {
        if (data.personas?.length > 0) {
          const mapped = data.personas
            .filter((p: { is_active: boolean }) => p.is_active)
            .map((p: { id: string; name: string }) => ({
              key: p.id,
              label: p.name,
              short: p.name,
            }));
          setPersonaOptions(mapped);
          // Auto-select first persona if nothing is selected
          if (mapped.length > 0 && (!selectedPersona || !mapped.some((m: { key: string }) => m.key === selectedPersona))) {
            onPersonaChange(mapped[0].key);
          }
        }
      })
      .catch(() => {});
    // selectedPersona and onPersonaChange intentionally excluded to avoid re-fetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSlug]);
  // Collapsible section state
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({
    textOps: false,
    imageGen: true,
    gallery: true,
    seo: true,
    custom: true,
  });
  const toggleSection = (key: string) => setSectionOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const copyMeta = () => {
    if (!seoMeta) return;
    navigator.clipboard.writeText(seoMeta);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const startEdit = () => {
    setEditMetaText(seoMeta ?? "");
    setEditingMeta(true);
  };

  const saveEdit = () => {
    onSetSeoMeta(editMetaText);
    onApplySEOMeta(editMetaText);
    setEditingMeta(false);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with Toggle */}
      <div
        className="flex items-center justify-between px-3 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid var(--color-brand-border)" }}
      >
        <div className="flex items-center gap-2">
          {/* Segmented Toggle */}
          <div
            className="flex micro-radius overflow-hidden"
            style={{ border: "1px solid var(--color-brand-border)" }}
          >
            <button
              onClick={() => onPanelModeChange("assistant")}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold tracking-wider transition-colors"
              style={
                panelMode === "assistant"
                  ? BTN_FILLED
                  : { color: "var(--color-text-muted)", backgroundColor: "var(--color-surface)" }
              }
            >
              <Sparkles size={10} />
              Asistan
            </button>
            <button
              onClick={() => onPanelModeChange("chat")}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold tracking-wider transition-colors"
              style={
                panelMode === "chat"
                  ? BTN_FILLED
                  : { color: "var(--color-text-muted)", backgroundColor: "var(--color-surface)" }
              }
            >
              <MessageSquare size={10} />
              Chat
            </button>
          </div>
          {/* Language badge */}
          <span
            className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest micro-radius"
            style={BTN_FILLED}
          >
            {language.toUpperCase()}
          </span>
        </div>
        <button onClick={onClose} className="text-muted hover:text-secondary transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* ─── CHAT MODE ─── */}
      {panelMode === "chat" ? (
        <AIChatPanel
          projectSlug={projectSlug}
          language={language}
          messages={chatMessages}
          inputValue={chatInput}
          isStreaming={chatStreaming}
          attachedImages={chatAttachedImages}
          scrollRef={chatScrollRef}
          onSend={onChatSend}
          onInputChange={onChatInputChange}
          onPaste={onChatPaste}
          onRemoveAttachedImage={onChatRemoveImage}
          onGenerateImage={onChatGenerateImage}
          onInsertToEditor={onChatInsertToEditor}
          onApplyEdit={onChatApplyEdit}
          onClearHistory={onChatClearHistory}
        />
      ) : (
      <div className="flex-1 overflow-y-auto">
      {/* ─── AUTO BLOG ─── */}
      <div
        className="p-3"
        style={{ borderBottom: "1px solid var(--color-brand-border)" }}
      >
        <SectionLabel icon={Zap} label="Auto Blog" />
        {/* Persona Pills */}
        <div className="flex gap-1 mb-2 flex-wrap">
          {personaOptions.map((p) => (
            <button
              key={p.key}
              onClick={() => onPersonaChange(p.key)}
              className="px-2 py-1 text-[10px] font-semibold micro-radius transition-all"
              style={
                selectedPersona === p.key
                  ? { ...BTN_FILLED, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }
                  : {
                      backgroundColor: "var(--color-brand-border)",
                      color: "var(--color-secondary)",
                      opacity: 0.8,
                    }
              }
              title={p.short}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mb-2">
          <textarea
            value={autoBlogTopic}
            onChange={(e) => {
              setAutoBlogTopic(e.target.value);
              // Auto-grow
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            placeholder="Blog konusu girin... Detaylı prompt yazabilirsiniz."
            className="input-boutique text-[12px] w-full resize-none overflow-hidden"
            rows={2}
            style={{ minHeight: "40px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && autoBlogTopic.trim()) {
                e.preventDefault();
                onGenerateAutoBlog(autoBlogTopic, autoBlogRefImages.length > 0 ? autoBlogRefImages : undefined);
              }
            }}
            onPaste={handleAutoBlogPaste}
          />
        </div>

        {/* Reference images */}
        {autoBlogRefImages.length > 0 && (
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {autoBlogRefImages.map((url, i) => (
              <div key={i} className="relative group w-14 h-14 micro-radius overflow-hidden border" style={{ borderColor: "#2a9d8f" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Ref ${i}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => setAutoBlogRefImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-0 right-0 p-0.5 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={8} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-[7px] text-white text-center py-0.5">REF</div>
              </div>
            ))}
            <button
              onClick={() => setAutoBlogRefImages([])}
              className="text-[9px] text-muted hover:text-heading self-center ml-1"
              title="Tümünü kaldır"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoBlogIncludeImages}
              onChange={(e) => onAutoBlogIncludeImagesChange(e.target.checked)}
              className="w-3 h-3 accent-current"
            />
            <span className="text-[10px] text-secondary font-medium">Görselleri de üret</span>
          </label>
        </div>
        <button
          onClick={() => onGenerateAutoBlog(autoBlogTopic, autoBlogRefImages.length > 0 ? autoBlogRefImages : undefined)}
          disabled={autoBlogLoading || !autoBlogTopic.trim()}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 micro-radius text-[11px] font-bold disabled:opacity-30 transition-all"
          style={BTN_FILLED}
        >
          {autoBlogLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
          {autoBlogLoading ? "Oluşturuluyor..." : "Auto Blog Üret"}
        </button>
        {autoBlogProgress && (
          <div className="mt-2 text-[10px] text-secondary font-medium flex items-center gap-1.5">
            <Loader2 size={10} className="animate-spin" />
            {autoBlogProgress}
          </div>
        )}
      </div>

      {/* ─── METİN İŞLEMLERİ ─── */}
      <div
        className="p-3"
        style={{ borderBottom: "1px solid var(--color-brand-border)" }}
      >
        <SectionLabel icon={PenTool} label="Metin İşlemleri" open={sectionOpen.textOps} onToggle={() => toggleSection('textOps')} />
        {sectionOpen.textOps && (
          <div className="grid grid-cols-4 gap-1.5">
            {aiActions.map((a) => (
              <button key={a.action} onClick={() => a.action === 'blog_ready' ? onBlogReady() : onCallAI(a.action)} disabled={aiLoading || (a.action === 'blog_ready' && autoBlogLoading)}
                className="flex flex-col items-center gap-1 p-2 micro-radius transition-all group disabled:opacity-30 text-center"
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-surface-raised)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                title={a.desc}>
                <a.icon size={14} className="text-secondary group-hover:text-heading transition-colors" strokeWidth={1.5} />
                <span className="text-[9px] text-secondary group-hover:text-heading font-semibold leading-tight transition-colors">{a.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── GÖRSEL ÜRETİMİ ─── */}
      <div
        className="p-3 space-y-2"
        style={{ borderBottom: "1px solid var(--color-brand-border)" }}
      >
        <SectionLabel icon={ImageLucide} label="Görsel Üretimi" open={sectionOpen.imageGen} onToggle={() => toggleSection('imageGen')} />
        {sectionOpen.imageGen && (
          <>
            {/* Size picker + prompt */}
            <div className="flex items-center gap-1.5">
              <div className="flex micro-radius overflow-hidden shrink-0" style={{ border: "1px solid var(--color-brand-border)" }}>
                {SIZE_OPTIONS.map((s) => (
                  <button key={s.key} onClick={() => onImageSizeChange(s.key)}
                    className="px-2 py-1 text-[9px] font-bold tracking-wider transition-colors"
                    style={imageSize === s.key ? BTN_FILLED : { color: "var(--color-text-muted)", backgroundColor: "var(--color-surface)" }}>
                    {s.label}
                  </button>
                ))}
              </div>
              <input type="text" value={imagePromptText} onChange={(e) => onImagePromptChange(e.target.value)}
                placeholder="Görsel açıklama" className="input-boutique text-[11px] flex-1 py-1!" />
            </div>

            {/* Generate buttons */}
            <div className="flex gap-1.5">
              <button onClick={onGenerateCoverImage} disabled={aiImageLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 micro-radius text-[11px] font-semibold disabled:opacity-30 transition-colors"
                style={{ backgroundColor: "var(--color-surface-overlay)", color: "var(--color-brand-primary)" }}>
                {aiImageLoading ? <Loader2 size={11} className="animate-spin" /> : <Monitor size={11} />}
                Kapak
              </button>
              <button onClick={onOpenContentImagePrompt} disabled={aiImageLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 micro-radius text-[11px] font-semibold disabled:opacity-30 transition-colors"
                style={{ backgroundColor: "var(--color-surface-overlay)", color: "var(--color-brand-primary)" }}>
                <ImagePlus size={11} />
                İçerik Görseli
              </button>
            </div>
          </>
        )}
      </div>

      {/* Generated Image Gallery */}
      {generatedImages.length > 0 && (
        <div className="p-3" style={{ borderBottom: "1px solid var(--color-brand-border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-muted tracking-wider flex items-center gap-1">
              <ImageIcon size={10} />
              ÜRETİLEN GÖRSELLER ({generatedImages.length})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-[280px] overflow-y-auto">
            {generatedImages.map((url, i) => (
              <div key={i} className="group relative micro-radius overflow-hidden border aspect-video" style={{ borderColor: "var(--color-border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Generated ${i + 1}`} className="w-full h-full object-cover" />
                {/* Hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5"
                  style={{ backgroundColor: "rgba(13,15,26,0.75)" }}>
                  <button onClick={() => onInsertImage(url)}
                    className="panel-btn text-[10px]">
                    <Plus size={10} />
                    İçeriğe Ekle
                  </button>
                  <button onClick={() => onSetAsCover(url)}
                    className="panel-btn text-[10px]">
                    <Smartphone size={10} />
                    Kapak Yap
                  </button>
                  <a href={url} download target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-2 py-1 text-[9px]"
                    style={{ color: "var(--color-text-on-dark)" }}>
                    <Download size={9} />
                    İndir
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO Meta */}
      <div className="p-3" style={{ borderBottom: "1px solid var(--color-brand-border)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-muted tracking-wider flex items-center gap-1">
            <Search size={10} />
            SEO META
          </span>
        </div>

        {/* Edit mode */}
        {seoMeta && editingMeta ? (
          <div className="micro-radius p-2" style={{ backgroundColor: "var(--color-surface-overlay)", border: "1px solid var(--color-brand-border)" }}>
            <textarea
              value={editMetaText}
              onChange={(e) => setEditMetaText(e.target.value)}
              rows={4}
              maxLength={200}
              className="w-full text-[12px] leading-relaxed bg-transparent resize-none outline-none text-body"
              autoFocus
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className={`text-[10px] font-bold ${editMetaText.length > 155 ? "text-rose-500" : "text-muted"}`}>
                {editMetaText.length}/155
              </span>
              <div className="flex gap-1.5">
                <button onClick={() => setEditingMeta(false)}
                  className="text-[10px] font-semibold text-muted hover:text-secondary px-1.5">
                  İptal
                </button>
                <button onClick={saveEdit} className="panel-btn">
                  <Check size={9} /> Kaydet
                </button>
              </div>
            </div>
          </div>
        ) : seoMeta ? (
          /* Read mode */
          <div className="micro-radius p-2.5" style={{ backgroundColor: "var(--color-surface-overlay)", border: "1px solid var(--color-brand-border)" }}>
            <p className="text-[12px] text-secondary leading-relaxed">{seoMeta}</p>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-[10px] font-bold ${seoMeta.length > 155 ? "text-rose-500" : "text-muted"}`}>
                {seoMeta.length}/155
              </span>
              <div className="flex gap-1.5 items-center">
                <button onClick={startEdit}
                  className="text-[10px] font-bold text-muted hover:text-secondary transition-colors">
                  Düzenle
                </button>
                <button onClick={() => { onClearSEO(); onGenerateSEO(); }}
                  className="text-[10px] font-bold text-muted hover:text-secondary transition-colors">
                  ↻ Yenile
                </button>
                <button onClick={() => onApplySEOMeta(seoMeta)} className="panel-btn">
                  <Check size={9} /> Kaydet
                </button>
                <button onClick={copyMeta} className="flex items-center gap-1 text-[10px] font-bold" style={BRAND_TEXT}>
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                  {copied ? "Kopyalandı" : "Kopyala"}
                </button>
                <button onClick={onClearSEO} className="text-muted hover:text-secondary"><X size={10} /></button>
              </div>
            </div>
          </div>
        ) : (
          /* Generate button */
          <button onClick={onGenerateSEO} disabled={seoLoading}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 micro-radius text-[11px] font-semibold disabled:opacity-30 transition-colors"
            style={{ backgroundColor: "var(--color-surface-overlay)", color: "var(--color-brand-primary)" }}>
            {seoLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {seoLoading ? "Üretiliyor..." : "Meta Açıklama Üret"}
          </button>
        )}
      </div>

      {/* ─── ANAHTAR KELİMELER ─── */}
      {autoTags.length > 0 && (
        <div className="p-3" style={{ borderBottom: "1px solid var(--color-brand-border)" }}>
          <SectionLabel icon={Search} label="Anahtar Kelimeler" />
          <div className="flex flex-wrap gap-1.5">
            {autoTags.map((tag, i) => (
              <span key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 micro-radius text-[11px] font-medium cursor-default"
                style={{ backgroundColor: "var(--color-surface-overlay)", color: "var(--color-secondary)", border: "1px solid var(--color-border)" }}
              >
                {tag}
                <button onClick={() => onRemoveTag(tag)}
                  className="text-muted hover:text-secondary ml-0.5">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── SERBEST TALİMAT ─── */}
      <div className="p-3" style={{ borderBottom: "1px solid var(--color-brand-border)" }}>
        <SectionLabel icon={MessageSquare} label="Serbest Talimat" />
        <div className="flex gap-1.5">
          <input type="text" value={customPrompt} onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="AI'ya talimat verin..." className="input-boutique text-[12px] flex-1"
            onKeyDown={(e) => { if (e.key === "Enter" && customPrompt.trim()) onCallAI("custom"); }} />
          <button onClick={() => onCallAI("custom")} disabled={aiLoading || !customPrompt.trim()}
            className="panel-btn disabled:opacity-30 px-3 py-1.5">
            {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          </button>
        </div>
      </div>

      {/* Loading */}
      {aiLoading && (
        <div className="flex items-center gap-2 px-4 py-4 text-[12px]" style={BRAND_TEXT}>
          <Loader2 size={14} className="animate-spin" /> Gemini düşünüyor...
        </div>
      )}

      {/* Bilingual result */}
      {bilingualResult && (
        <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
          <p className="text-[10px] font-bold text-muted tracking-wider px-0.5">
            İKİ DİL ÇIKTISI — aktif dil: <span style={BRAND_TEXT}>{language.toUpperCase()}</span>
          </p>
          {(["tr", "en"] as const).map((lang) => {
            const isActive = lang === language;
            return (
              <div key={lang} className="micro-radius" style={{
                border: `1px solid ${isActive ? "var(--color-brand-border)" : "var(--color-border)"}`,
                backgroundColor: "var(--color-surface)",
                boxShadow: isActive ? "0 0 0 1px var(--color-brand-border)" : "none",
              }}>
                <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold tracking-widest px-1.5 py-0.5 micro-radius"
                      style={isActive ? BTN_FILLED : { backgroundColor: "var(--color-surface-overlay)", color: "var(--color-text-muted)" }}
                    >
                      {lang.toUpperCase()}
                    </span>
                    {isActive && (
                      <span className="text-[9px] font-semibold" style={BRAND_TEXT}>● aktif dil</span>
                    )}
                  </div>
                  <button onClick={() => onApplyBilingual(lang, bilingualResult[lang])} className="panel-btn">
                    {isActive ? "UYGULA ✓" : "UYGULA & GEÇ"}
                  </button>
                </div>
                <div className="p-3 prose prose-sm max-w-none text-[12px] max-h-[160px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: bilingualResult[lang] }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Single result */}
      {aiResult && !bilingualResult && (
        <div className="p-3">
          <div className="micro-radius" style={{ border: "1px solid var(--color-brand-border)", backgroundColor: "var(--color-surface)" }}>
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <span className="text-[10px] font-bold tracking-widest" style={BRAND_TEXT}>
                AI ÇIKTISI — {language.toUpperCase()} alanına uygulanacak
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => onApplyAIResult()} className="panel-btn">UYGULA</button>
                <button onClick={() => setAiResult(null)} className="text-muted hover:text-secondary"><X size={12} /></button>
              </div>
            </div>
            <div className="p-3 prose prose-sm max-w-none text-[12px] max-h-[300px] overflow-y-auto"
              style={{ fontFamily: "var(--font-body)" }} dangerouslySetInnerHTML={{ __html: aiResult }} />
          </div>
        </div>
      )}
    </div>
    )}
    </div>
  );
}

export function AIPanel(props: AIPanelProps) {
  return (
    <>
      {/* Desktop side panel */}
      <AnimatePresence>
        {props.open && (
          <motion.div
            initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "340px" }}
            exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.25 }}
            className="hidden lg:block shrink-0 overflow-hidden"
          >
            <div
              className="w-[340px] card-boutique sticky top-0 h-screen flex flex-col overflow-hidden"
              style={PANEL_BG}
            >
              <PanelContent {...props} onClose={props.onClose} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {props.open && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="lg:hidden card-boutique"
            style={PANEL_BG}
          >
            <PanelContent {...props} onClose={props.onClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

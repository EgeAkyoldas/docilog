"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Upload, Sparkles, Save, Loader2, X, Heart,
  MessageCircle, Bookmark, Send, MoreHorizontal, CheckCircle,
  RefreshCw, Paperclip, Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AspectRatio = "1:1" | "3:4" | "9:16" | "16:9";
type PostType = "feed" | "reel" | "story" | "carousel";
type PostStatus = "draft" | "ready" | "published";

interface SocialPost {
  id: string;
  campaign_id: string;
  image_url: string | null;
  caption: string;
  caption_en: string;
  hashtags: string[];
  tags: string[];
  location: string | null;
  alt_text: string;
  cta: string | null;
  visual_prompt: string;
  aspect_ratio: AspectRatio;
  post_type: PostType;
  status: PostStatus;
}

const RATIO: Record<AspectRatio, { label: string; w: number; h: number }> = {
  "1:1":  { label: "1:1",  w: 1,  h: 1  },
  "3:4":  { label: "3:4",  w: 3,  h: 4  },
  "9:16": { label: "9:16", w: 9,  h: 16 },
  "16:9": { label: "16:9", w: 16, h: 9  },
};

// ─── Drag Handle ─────────────────────────────────────────────────────────────
function DragHandle({ onDrag }: { onDrag: (dx: number) => void }) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      onDrag(dx);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [onDrag]);

  return (
    <div
      onMouseDown={onMouseDown}
      className="shrink-0 w-1 cursor-col-resize flex items-center justify-center group"
      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
    >
      <div className="w-[3px] h-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: "#e05d44" }} />
    </div>
  );
}

// ─── AI Image Gen Overlay ────────────────────────────────────────────────────
function AIGenOverlay({ initialPrompt, onGenerate, onClose }: {
  initialPrompt: string;
  onGenerate: (prompt: string, ar: AspectRatio) => void;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [ar, setAr] = useState<AspectRatio>("1:1");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute bottom-0 left-0 right-0 z-20 rounded-xl m-2 flex flex-col gap-2.5 p-3"
      style={{ backgroundColor: "rgba(14,14,26,0.97)", backdropFilter: "blur(12px)", border: "1px solid rgba(224,93,68,0.3)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-white flex items-center gap-1.5">
          <Sparkles size={11} className="text-orange-400" /> AI Görsel Üret
        </p>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={13} /></button>
      </div>
      <div className="flex gap-1">
        {(["1:1", "3:4", "9:16", "16:9"] as AspectRatio[]).map((r) => {
          const d = RATIO[r];
          return (
            <button key={r} onClick={() => setAr(r)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all"
              style={{ backgroundColor: ar === r ? "#e05d44" : "rgba(255,255,255,0.06)", color: ar === r ? "#fff" : "rgba(255,255,255,0.4)", border: `1px solid ${ar === r ? "#e05d44" : "rgba(255,255,255,0.08)"}` }}>
              <div className="border rounded-[1px]" style={{ width: `${Math.round(9 * (d.w / Math.max(d.w, d.h)))}px`, height: `${Math.round(9 * (d.h / Math.max(d.w, d.h)))}px`, borderColor: ar === r ? "#fff" : "rgba(255,255,255,0.3)" }} />
              {r}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <textarea autoFocus value={prompt} onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && prompt.trim()) { e.preventDefault(); onGenerate(prompt, ar); } }}
          placeholder="Cinematic overhead, warm golden hour, Japandi interior…"
          className="flex-1 resize-none text-[11px] px-2.5 py-1.5 rounded-lg outline-none"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", minHeight: "52px", maxHeight: "80px" }} rows={2} />
        <button onClick={() => onGenerate(prompt, ar)} disabled={!prompt.trim()}
          className="w-9 rounded-lg text-white disabled:opacity-40 flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #e05d44, #f4a261)" }}>
          <Sparkles size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────
function LeftPanel({ imageUrl, aspectRatio, projectSlug, visualPrompt, caption, hashtags, status, aiGenerating,
  onImageChange, onAspectRatioChange, onVisualPromptChange, onStatusChange, onCaptionChange, onHashtagsChange }: {
  imageUrl: string | null; aspectRatio: AspectRatio; projectSlug: string; visualPrompt: string;
  caption: string; hashtags: string[]; status: PostStatus; aiGenerating: boolean;
  onImageChange: (url: string | null) => void; onAspectRatioChange: (ar: AspectRatio) => void;
  onVisualPromptChange: (p: string) => void; onStatusChange: (s: PostStatus) => void;
  onCaptionChange: (c: string) => void; onHashtagsChange: (h: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showAIGen, setShowAIGen] = useState(false);

  const d = RATIO[aspectRatio];

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "social");
      const res = await fetch(`/api/v1/${projectSlug}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) onImageChange(data.url);
    } finally { setUploading(false); }
  };

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) { e.preventDefault(); const f = item.getAsFile(); if (f) await upload(f); break; }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSlug]);

  useEffect(() => { window.addEventListener("paste", handlePaste); return () => window.removeEventListener("paste", handlePaste); }, [handlePaste]);

  const handleAIGenerate = async (prompt: string, ar: AspectRatio) => {
    setShowAIGen(false);
    onAspectRatioChange(ar);
    onVisualPromptChange(prompt);
    try {
      const res = await fetch(`/api/v1/${projectSlug}/ai-image`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, aspectRatio: ar }) });
      const data = await res.json();
      if (data.url) onImageChange(data.url);
    } catch { /* silent */ }
  };

  const statusStyles: Record<PostStatus, { bg: string; label: string }> = {
    draft: { bg: "rgba(255,255,255,0.08)", label: "Taslak" },
    ready: { bg: "#2a9d8f", label: "Hazır" },
    published: { bg: "#e05d44", label: "Yayında" },
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-4 overflow-x-hidden">
      {/* Image zone */}
      <div className="relative w-full overflow-hidden rounded-xl shrink-0"
        style={{ aspectRatio: `${d.w} / ${d.h}`, maxHeight: "38vh", backgroundColor: "rgba(255,255,255,0.04)" }}>
        {aiGenerating || uploading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-orange-400" />
            <p className="text-[10px] text-white/40">{aiGenerating ? "Görsel üretiliyor..." : "Yükleniyor..."}</p>
          </div>
        ) : imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
            <button onClick={() => onImageChange(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"><X size={11} /></button>
            <button onClick={() => setShowAIGen(true)} className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: "rgba(0,0,0,0.65)" }}>
              <RefreshCw size={8} /> Yeni Görsel
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 p-3">
            <ImageIcon size={22} className="text-white/20" />
            <div className="flex gap-1.5">
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Upload size={10} /> Yükle
              </button>
              <button onClick={() => setShowAIGen(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "linear-gradient(135deg, #e05d44, #f4a261)" }}>
                <Sparkles size={10} /> AI Üret
              </button>
            </div>
            <p className="text-[9px] text-white/20">Ctrl+V ile yapıştır</p>
          </div>
        )}
        <AnimatePresence>
          {showAIGen && <AIGenOverlay initialPrompt={visualPrompt} onGenerate={handleAIGenerate} onClose={() => setShowAIGen(false)} />}
        </AnimatePresence>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} className="hidden" />

      {/* Caption */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[9px] font-bold tracking-widest text-white/25 uppercase">Caption (TR)</p>
        <textarea value={caption} onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="AI chat ile üret veya yaz..."
          className="resize-none text-[12px] px-3 py-2 rounded-xl outline-none leading-relaxed"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", minHeight: "80px" }} />
      </div>

      {/* Hashtags */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[9px] font-bold tracking-widest text-white/25 uppercase">Hashtags</p>
        <div className="flex flex-wrap gap-1">
          {hashtags.map((h) => (
            <button key={h} onClick={() => onHashtagsChange(hashtags.filter((x) => x !== h))}
              className="px-1.5 py-0.5 rounded-full text-[9px] font-medium flex items-center gap-0.5 group"
              style={{ backgroundColor: "rgba(224,93,68,0.15)", color: "#f4a261" }}>
              #{h}<X size={7} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          <input placeholder="+ ekle" className="text-[9px] w-14 bg-transparent border-b outline-none text-white/40 placeholder:text-white/20"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && e.currentTarget.value.trim()) { const t = e.currentTarget.value.trim().replace(/^#/, ""); if (!hashtags.includes(t)) onHashtagsChange([...hashtags, t]); e.currentTarget.value = ""; e.preventDefault(); } }} />
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-1.5 mt-auto pt-2">
        {(["draft", "ready", "published"] as PostStatus[]).map((s) => (
          <button key={s} onClick={() => onStatusChange(s)} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
            style={{ backgroundColor: status === s ? statusStyles[s].bg : "rgba(255,255,255,0.05)", color: status === s ? "#fff" : "rgba(255,255,255,0.3)", border: `1px solid ${status === s ? "transparent" : "rgba(255,255,255,0.06)"}` }}>
            {statusStyles[s].label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── iPhone Preview ───────────────────────────────────────────────────────────
function IPhonePreview({ imageUrl, caption, hashtags, aspectRatio, location }: {
  imageUrl: string | null; caption: string; hashtags: string[]; aspectRatio: AspectRatio; location: string | null;
}) {
  const d = RATIO[aspectRatio];
  const hashLine = hashtags.map((h) => `#${h}`).join(" ");

  return (
    <div className="flex items-center justify-center h-full w-full overflow-auto py-6">
      {/* Outer phone shell */}
      <div className="relative shrink-0 flex flex-col" style={{
        width: "320px",
        background: "linear-gradient(160deg, #1c1c1e 0%, #111 100%)",
        borderRadius: "48px",
        border: "2px solid #3a3a3c",
        boxShadow: "0 0 0 1px #555, inset 0 0 0 1px rgba(255,255,255,0.06), 0 50px 80px rgba(0,0,0,0.7), 0 20px 40px rgba(0,0,0,0.5)",
        overflow: "hidden",
        minHeight: "640px",
      }}>
        {/* Side buttons (visual only) */}
        <div className="absolute left-[-3px] top-[110px] w-[3px] h-10 rounded-l-full" style={{ backgroundColor: "#3a3a3c" }} />
        <div className="absolute left-[-3px] top-[160px] w-[3px] h-14 rounded-l-full" style={{ backgroundColor: "#3a3a3c" }} />
        <div className="absolute left-[-3px] top-[185px] w-[3px] h-14 rounded-l-full" style={{ backgroundColor: "#3a3a3c" }} />
        <div className="absolute right-[-3px] top-[130px] w-[3px] h-20 rounded-r-full" style={{ backgroundColor: "#3a3a3c" }} />

        {/* Screen bezel */}
        <div className="flex flex-col" style={{ margin: "2px", borderRadius: "46px", overflow: "hidden", background: "#000", flex: 1 }}>
          {/* Status bar */}
          <div className="flex items-center justify-between px-8 pt-3 pb-1 shrink-0" style={{ backgroundColor: "#000" }}>
            <span className="text-[10px] text-white font-semibold">9:41</span>
            {/* Dynamic island */}
            <div style={{ width: "96px", height: "28px", background: "#000", borderRadius: "20px", border: "2px solid #1c1c1e", position: "absolute", left: "50%", transform: "translateX(-50%)", top: "8px" }} />
            <div className="flex items-center gap-1">
              <svg width="14" height="10" viewBox="0 0 14 10" fill="white" opacity="0.8"><rect x="0" y="3" width="3" height="7" rx="0.5"/><rect x="4" y="2" width="3" height="8" rx="0.5"/><rect x="8" y="0" width="3" height="10" rx="0.5"/><rect x="12" y="0" width="3" height="10" rx="0.5" opacity="0.3"/></svg>
              <svg width="15" height="10" viewBox="0 0 15 10" fill="white" opacity="0.8"><path d="M7.5 1.5C10 1.5 12.2 2.7 13.5 4.5C12.2 6.3 10 7.5 7.5 7.5C5 7.5 2.8 6.3 1.5 4.5C2.8 2.7 5 1.5 7.5 1.5Z" stroke="white" strokeWidth="1" fill="none"/><circle cx="7.5" cy="4.5" r="2"/></svg>
              <div className="flex items-center gap-0.5">
                <div style={{ width: "22px", height: "11px", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "2.5px", padding: "1.5px" }}>
                  <div style={{ background: "white", borderRadius: "1.5px", height: "100%", width: "75%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Instagram content */}
          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#000" }}>
            {/* IG stories bar (decorative) */}
            <div className="flex gap-3 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {["Sen", "aura_ig", "ev_decor", "boterma", "interiors"].map((name, i) => (
                <div key={name} className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-10 h-10 rounded-full" style={{ background: i === 0 ? "rgba(255,255,255,0.1)" : `linear-gradient(135deg, hsl(${i * 40},70%,55%), hsl(${i * 40 + 60},70%,40%))`, border: i === 0 ? "1px dashed rgba(255,255,255,0.3)" : "2px solid #000", padding: i === 0 ? "0" : "0" }} />
                  <span className="text-[8px] text-white/50 truncate w-10 text-center">{name}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />

            {/* Post */}
            {/* Profile row */}
            <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full shrink-0" style={{ background: "linear-gradient(135deg, #e05d44, #f4a261, #2a9d8f)" }} />
                <div>
                  <p className="text-[11px] font-bold text-white leading-tight">boterma</p>
                  {location && <p className="text-[9px] text-white/40">{location}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/80 px-2 py-0.5 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.3)" }}>Takip Et</span>
                <MoreHorizontal size={14} className="text-white/60" />
              </div>
            </div>

            {/* Image */}
            <div className="relative w-full shrink-0" style={{ aspectRatio: `${d.w} / ${d.h}`, backgroundColor: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-[10px] text-white/20 text-center"><p>Görsel bekleniyor</p><p className="text-[8px] mt-0.5">{RATIO[aspectRatio].label}</p></div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
              <div className="flex gap-4">
                <Heart size={21} className="text-white/80" />
                <MessageCircle size={21} className="text-white/80" />
                <Send size={19} style={{ transform: "rotate(-45deg)" }} className="text-white/80" />
              </div>
              <Bookmark size={21} className="text-white/80" />
            </div>

            <div className="px-3 pb-1"><p className="text-[11px] font-bold text-white">1,284 beğeni</p></div>

            <div className="px-3 pb-4">
              <p className="text-[11px] text-white/80 leading-snug">
                <span className="font-bold">boterma </span>
                {caption || <span className="text-white/25 italic">Caption burada...</span>}
              </p>
              {hashLine && <p className="text-[9px] mt-1 text-blue-400 leading-relaxed">{hashLine}</p>}
              <p className="text-[9px] text-white/25 mt-1.5">Tüm yorumları gör...</p>
            </div>

            {/* Comment bar */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="w-6 h-6 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.1)" }} />
              <p className="text-[10px] text-white/30 flex-1">Yorum ekle...</p>
              <span className="text-[10px]">❤️</span>
            </div>
          </div>

          {/* Home indicator */}
          <div className="flex items-end justify-center pb-2 pt-1 shrink-0" style={{ backgroundColor: "#000" }}>
            <div style={{ width: "120px", height: "4px", background: "rgba(255,255,255,0.35)", borderRadius: "2px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Campaign AI Chat ─────────────────────────────────────────────────────────
function CampaignChat({
  projectSlug, campaignId, postId,
  caption, captionEn, hashtags, campaignAim, personaName, aspectRatio,
  onTextUpdate, onImageGenerate,
}: {
  projectSlug: string; campaignId: string; postId: string;
  caption: string; captionEn: string; hashtags: string[];
  campaignAim?: string; personaName?: string; aspectRatio: AspectRatio;
  onTextUpdate: (data: { caption?: string; captionEn?: string; hashtags?: string[]; tags?: string[]; cta?: string; location?: string }) => void;
  onImageGenerate: (visualPrompt: string, refImages: string[]) => void;
}) {
  type Msg = { role: "user" | "assistant"; content: string; options?: string[]; rawContent?: string; visualPrompt?: string };
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Ne hazırlayayım? Konu veya mood söyle, gerisini hallederim." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refImages, setRefImages] = useState<string[]>([]);
  const refFileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const addRefImage = (file: File) => {
    if (refImages.length >= 3) return;
    const reader = new FileReader();
    reader.onload = (e) => { const url = e.target?.result as string; setRefImages((p) => [...p, url].slice(0, 3)); };
    reader.readAsDataURL(file);
  };

  const parseAndApply = useCallback(async (text: string): Promise<{ clean: string; options: string[]; visualPrompt?: string }> => {
    const optMatch = text.match(/<options>([\s\S]*?)<\/options>/);
    const options = optMatch ? optMatch[1].split("|").map((o) => o.trim()).filter(Boolean) : [];

    const hasPostData = /<post_data>[\s\S]*?<\/post_data>/.test(text);
    let visualPrompt: string | undefined;
    let clean: string;

    if (hasPostData) {
      const capTr = text.match(/<caption_tr>([\s\S]*?)<\/caption_tr>/)?.[1]?.trim() ?? "";
      const capEn = text.match(/<caption_en>([\s\S]*?)<\/caption_en>/)?.[1]?.trim() ?? "";
      const hashRaw = text.match(/<hashtags>([\s\S]*?)<\/hashtags>/)?.[1]?.trim() ?? "";
      const tagsRaw = text.match(/<tags>([\s\S]*?)<\/tags>/)?.[1]?.trim() ?? "";
      const vp = text.match(/<visual_prompt>([\s\S]*?)<\/visual_prompt>/)?.[1]?.trim() ?? "";
      const cta = text.match(/<cta>([\s\S]*?)<\/cta>/)?.[1]?.trim() ?? "";
      const loc = text.match(/<location>([\s\S]*?)<\/location>/)?.[1]?.trim() ?? "";

      const update: Parameters<typeof onTextUpdate>[0] = {};
      if (capTr) update.caption = capTr;
      if (capEn) update.captionEn = capEn;
      if (hashRaw) update.hashtags = hashRaw.split(/[\s#]+/).map((h) => h.replace(/^#/, "")).filter(Boolean);
      if (tagsRaw) update.tags = tagsRaw.split(/\s+/).filter(Boolean);
      if (cta) update.cta = cta;
      if (loc) update.location = loc;

      if (Object.keys(update).length > 0) {
        onTextUpdate(update);
        // Persist text fields
        setSaving(true);
        try {
          await fetch(`/api/v1/${projectSlug}/campaigns/${campaignId}/posts/${postId}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ caption: update.caption ?? caption, caption_en: update.captionEn ?? captionEn, hashtags: update.hashtags ?? hashtags, tags: update.tags, cta: update.cta, location: update.location }),
          });
        } finally { setSaving(false); }
      }

      if (vp) visualPrompt = vp;

      const preXml = text.replace(/<post_data>[\s\S]*?<\/post_data>/g, "").replace(/<options>[\s\S]*?<\/options>/g, "").trim();
      clean = (preXml ? `${preXml}\n\n` : "") + "✅ Caption ve hashtag'ler güncellendi." + (vp ? "\n\n📸 Görsel hazır — aşağıdaki butona bas." : "");
    } else {
      clean = text.replace(/<options>[\s\S]*?<\/options>/g, "").replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, "").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
    }

    return { clean, options, visualPrompt };
  }, [projectSlug, campaignId, postId, caption, captionEn, hashtags, onTextUpdate]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    setMessages((p) => [...p, { role: "user" as const, content: text.trim() }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/v1/${projectSlug}/campaign-ai`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: text.trim(), campaignAim, personaName,
          postContext: { caption, captionEn, hashtags, aspectRatio },
          history: messages.slice(-8).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.rawContent ?? m.content }] })),
          referenceImages: refImages,
        }),
      });
      const data = await res.json();
      const aiText = data.content || "⚠️ Hata oluştu.";
      const { clean, options, visualPrompt } = await parseAndApply(aiText);
      setMessages((p) => [...p, { role: "assistant" as const, content: clean, options, rawContent: aiText, visualPrompt }]);
      // Note: refImages are intentionally kept after chat — cleared only after image generation
    } finally { setLoading(false); }
  }, [loading, projectSlug, campaignAim, personaName, caption, captionEn, hashtags, aspectRatio, messages, refImages, parseAndApply]);

  const quickPrompts = ["Post yaz", "Hashtag üret", "Caption geliştir", "Farklı mood", "CTA ekle"];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-white flex items-center gap-1.5"><span style={{ color: "#f4a261" }}>✦</span> Campaign AI</p>
          {saving && <p className="text-[10px] text-orange-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Kaydet</p>}
        </div>
        <p className="text-[10px] text-white/30 mt-0.5">Söyle → caption+hashtag otomatik dolar → görseli ayrı üret</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div className="max-w-[92%] px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap"
              style={{ backgroundColor: m.role === "user" ? "#e05d44" : "rgba(255,255,255,0.07)", color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.85)", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px" }}>
              {m.content}
            </div>
            {/* Option chips */}
            {m.role === "assistant" && m.options && m.options.length > 0 && i === messages.length - 1 && !loading && (
              <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-[92%]">
                {m.options.map((opt) => (
                  <button key={opt} onClick={() => sendMessage(opt)} disabled={loading}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white transition-all hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg, rgba(224,93,68,0.4), rgba(244,162,97,0.3))", border: "1px solid rgba(224,93,68,0.4)" }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {/* Generate Image button — appears after AI provides visual_prompt */}
            {m.role === "assistant" && m.visualPrompt && i === messages.length - 1 && !loading && (
              <motion.button
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => onImageGenerate(m.visualPrompt!, refImages)}
                className="mt-2 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold text-white hover:scale-[1.02] active:scale-[0.97] transition-transform"
                style={{ background: "linear-gradient(135deg, #e05d44, #f4a261)", boxShadow: "0 4px 12px rgba(224,93,68,0.3)" }}>
                <Sparkles size={12} /> Görsel Üret
                {refImages.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
                    {refImages.length} ref
                  </span>
                )}
              </motion.button>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl text-[12px]" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
              <Loader2 size={11} className="animate-spin inline mr-1 text-orange-400" />
              <span className="text-white/50">Yazıyor...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-3 py-2 flex flex-wrap gap-1 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {quickPrompts.map((q) => (
          <button key={q} onClick={() => sendMessage(q)} disabled={loading}
            className="px-2 py-0.5 rounded-full text-[10px] transition-colors disabled:opacity-40"
            style={{ backgroundColor: "rgba(224,93,68,0.12)", color: "#f4a261", border: "1px solid rgba(224,93,68,0.2)" }}>
            {q}
          </button>
        ))}
      </div>

      {/* Ref image thumbnails */}
      {refImages.length > 0 && (
        <div className="px-3 py-2 flex gap-1.5 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {refImages.map((img, idx) => (
            <div key={idx} className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`ref-${idx}`} className="w-full h-full object-cover" />
              <button onClick={() => setRefImages((p) => p.filter((_, i) => i !== idx))}
                className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
          <p className="text-[9px] text-orange-400/60 self-center ml-1">{refImages.length}/3 görsel ekli</p>
        </div>
      )}

      {/* Input */}
      <div className="p-3 pt-0 shrink-0">
        <div className="flex gap-2 items-end">
          <button onClick={() => refFileRef.current?.click()} disabled={refImages.length >= 3}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-30 transition-opacity"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
            title="Referans görsel ekle (max 3)">
            <Paperclip size={13} />
          </button>
          <input ref={refFileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { Array.from(e.target.files ?? []).forEach(addRefImage); e.target.value = ""; }} />
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Konu, mood, ürün söyle..."
            className="flex-1 resize-none text-[12px] px-3 py-2 rounded-xl outline-none"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", minHeight: "36px", maxHeight: "72px" }} rows={1} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-30 self-end"
            style={{ background: "linear-gradient(135deg, #e05d44, #f4a261)" }}>
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PostEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params["project-slug"] as string;
  const campaignId = params.id as string;
  const postId = params.postId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiGenRunning, setAiGenRunning] = useState(false);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [captionEn, setCaptionEn] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [cta, setCta] = useState<string | null>(null);
  const [visualPrompt, setVisualPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [postType, setPostType] = useState<PostType>("feed");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [altText, setAltText] = useState("");
  const [campaignAim, setCampaignAim] = useState("");
  const [personaName, setPersonaName] = useState("Aura");

  // Resizable panel widths
  const [leftW, setLeftW] = useState(280);
  const [rightW, setRightW] = useState(310);

  const handleLeftDrag = useCallback((dx: number) => {
    setLeftW((w) => Math.max(200, Math.min(480, w + dx)));
  }, []);
  const handleRightDrag = useCallback((dx: number) => {
    setRightW((w) => Math.max(240, Math.min(500, w - dx)));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/${projectSlug}/campaigns/${campaignId}/posts/${postId}`).then((r) => r.json()),
      fetch(`/api/v1/${projectSlug}/campaigns/${campaignId}`).then((r) => r.json()),
    ]).then(([postData, campData]) => {
      const p: SocialPost = postData.post;
      if (p) {
        setImageUrl(p.image_url); setCaption(p.caption); setCaptionEn(p.caption_en);
        setHashtags(p.hashtags ?? []); setTags(p.tags ?? []); setLocation(p.location);
        setCta(p.cta); setVisualPrompt(p.visual_prompt ?? "");
        setAspectRatio(p.aspect_ratio as AspectRatio); setPostType(p.post_type as PostType);
        setStatus(p.status as PostStatus); setAltText(p.alt_text ?? "");
      }
      if (campData.campaign) { setCampaignAim(campData.campaign.aim ?? ""); setPersonaName(campData.campaign.persona_name ?? "Aura"); }
    }).finally(() => setLoading(false));
  }, [projectSlug, campaignId, postId]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/v1/${projectSlug}/campaigns/${campaignId}/posts/${postId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl, caption, caption_en: captionEn, hashtags, tags, location, alt_text: altText, cta, visual_prompt: visualPrompt, aspect_ratio: aspectRatio, post_type: postType, status }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }, [projectSlug, campaignId, postId, imageUrl, caption, captionEn, hashtags, tags, location, altText, cta, visualPrompt, aspectRatio, postType, status]);

  // Called by CampaignChat — immediately updates text fields
  const handleTextUpdate = useCallback((data: { caption?: string; captionEn?: string; hashtags?: string[]; tags?: string[]; cta?: string; location?: string }) => {
    if (data.caption !== undefined) setCaption(data.caption);
    if (data.captionEn !== undefined) setCaptionEn(data.captionEn);
    if (data.hashtags !== undefined) setHashtags(data.hashtags);
    if (data.tags !== undefined) setTags(data.tags);
    if (data.cta !== undefined) setCta(data.cta);
    if (data.location !== undefined) setLocation(data.location);
  }, []);

  // Called when user presses "Görsel Üret" button in chat
  const handleImageGenerate = useCallback(async (vp: string, refs: string[] = []) => {
    setVisualPrompt(vp);
    setAiGenRunning(true);
    try {
      const res = await fetch(`/api/v1/${projectSlug}/ai-image`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: vp, aspectRatio, referenceImages: refs.slice(0, 3) }),
      });
      const imgData = await res.json();
      if (imgData.url) {
        setImageUrl(imgData.url);
        // Clear reference images after they've been used for generation
        if (refs.length > 0) setRefImages([]);
      }
    } catch { /* silent */ } finally { setAiGenRunning(false); }
  }, [projectSlug, aspectRatio]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0e0e1a]">
      <Loader2 size={22} className="animate-spin text-orange-400" />
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#0e0e1a", color: "#fff" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(14,14,26,0.95)" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/${projectSlug}/admin/campaigns/${campaignId}`)} className="p-1.5 rounded-lg text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={15} />
          </button>
          <span className="text-[13px] font-semibold text-white/60">Post Editörü</span>
        </div>
        <div className="flex items-center gap-2">
          {aiGenRunning && <span className="text-[11px] text-orange-400 flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Görsel üretiliyor...</span>}
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white disabled:opacity-50 transition-all"
            style={{ background: saved ? "#2a9d8f" : "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {saving ? <Loader2 size={11} className="animate-spin" /> : saved ? <CheckCircle size={11} /> : <Save size={11} />}
            {saving ? "Kaydediliyor" : saved ? "Kaydedildi" : "Kaydet"}
          </button>
        </div>
      </div>

      {/* 3-panel body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel — resizable */}
        <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: `${leftW}px` }}>
          <LeftPanel
            imageUrl={aiGenRunning ? null : imageUrl}
            aspectRatio={aspectRatio}
            projectSlug={projectSlug}
            visualPrompt={visualPrompt}
            caption={caption}
            hashtags={hashtags}
            status={status}
            aiGenerating={aiGenRunning}
            onImageChange={setImageUrl}
            onAspectRatioChange={setAspectRatio}
            onVisualPromptChange={setVisualPrompt}
            onStatusChange={setStatus}
            onCaptionChange={setCaption}
            onHashtagsChange={setHashtags}
          />
        </div>

        {/* Drag handle — left */}
        <DragHandle onDrag={handleLeftDrag} />

        {/* Middle — iPhone preview (takes remaining space) */}
        <div className="flex-1 overflow-hidden" style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          <IPhonePreview
            imageUrl={imageUrl}
            caption={caption}
            hashtags={hashtags}
            aspectRatio={aspectRatio}
            location={location}
          />
        </div>

        {/* Drag handle — right */}
        <DragHandle onDrag={handleRightDrag} />

        {/* Right panel — resizable */}
        <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: `${rightW}px`, borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
          <CampaignChat
            projectSlug={projectSlug}
            campaignId={campaignId}
            postId={postId}
            caption={caption}
            captionEn={captionEn}
            hashtags={hashtags}
            campaignAim={campaignAim}
            personaName={personaName}
            aspectRatio={aspectRatio}
            onTextUpdate={handleTextUpdate}
            onImageGenerate={handleImageGenerate}
          />
        </div>
      </div>
    </div>
  );
}

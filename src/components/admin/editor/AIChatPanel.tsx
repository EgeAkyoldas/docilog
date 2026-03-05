"use client";

import {
  Loader2, Send, Trash2, X, Download, Copy, Check,
  ImagePlus, ArrowUpRight, Sparkles, FileText, Palette,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage } from "../hooks/useAIChat";

/* ─── Style helpers (brand-token CSS vars) ─── */
const BRAND_TEXT: React.CSSProperties = { color: "var(--color-brand-primary)" };
const BTN_FILLED: React.CSSProperties = {
  backgroundColor: "var(--color-brand-primary)",
  color: "var(--color-brand-primary-text)",
};

/* ─── Markdown-ish renderer ─── */
function renderMarkdown(text: string): string {
  let html = text;

  // Code blocks ```lang\n...\n```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre class="chat-code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');

  // Color-coded prompt labels
  html = html.replace(/\*\*🖼️ Image Prompt \(EN\):\*\*/g,
    '<div class="chat-prompt-label chat-prompt-image"><span class="chat-prompt-icon">🖼️</span> IMAGE PROMPT</div>');
  html = html.replace(/\*\*🎬 Video Prompt \(EN\):\*\*/g,
    '<div class="chat-prompt-label chat-prompt-video"><span class="chat-prompt-icon">🎬</span> VIDEO PROMPT</div>');
  html = html.replace(/\*\*📝 İçerik Fikri:\*\*/g,
    '<div class="chat-prompt-label chat-prompt-content"><span class="chat-prompt-icon">📝</span> İÇERİK FİKRİ</div>');
  html = html.replace(/\*\*🇹🇷 Türkçe:\*\*/g,
    '<div class="chat-prompt-label chat-prompt-tr"><span class="chat-prompt-icon">🇹🇷</span> TÜRKÇE</div>');
  html = html.replace(/\*\*🇬🇧 English:\*\*/g,
    '<div class="chat-prompt-label chat-prompt-en"><span class="chat-prompt-icon">🇬🇧</span> ENGLISH</div>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h4 class="chat-h4">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="chat-h3">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 class="chat-h2">$1</h2>');

  // Unordered lists
  html = html.replace(/^[•\-\*] (.+)$/gm, '<li class="chat-li">$1</li>');
  html = html.replace(/(<li class="chat-li">.*<\/li>\n?)+/g, (m) => `<ul class="chat-ul">${m}</ul>`);

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="chat-oli">$1</li>');
  html = html.replace(/(<li class="chat-oli">.*<\/li>\n?)+/g, (m) => `<ol class="chat-ol">${m}</ol>`);

  // Line breaks (double newline = paragraph, single newline = br)
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br/>");

  // Wrap in paragraph
  if (!html.startsWith("<")) html = `<p>${html}</p>`;

  return html;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ─── Props ─── */
interface AIChatPanelProps {
  projectSlug: string;
  language: "tr" | "en";
  messages: ChatMessage[];
  inputValue: string;
  isStreaming: boolean;
  attachedImages: string[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onSend: (text: string) => void;
  onInputChange: (v: string) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onRemoveAttachedImage: (i: number) => void;
  onGenerateImage: (prompt: string) => void;
  onInsertToEditor: (url: string) => void;
  onApplyEdit: (html: string) => void;
  onClearHistory: () => void;
}

/* ─── Chat Image Actions ─── */
function ChatImageActions({ url, onInsert }: {
  url: string;
  onInsert: (url: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
      <button
        onClick={() => onInsert(url)}
        className="flex items-center gap-1 px-2 py-1 micro-radius text-[9px] font-bold transition-colors"
        style={{ backgroundColor: "var(--color-surface-overlay)", color: "var(--color-brand-primary)" }}
        title="Editöre ekle"
      >
        <ArrowUpRight size={9} />
        Editöre Ekle
      </button>
      <button
        onClick={() => onInsert(`[REF]${url}`)}
        className="flex items-center gap-1 px-2 py-1 micro-radius text-[9px] font-bold transition-colors"
        style={{ backgroundColor: "var(--color-surface-overlay)", color: "#2a9d8f" }}
        title="Referans olarak kullan"
      >
        <Palette size={9} />
        Referans
      </button>
      <a
        href={url}
        download
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 px-2 py-1 micro-radius text-[9px] font-bold transition-colors"
        style={{ backgroundColor: "var(--color-surface-overlay)", color: "var(--color-secondary)" }}
        title="İndir"
      >
        <Download size={9} />
        İndir
      </a>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 px-2 py-1 micro-radius text-[9px] font-bold transition-colors"
        style={{ backgroundColor: "var(--color-surface-overlay)", color: "var(--color-secondary)" }}
        title="URL kopyala"
      >
        {copied ? <Check size={9} /> : <Copy size={9} />}
        {copied ? "Kopyalandı" : "Kopyala"}
      </button>
    </div>
  );
}

/* ─── Message Bubble ─── */
function MessageBubble({ msg, onInsert, onApplyEdit }: {
  msg: ChatMessage;
  onInsert: (url: string) => void;
  onApplyEdit: (html: string) => void;
}) {
  const isUser = msg.role === "user";

  // Try to extract <edit>...</edit> blocks
  const editMatch = msg.content.match(/<edit>([\s\S]*?)<\/edit>/);
  const mainContent = msg.content.replace(/<edit>[\s\S]*?<\/edit>/g, "").trim();

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[90%] px-3 py-2.5 micro-radius text-[12px] leading-relaxed ${
          isUser ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
        style={
          isUser
            ? { backgroundColor: "var(--color-brand-primary)", color: "var(--color-brand-primary-text)" }
            : { backgroundColor: "var(--color-surface-overlay)", color: "var(--color-body)", border: "1px solid var(--color-border)" }
        }
      >
        {/* User attached images */}
        {msg.images && isUser && (
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {msg.images.map((url, i) => (
              <div key={i} className="relative w-16 h-16 micro-radius overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Attached ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {mainContent && (
          <div
            className="chat-message-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(mainContent) }}
          />
        )}

        {/* AI-generated images */}
        {msg.images && !isUser && (
          <div className="mt-2 space-y-2">
            {msg.images.map((url, i) => (
              <div key={i}>
                <div className="relative micro-radius overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Generated ${i + 1}`} className="w-full h-auto max-h-[200px] object-cover" />
                </div>
                <ChatImageActions url={url} onInsert={onInsert} />
              </div>
            ))}
          </div>
        )}

        {/* Apply edit button */}
        {editMatch && (
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
            <button
              onClick={() => onApplyEdit(editMatch[1].trim())}
              className="flex items-center gap-1.5 px-3 py-1.5 micro-radius text-[10px] font-bold transition-all hover:opacity-80"
              style={BTN_FILLED}
            >
              <Sparkles size={10} />
              Değişiklikleri Uygula
            </button>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[9px] mt-1.5 ${isUser ? "text-right opacity-60" : "text-left opacity-40"}`}>
          {new Date(msg.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Chat Panel ─── */
export function AIChatPanel({
  messages,
  inputValue,
  isStreaming,
  attachedImages,
  scrollRef,
  onSend,
  onInputChange,
  onPaste,
  onRemoveAttachedImage,
  onGenerateImage,
  onInsertToEditor,
  onApplyEdit,
  onClearHistory,
}: AIChatPanelProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showImageGen, setShowImageGen] = useState(false);
  const [imageGenPrompt, setImageGenPrompt] = useState("");

  // Auto-resize textarea
  const adjustTextarea = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() && attachedImages.length === 0) return;
    onSend(inputValue);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageGen = () => {
    if (!imageGenPrompt.trim()) return;
    onGenerateImage(imageGenPrompt);
    setImageGenPrompt("");
    setShowImageGen(false);
  };

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: "calc(100vh - 48px)" }}>
      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3"
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <div
              className="w-10 h-10 micro-radius flex items-center justify-center mb-3"
              style={{ backgroundColor: "var(--color-surface-overlay)" }}
            >
              <FileText size={18} style={BRAND_TEXT} />
            </div>
            <p className="text-[12px] font-semibold text-heading mb-1">Dokümanla Konuş</p>
            <p className="text-[10px] text-muted leading-relaxed max-w-[220px]">
              Editördeki içerik hakkında soru sor, düzenleme öner veya görsel üret.
              AI yanıtlarını doğrudan editöre uygulayabilirsin.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onInsert={onInsertToEditor}
              onApplyEdit={onApplyEdit}
            />
          ))
        )}

        {/* Typing indicator */}
        {isStreaming && (
          <div className="flex justify-start mb-3">
            <div
              className="px-3 py-2.5 micro-radius flex items-center gap-2"
              style={{ backgroundColor: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}
            >
              <Loader2 size={12} className="animate-spin" style={BRAND_TEXT} />
              <span className="text-[11px] text-muted">Düşünüyor...</span>
            </div>
          </div>
        )}
      </div>

      {/* Image generation mini-panel */}
      {showImageGen && (
        <div className="px-3 py-2" style={{ borderTop: "1px solid var(--color-brand-border)" }}>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={imageGenPrompt}
              onChange={(e) => setImageGenPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleImageGen(); }}
              placeholder="Görsel açıklama..."
              className="input-boutique text-[11px] flex-1 py-1!"
              autoFocus
            />
            <button
              onClick={handleImageGen}
              disabled={!imageGenPrompt.trim() || isStreaming}
              className="panel-btn disabled:opacity-30 px-2 py-1"
            >
              <Sparkles size={11} />
            </button>
            <button
              onClick={() => setShowImageGen(false)}
              className="text-muted hover:text-secondary"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Attached images preview */}
      {attachedImages.length > 0 && (
        <div className="px-3 py-2 flex gap-1.5 flex-wrap" style={{ borderTop: "1px solid var(--color-border)" }}>
          {attachedImages.map((url, i) => (
            <div key={i} className="relative group w-12 h-12 micro-radius overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Attached ${i}`} className="w-full h-full object-cover" />
              <button
                onClick={() => onRemoveAttachedImage(i)}
                className="absolute top-0 right-0 p-0.5 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={8} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="px-3 py-2.5" style={{ borderTop: "1px solid var(--color-brand-border)" }}>
        {/* Context badge + actions */}
        <div className="flex items-center justify-between mb-2">
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 micro-radius text-[9px] font-semibold"
            style={{ backgroundColor: "var(--color-surface-overlay)", color: "var(--color-secondary)" }}
          >
            <FileText size={8} />
            Doküman bağlı
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowImageGen(!showImageGen)}
              className="p-1 text-muted hover:text-heading transition-colors micro-radius"
              title="Görsel üret"
              style={showImageGen ? { backgroundColor: "var(--color-surface-overlay)" } : undefined}
            >
              <ImagePlus size={12} />
            </button>
            {messages.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-1 text-muted hover:text-heading transition-colors micro-radius"
                title="Sohbeti temizle"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Input row */}
        <div className="flex gap-1.5 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              onInputChange(e.target.value);
              adjustTextarea();
            }}
            onKeyDown={handleKeyDown}
            onPaste={onPaste}
            placeholder="Mesaj yazın... (Ctrl+V ile görsel yapıştırabilirsiniz)"
            className="input-boutique text-[12px] flex-1 resize-none overflow-hidden py-2!"
            rows={1}
            style={{ minHeight: "36px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || (!inputValue.trim() && attachedImages.length === 0)}
            className="shrink-0 p-2 micro-radius transition-all disabled:opacity-20"
            style={BTN_FILLED}
          >
            {isStreaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

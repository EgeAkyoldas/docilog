"use client";

import { useState, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";

/* ── Types ── */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  images?: string[];       // attached image URLs (user paste or AI-generated)
  appliedEdits?: boolean;  // if user applied suggested edits
}

interface ChatState {
  messages: ChatMessage[];
  inputValue: string;
  isStreaming: boolean;
  attachedImages: string[];  // images pasted/attached before send
}

/* ── Hook ── */

export function useAIChat(projectSlug: string, editor: Editor | null) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    inputValue: "",
    isStreaming: false,
    attachedImages: [],
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ── Helpers ── */

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  const genId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  /* ── Send Message ── */

  const sendMessage = useCallback(async (
    text: string,
    title: string,
    language: "tr" | "en",
    persona: string,
  ) => {
    if (!text.trim() && state.attachedImages.length === 0) return;
    if (state.isStreaming) return;

    const editorContent = editor?.getHTML() ?? "";

    // Add user message
    const userMsg: ChatMessage = {
      id: genId(),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
      images: state.attachedImages.length > 0 ? [...state.attachedImages] : undefined,
    };

    const updatedMessages = [...state.messages, userMsg];

    setState(prev => ({
      ...prev,
      messages: updatedMessages,
      inputValue: "",
      attachedImages: [],
      isStreaming: true,
    }));

    scrollToBottom();

    // Build conversation history for multi-turn (last 10 messages)
    const historyForAPI = updatedMessages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      console.log(`[INDEX-17] useAIChat.sendMessage called. Sending prompt to AI.`);
      abortRef.current = new AbortController();
      timeoutId = setTimeout(() => abortRef.current?.abort(), 60000); // 60s timeout

      const res = await fetch(`/api/v1/${projectSlug}/ai-assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          action: "chat",
          content: editorContent,
          title,
          prompt: text.trim(),
          language: language === "en" ? "en" : "tr",
          persona,
          history: historyForAPI,
          referenceImages: userMsg.images,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${res.status}`);
      }

      const data = await res.json();
      const aiText = data.result || "Yanıt alınamadı.";

      // Extract any generated image URLs from the response
      const aiImages: string[] = [];
      // Check if there are image URLs embedded in the response
      const imgMatches = aiText.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|webp|gif)/gi);
      if (imgMatches) {
        aiImages.push(...imgMatches);
      }

      const aiMsg: ChatMessage = {
        id: genId(),
        role: "assistant",
        content: aiText,
        timestamp: Date.now(),
        images: aiImages.length > 0 ? aiImages : undefined,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMsg],
        isStreaming: false,
      }));

      scrollToBottom();
      console.log(`[INDEX-18] useAIChat.sendMessage successfully completed.`);
    } catch (err) {
      clearTimeout(timeoutId);

      if ((err as Error).name === "AbortError") {
        // Timeout or manual cancel — reset state and show message
        const timeoutMsg: ChatMessage = {
          id: genId(),
          role: "assistant",
          content: "⏱️ Yanıt zaman aşımına uğradı. Lütfen tekrar deneyin.",
          timestamp: Date.now(),
        };
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, timeoutMsg],
          isStreaming: false,
        }));
        console.error("[INDEX-19] useAIChat Chat error (AbortError):", err);
        return;
      }

      const errorMsg: ChatMessage = {
        id: genId(),
        role: "assistant",
        content: `⚠️ Hata: ${(err as Error).message}`,
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMsg],
        isStreaming: false,
      }));
      console.error("[INDEX-19] useAIChat Chat error:", err);
    }
  }, [state.messages, state.attachedImages, state.isStreaming, editor, projectSlug, scrollToBottom]);

  /* ── Image paste (Ctrl+V) ── */

  const handlePaste = useCallback(async (e: ClipboardEvent | React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        // Upload the image
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "chat");

        try {
          const res = await fetch(`/api/v1/${projectSlug}/upload`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.url) {
            setState(prev => ({
              ...prev,
              attachedImages: [...prev.attachedImages, data.url],
            }));
          }
        } catch {
          // Fallback: use object URL for preview (won't persist)
          const objectUrl = URL.createObjectURL(file);
          setState(prev => ({
            ...prev,
            attachedImages: [...prev.attachedImages, objectUrl],
          }));
        }
        break;
      }
    }
  }, [projectSlug]);

  /* ── Generate image in chat ── */

  const generateImage = useCallback(async (
    prompt: string,
    slug: string,
  ) => {
    if (!prompt.trim()) return;

    setState(prev => ({ ...prev, isStreaming: true }));

    try {
      const res = await fetch(`/api/v1/${projectSlug}/ai-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          slug,
          size: "square",
        }),
      });

      const data = await res.json();

      if (data.url) {
        const imgMsg: ChatMessage = {
          id: genId(),
          role: "assistant",
          content: `🖼️ **Görsel üretildi:**\n\n"${prompt}"`,
          timestamp: Date.now(),
          images: [data.url],
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, imgMsg],
          isStreaming: false,
        }));

        scrollToBottom();
        return data.url;
      }

      throw new Error(data.error || "Görsel üretilemedi");
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: genId(),
        role: "assistant",
        content: `⚠️ Görsel üretilemedi: ${(err as Error).message}`,
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMsg],
        isStreaming: false,
      }));
      return null;
    }
  }, [projectSlug, scrollToBottom]);

  /* ── Apply AI-suggested edits to editor ── */

  const applyEdit = useCallback((htmlContent: string) => {
    if (!editor) return;
    editor.commands.setContent(htmlContent);
  }, [editor]);

  /* ── Insert image into editor (or use as reference) ── */

  const insertImageToEditor = useCallback((url: string) => {
    if (!editor) return;

    // If URL starts with [REF], attach as reference image for next message
    if (url.startsWith("[REF]")) {
      const actualUrl = url.replace("[REF]", "");
      setState(prev => ({
        ...prev,
        attachedImages: [...prev.attachedImages, actualUrl],
      }));
      return;
    }

    editor.commands.insertContent(`<img src="${url}" alt="Chat image" />`);
  }, [editor]);

  /* ── Remove attached image ── */

  const removeAttachedImage = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      attachedImages: prev.attachedImages.filter((_, i) => i !== index),
    }));
  }, []);

  /* ── Clear history ── */

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, messages: [], attachedImages: [] }));
  }, []);

  /* ── Cancel streaming ── */

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, isStreaming: false }));
  }, []);

  /* ── Input management ── */

  const setInputValue = useCallback((v: string) => {
    setState(prev => ({ ...prev, inputValue: v }));
  }, []);

  return {
    messages: state.messages,
    inputValue: state.inputValue,
    isStreaming: state.isStreaming,
    attachedImages: state.attachedImages,
    scrollRef,
    sendMessage,
    handlePaste,
    generateImage,
    applyEdit,
    insertImageToEditor,
    removeAttachedImage,
    clearHistory,
    cancelStream,
    setInputValue,
  };
}

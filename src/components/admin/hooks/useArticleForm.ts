"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import type { Lang } from "@/types";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function useArticleForm(articleId: string | undefined, projectSlug: string, editor: Editor | null) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("other");
  const [language, setLanguage] = useState<Lang>("tr");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    console.log("[INDEX-1] useArticleForm mounted/updated. Current articleId prop:", articleId, "Ref:", createdArticleIdRef.current);
  }, [articleId]);

  // Track the effective article ID — undefined for new, set after first POST
  const createdArticleIdRef = useRef<string | undefined>(articleId);

  useEffect(() => {
    if (articleId) createdArticleIdRef.current = articleId;
  }, [articleId]);

  // Per-language content cache
  const translationCache = useRef<
    Record<Lang, { title: string; content: string; meta_description: string | null }>
  >({
    tr: { title: "", content: "", meta_description: null },
    en: { title: "", content: "", meta_description: null },
  });

  const [metaDescriptions, setMetaDescriptions] = useState<Record<Lang, string | null>>({
    tr: null,
    en: null,
  });

  const getMetaDescription = useCallback(
    (lang: Lang) => metaDescriptions[lang],
    [metaDescriptions]
  );

  const setMetaDescription = useCallback((value: string | null, lang: Lang) => {
    setMetaDescriptions((prev) => ({ ...prev, [lang]: value }));
    translationCache.current[lang].meta_description = value;
  }, []);

  // Dirty tracking
  useEffect(() => { setIsDirty(true); }, [title]);
  useEffect(() => {
    if (!editor) return;
    const handler = () => setIsDirty(true);
    editor.on("update", handler);
    return () => { editor.off("update", handler); };
  }, [editor]);

  // Auto-save every 30s
  useEffect(() => {
    if (!isDirty || !editor || !title.trim()) return;

    autoSaveTimerRef.current = setTimeout(async () => {
      const id = createdArticleIdRef.current;
      console.log(`[INDEX-2] Auto-save triggered. ID: ${id}, Title: ${title}`);
      try {
        const endpoint = id ? `/api/v1/${projectSlug}/articles/${id}` : `/api/v1/${projectSlug}/articles`;
        const res = await fetch(endpoint, {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title, slug: slug || toSlug(title), category, language,
            content: editor.getHTML(), thumbnail: null, status: "draft",
            meta_description: translationCache.current[language].meta_description,
          }),
        });
        if (res.ok) {
          if (!id) {
            const data = await res.json().catch(() => null);
            if (data?.article?.id) {
              console.log(`[INDEX-3] Auto-save created NEW article with ID: ${data.article.id}`);
              createdArticleIdRef.current = data.article.id;
            }
          } else {
            console.log(`[INDEX-4] Auto-save updated existing article ID: ${id}`);
          }
          setLastSavedAt(new Date());
          setIsDirty(false);
        }
      } catch { /* silent auto-save failure */ }
    }, 30_000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [isDirty, editor, title, slug, category, language, projectSlug]);

  // Load existing article
  useEffect(() => {
    if (!articleId || !editor) return;
    async function loadArticle() {
      try {
        const res = await fetch(`/api/v1/${projectSlug}/articles/${articleId}`);
        if (!res.ok) return;
        const data = await res.json();
        const article = data.article;
        const translations: Array<{
          language: string;
          title: string;
          content: string;
          meta_description?: string | null;
        }> = data.translations ?? [];

        if (article.slug) setSlug(article.slug);
        if (article.category) setCategory(article.category);

        const newMeta: Record<Lang, string | null> = { tr: null, en: null };
        for (const t of translations) {
          const lang = t.language as Lang;
          translationCache.current[lang] = {
            title: t.title || "",
            content: t.content || "",
            meta_description: t.meta_description ?? null,
          };
          newMeta[lang] = t.meta_description ?? null;
        }
        setMetaDescriptions(newMeta);

        const tr = translations.find((t) => t.language === "tr");
        const active = tr || translations[0];
        if (active) {
          setLanguage(active.language as Lang);
          setTitle(active.title || "");
          if (active.content && editor) editor.commands.setContent(active.content);
        }
        setIsDirty(false);
      } catch (err) { 
        console.error("[INDEX-6] loadArticle failed:", err);
      }
    }
    console.log("[INDEX-5] Attempting to load existing article ID:", articleId);
    loadArticle();
  }, [articleId, editor, projectSlug]);

  const switchLanguage = useCallback((targetLang: Lang) => {
    if (targetLang === language || !editor) return;
    translationCache.current[language] = {
      title,
      content: editor.getHTML(),
      meta_description: translationCache.current[language].meta_description,
    };
    const cached = translationCache.current[targetLang];
    setTitle(cached?.title || "");
    editor.commands.setContent(cached?.content || "");
    setLanguage(targetLang);
    setMetaDescriptions((prev) => ({ ...prev, [targetLang]: cached?.meta_description ?? null }));
  }, [language, title, editor]);

  const autoSlug = useCallback((value: string) => {
    setTitle(value);
    if (!createdArticleIdRef.current) setSlug(toSlug(value));
  }, []);

  const handleSave = useCallback(async (
    status: "draft" | "published",
    thumbnail: string | null,
    metaDesc?: string | null
  ) => {
    if (!editor) return;
    const id = createdArticleIdRef.current;
    const effectiveTitle = title.trim()
      || translationCache.current[language === "en" ? "tr" : "en"].title.trim();
    if (!id && !effectiveTitle) {
      console.log("[INDEX-7] handleSave aborted: no title and no idea.");
      setSaveError("Kaydetmek için önce bir başlık girin.");
      return;
    }
    const titleToSend = title.trim() || effectiveTitle;

    console.log(`[INDEX-8] handleSave started. ID: ${id}, Status: ${status}`);
    setSaving(true);
    setSaveError(null);

    // Update cache for current language before saving
    translationCache.current[language] = {
      title: titleToSend,
      content: editor.getHTML(),
      meta_description: metaDesc !== undefined ? metaDesc : translationCache.current[language].meta_description,
    };

    const finalMeta = metaDesc !== undefined
      ? metaDesc
      : translationCache.current[language].meta_description;
    try {
      const endpoint = id ? `/api/v1/${projectSlug}/articles/${id}` : `/api/v1/${projectSlug}/articles`;
      const res = await fetch(endpoint, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleToSend,
          slug: slug || toSlug(effectiveTitle),
          category, language,
          content: editor.getHTML(), thumbnail, status,
          meta_description: finalMeta ?? null,
        }),
      });

      if (res.ok) {
        let effectiveId = id;
        if (!id) {
          const data = await res.json().catch(() => null);
          if (data?.article?.id) {
            console.log(`[INDEX-9] handleSave created NEW article with ID: ${data.article.id}`);
            createdArticleIdRef.current = data.article.id;
            effectiveId = data.article.id;
          }
        } else {
          console.log(`[INDEX-10] handleSave updated existing article ID: ${id}`);
        }

        // Save the OTHER language too if it has content
        const otherLang: Lang = language === "tr" ? "en" : "tr";
        const otherCache = translationCache.current[otherLang];
        if (effectiveId && otherCache.title.trim() && otherCache.content.trim()) {
          await fetch(`/api/v1/${projectSlug}/articles/${effectiveId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              language: otherLang,
              title: otherCache.title,
              content: otherCache.content,
              status,
              thumbnail,
              meta_description: otherCache.meta_description ?? null,
            }),
          }).catch(() => { /* silent — primary save already succeeded */ });
        }

        setSaved(true);
        setLastSavedAt(new Date());
        setIsDirty(false);
        setTimeout(() => setSaved(false), 2500);
      } else {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        const msg = err?.error ?? "Kaydetme hatası";
        setSaveError(msg);
        console.error("[handleSave] API error", res.status, err);
      }
    } catch (e) {
      setSaveError("Bağlantı hatası");
      console.error("[handleSave] fetch error:", e);
    } finally {
      setSaving(false);
    }
  }, [editor, title, slug, category, language, projectSlug]);

  return {
    title, setTitle,
    slug, setSlug,
    category, setCategory,
    language,
    saving, saved, saveError,
    lastSavedAt, isDirty,
    metaDescriptions, getMetaDescription, setMetaDescription,
    autoSlug, switchLanguage, handleSave,
  };
}

"use client";

import { useState, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import type { Lang } from "@/types";

async function uploadFile(file: File, projectSlug: string): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "content");
  try {
    const res = await fetch(`/api/v1/${projectSlug}/upload`, { method: "POST", body: formData });
    if (res.ok) { const data = await res.json(); return data.url as string; }
  } catch { /* fallthrough */ }
  return null;
}

export function useEditorImages(projectSlug: string, editor: Editor | null) {
  // Per-language thumbnails
  const [thumbnails, setThumbnails] = useState<{ tr: string | null; en: string | null }>({
    tr: null, en: null,
  });
  const [uploading, setUploading] = useState(false);

  const thumbnailRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const getThumbnail = useCallback((lang: Lang) => thumbnails[lang], [thumbnails]);

  const setThumbnail = useCallback((url: string | null, lang: Lang) => {
    setThumbnails((prev) => ({ ...prev, [lang]: url }));
  }, []);

  const switchThumbnailLang = useCallback(
    (newLang: Lang) => thumbnails[newLang],
    [thumbnails]
  );

  const handleThumbnailUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, lang: Lang) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const url = await uploadFile(file, projectSlug);
      if (url) setThumbnail(url, lang);
      setUploading(false);
      e.target.value = "";
    },
    [setThumbnail, projectSlug]
  );

  const handleContentImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      setUploading(true);
      const url = await uploadFile(file, projectSlug);
      if (url) editor.chain().focus().setResizableImage({ src: url }).run();
      setUploading(false);
      e.target.value = "";
    },
    [editor, projectSlug]
  );

  const handleContentImageFile = useCallback(
    async (file: File) => {
      if (!file || !editor) return;
      setUploading(true);
      const url = await uploadFile(file, projectSlug);
      if (url) editor.chain().focus().setResizableImage({ src: url }).run();
      setUploading(false);
    },
    [editor, projectSlug]
  );

  return {
    thumbnails,
    getThumbnail,
    setThumbnail,
    switchThumbnailLang,
    uploading,
    thumbnailRef,
    imageRef,
    handleThumbnailUpload,
    handleContentImage,
    handleContentImageFile,
  };
}

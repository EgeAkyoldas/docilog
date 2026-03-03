"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📝");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ICONS = ["📝", "💰", "🎵", "🧠", "⚖️", "🏥", "🎮", "📊", "🔬", "🌍"];

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/hub/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, icon }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Proje oluşturulamadı");
        return;
      }

      router.push("/hub");
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-pure-white border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/hub")}
            className="text-muted hover:text-heading transition-colors text-[13px]"
          >
            ← Hub
          </button>
          <span className="text-border">/</span>
          <span className="text-heading text-[13px] font-medium">Yeni Proje</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1
            className="text-heading text-[24px] mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Yeni Proje Oluştur
          </h1>
          <p className="text-secondary text-[13px] mb-8">
            Yeni bir blog projesi oluşturun. AI persona ve kategoriler sonradan düzenlenebilir.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="card-boutique p-8 space-y-6"
        >
          {/* Icon picker */}
          <div>
            <label className="label text-muted text-[11px] mb-2 block">
              İKON
            </label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                    icon === emoji
                      ? "bg-charcoal text-white shadow-md scale-110"
                      : "bg-surface hover:bg-surface-raised"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label text-muted text-[11px] mb-1.5 block">
              PROJE ADI
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Finans Blog"
              autoFocus
              className="input-boutique"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="label text-muted text-[11px] mb-1.5 block">
              SLUG (URL)
            </label>
            <div className="flex items-center gap-1">
              <span className="text-muted text-[12px] font-mono">/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="finance-blog"
                className="input-boutique font-mono"
              />
            </div>
            <p className="text-muted text-[10px] mt-1">
              Proje URL&apos;i: /{slug || "proje-slug"}/admin/articles
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="label text-muted text-[11px] mb-1.5 block">
              AÇIKLAMA (opsiyonel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Proje hakkında kısa açıklama..."
              rows={3}
              className="input-boutique resize-y"
            />
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
            >
              {error}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim() || !slug.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Oluşturuluyor...
                </span>
              ) : (
                "Proje Oluştur"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/hub")}
              className="btn-secondary"
            >
              İptal
            </button>
          </div>
        </motion.form>
      </main>
    </div>
  );
}

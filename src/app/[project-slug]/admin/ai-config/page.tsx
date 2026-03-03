"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faFloppyDisk,
  faSpinner,
  faPlus,
  faTrashCan,
  faChevronDown,
  faChevronRight,
  faWandMagicSparkles,
  faGear,
  faImage,
  faBolt,
  faUsers,
  faToggleOff,
  faToggleOn,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

/* ─── Types ─── */
interface AIConfig {
  system_instruction: string;
  global_rules: {
    format: string;
    strict_tags: boolean;
    forbidden_phrases: string[];
    negative_constraints: string;
    writing_style_rules: string;
  };
  actions: Record<string, string>;
  image_prompt: string;
  persona_defaults: Record<string, unknown>;
}

interface Persona {
  id: string;
  name: string;
  tone: string;
  instruction: string;
  writing_style_rules: string;
  negative_constraints: string;
  sort_order: number;
  is_active: boolean;
}

/* ─── Collapsible Section ─── */
function Section({
  icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: IconDefinition;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-boutique overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-surface/50 transition-colors"
      >
        <FontAwesomeIcon icon={icon} className="fa-sm text-muted shrink-0 w-4" />
        <span
          className="text-heading text-[15px] flex-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </span>
        {open ? (
          <FontAwesomeIcon icon={faChevronDown} className="fa-xs text-muted w-3" />
        ) : (
          <FontAwesomeIcon icon={faChevronRight} className="fa-xs text-muted w-3" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-border space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── TextArea Field ─── */
function TextAreaField({
  label,
  value,
  onChange,
  rows = 6,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label text-muted text-[11px] mb-1.5 block">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border border-border rounded-lg text-[13px] text-heading bg-pure-white focus:border-charcoal focus:ring-1 focus:ring-charcoal outline-none transition-all resize-y font-mono"
      />
    </div>
  );
}

/* ─── Persona Card ─── */
function PersonaCard({
  persona,
  onChange,
  onDelete,
}: {
  persona: Persona;
  onChange: (p: Persona) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className={`card-boutique transition-all ${
        persona.is_active
          ? "border-l-2 border-l-emerald-500"
          : "border-l-2 border-l-gray-300 opacity-70"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {expanded ? (
            <FontAwesomeIcon icon={faChevronDown} className="fa-xs text-muted w-3" />
          ) : (
            <FontAwesomeIcon icon={faChevronRight} className="fa-xs text-muted w-3" />
          )}
          <span className="text-heading text-[14px] font-semibold">
            {persona.name || persona.id}
          </span>
          <span className="text-muted text-[11px] ml-1">({persona.id})</span>
        </button>

        <button
          onClick={() => onChange({ ...persona, is_active: !persona.is_active })}
          className="text-muted hover:text-heading transition-colors"
          title={persona.is_active ? "Devre Dışı Bırak" : "Aktifleştir"}
        >
          {persona.is_active ? (
            <FontAwesomeIcon icon={faToggleOn} className="fa-lg text-emerald-500" />
          ) : (
            <FontAwesomeIcon icon={faToggleOff} className="fa-lg text-muted" />
          )}
        </button>

        <button
          onClick={onDelete}
          className="text-muted hover:text-red-500 transition-colors p-1"
          title="Sil"
        >
          <FontAwesomeIcon icon={faTrashCan} className="fa-sm" />
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-border space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-muted text-[11px] mb-1 block">
                    Adı
                  </label>
                  <input
                    type="text"
                    value={persona.name}
                    onChange={(e) =>
                      onChange({ ...persona, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-[13px] text-heading bg-pure-white focus:border-charcoal outline-none"
                  />
                </div>
                <div>
                  <label className="label text-muted text-[11px] mb-1 block">
                    ID (slug)
                  </label>
                  <input
                    type="text"
                    value={persona.id}
                    disabled
                    className="w-full px-3 py-2 border border-border rounded-lg text-[13px] text-muted bg-surface cursor-not-allowed"
                  />
                </div>
              </div>

              <TextAreaField
                label="Ton"
                value={persona.tone}
                onChange={(v) => onChange({ ...persona, tone: v })}
                rows={2}
              />

              <TextAreaField
                label="Talimat"
                value={persona.instruction}
                onChange={(v) => onChange({ ...persona, instruction: v })}
                rows={5}
              />

              <TextAreaField
                label="Yazım Stili Kuralları"
                value={persona.writing_style_rules}
                onChange={(v) =>
                  onChange({ ...persona, writing_style_rules: v })
                }
                rows={3}
              />

              <TextAreaField
                label="Negatif Kısıtlamalar"
                value={persona.negative_constraints}
                onChange={(v) =>
                  onChange({ ...persona, negative_constraints: v })
                }
                rows={3}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function AIConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [forbiddenInput, setForbiddenInput] = useState("");
  const params = useParams();
  const slug = params["project-slug"] as string;

  const loadData = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/${slug}/ai-config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setPersonas(data.personas ?? []);
      } else {
        toast.error("AI ayarları yüklenemedi");
      }
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveConfig = async () => {
    if (!config || !slug) return;
    setSaving(true);
    try {
      // Save config
      const configRes = await fetch(`/api/v1/${slug}/ai-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!configRes.ok) throw new Error("Config save failed");

      // Save each persona
      for (const persona of personas) {
        const personaRes = await fetch(`/api/v1/${slug}/ai-personas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(persona),
        });
        if (!personaRes.ok) {
          console.error("Persona save failed:", persona.id);
        }
      }

      toast.success("Ayarlar kaydedildi");
    } catch {
      toast.error("Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  };

  const addPersona = async () => {
    const id = `persona_${Date.now()}`;
    const newPersona: Persona = {
      id,
      name: "Yeni Persona",
      tone: "",
      instruction: "",
      writing_style_rules: "",
      negative_constraints: "",
      sort_order: personas.length,
      is_active: true,
    };

    try {
      const res = await fetch(`/api/v1/${slug}/ai-personas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPersona),
      });
      if (res.ok) {
        setPersonas((prev) => [...prev, newPersona]);
        toast.success("Persona eklendi");
      }
    } catch {
      toast.error("Persona eklenemedi");
    }
  };

  const deletePersona = async (id: string) => {
    if (personas.length <= 1) {
      toast.error("En az bir persona olmalı");
      return;
    }
    if (!slug) return;
    try {
      const res = await fetch(`/api/v1/${slug}/ai-personas?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPersonas((prev) => prev.filter((p) => p.id !== id));
        toast.success("Persona silindi");
      }
    } catch {
      toast.error("Silme hatası");
    }
  };

  const updatePersona = (updated: Persona) => {
    setPersonas((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const addForbiddenPhrase = () => {
    if (!forbiddenInput.trim() || !config) return;
    const updated = {
      ...config,
      global_rules: {
        ...config.global_rules,
        forbidden_phrases: [
          ...config.global_rules.forbidden_phrases,
          forbiddenInput.trim(),
        ],
      },
    };
    setConfig(updated);
    setForbiddenInput("");
  };

  const removeForbiddenPhrase = (phrase: string) => {
    if (!config) return;
    setConfig({
      ...config,
      global_rules: {
        ...config.global_rules,
        forbidden_phrases: config.global_rules.forbidden_phrases.filter(
          (p) => p !== phrase
        ),
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <FontAwesomeIcon icon={faSpinner} className="fa-lg animate-spin text-muted" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-20 text-secondary">
        <p>AI ayarları henüz yapılandırılmamış.</p>
        <button onClick={loadData} className="btn-primary mt-4">
          <FontAwesomeIcon icon={faRotateRight} className="fa-sm" /> Yeniden Dene
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="label text-muted mb-1">YAPILANDIRMA</div>
          <h1
            className="text-deep-navy text-[28px]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            AI Motor Ayarları
          </h1>
          <p className="text-secondary text-[13px] mt-1">
            Promptlar, personalar ve görsel motoru yapılandırması
          </p>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <FontAwesomeIcon icon={faSpinner} className="fa-sm animate-spin" />
          ) : (
            <FontAwesomeIcon icon={faFloppyDisk} className="fa-sm" />
          )}
          {saving ? "Kaydediliyor..." : "Tümünü Kaydet"}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-4"
      >
        {/* ─── System Instruction ─── */}
        <Section icon={faWandMagicSparkles} title="Sistem Talimatı" defaultOpen>
          <TextAreaField
            label="Ana Sistem Prompt"
            value={config.system_instruction}
            onChange={(v) =>
              setConfig({ ...config, system_instruction: v })
            }
            rows={12}
            placeholder="AI'ın genel davranışını belirleyen ana talimat..."
          />
        </Section>

        {/* ─── Global Rules ─── */}
        <Section icon={faGear} title="Genel Kurallar">
          <TextAreaField
            label="Yazım Stili Kuralları"
            value={config.global_rules.writing_style_rules}
            onChange={(v) =>
              setConfig({
                ...config,
                global_rules: {
                  ...config.global_rules,
                  writing_style_rules: v,
                },
              })
            }
            rows={4}
          />

          <TextAreaField
            label="Negatif Kısıtlamalar"
            value={config.global_rules.negative_constraints}
            onChange={(v) =>
              setConfig({
                ...config,
                global_rules: {
                  ...config.global_rules,
                  negative_constraints: v,
                },
              })
            }
            rows={6}
          />

          <div>
            <label className="label text-muted text-[11px] mb-1.5 block">
              Yasaklı İfadeler
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {config.global_rules.forbidden_phrases.map((phrase) => (
                <span
                  key={phrase}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-[11px] rounded-full border border-red-200"
                >
                  {phrase}
                  <button
                    onClick={() => removeForbiddenPhrase(phrase)}
                    className="text-red-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={forbiddenInput}
                onChange={(e) => setForbiddenInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addForbiddenPhrase()}
                placeholder="Yeni yasaklı ifade ekle..."
                className="flex-1 px-3 py-2 border border-border rounded-lg text-[13px] text-heading bg-pure-white focus:border-charcoal outline-none"
              />
              <button
                onClick={addForbiddenPhrase}
                className="px-3 py-2 bg-charcoal text-white text-[12px] rounded-lg hover:bg-deep-navy transition-colors"
              >
                Ekle
              </button>
            </div>
          </div>
        </Section>

        {/* ─── Action Prompts ─── */}
        <Section icon={faBolt} title="Aksiyon Promptları">
          <p className="text-muted text-[12px] mb-2">
            Her aksiyon için kullanılan prompt şablonları.{" "}
            <code className="text-[11px]">
              {"{content}"}, {"{title}"}, {"{language}"}
            </code>{" "}
            gibi değişkenler kullanılabilir.
          </p>
          {Object.entries(config.actions).map(([key, value]) => (
            <TextAreaField
              key={key}
              label={key}
              value={value}
              onChange={(v) =>
                setConfig({
                  ...config,
                  actions: { ...config.actions, [key]: v },
                })
              }
              rows={6}
            />
          ))}
        </Section>

        {/* ─── Image Prompt ─── */}
        <Section icon={faImage} title="Görsel Motoru">
          <TextAreaField
            label="Görsel Üretim Prompt Şablonu"
            value={config.image_prompt}
            onChange={(v) => setConfig({ ...config, image_prompt: v })}
            rows={10}
            placeholder="Görsel üretimi için kullanılan prompt şablonu..."
          />
        </Section>

        {/* ─── Personas ─── */}
        <Section icon={faUsers} title="Personalar" defaultOpen>
          <p className="text-muted text-[12px] mb-3">
            Her persona, AI&apos;ın farklı bir yazı tarzı ve kişiliğini temsil
            eder. Aktif personalar makale yazımında kullanılabilir.
          </p>

          <div className="space-y-3">
            {personas.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                onChange={updatePersona}
                onDelete={() => deletePersona(persona.id)}
              />
            ))}
          </div>

          <button
            onClick={addPersona}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg text-[13px] text-muted hover:text-heading hover:border-charcoal transition-all"
          >
            <FontAwesomeIcon icon={faPlus} className="fa-sm" />
            Yeni Persona Ekle
          </button>
        </Section>
      </motion.div>

      {/* Bottom Save Button */}
      <div className="flex justify-end mt-6 mb-12">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <FontAwesomeIcon icon={faSpinner} className="fa-sm animate-spin" />
          ) : (
            <FontAwesomeIcon icon={faFloppyDisk} className="fa-sm" />
          )}
          {saving ? "Kaydediliyor..." : "Tümünü Kaydet"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Target, Instagram, Archive, ChevronRight, Zap, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Campaign {
  id: string;
  name: string;
  aim: string;
  persona_name: string;
  platform: string;
  status: "active" | "archived";
  post_count: number;
  created_at: string;
}

function NewCampaignModal({
  onClose,
  onCreated,
  projectSlug,
}: {
  onClose: () => void;
  onCreated: (c: Campaign) => void;
  projectSlug: string;
}) {
  const [name, setName] = useState("");
  const [aim, setAim] = useState("");
  const [persona, setPersona] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/${projectSlug}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), aim: aim.trim(), persona_name: persona.trim() }),
      });
      if (res.ok) {
        const { campaign } = await res.json();
        onCreated({ ...campaign, post_count: 0 });
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-pure-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
        style={{ border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}>
            <Instagram size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-heading">Yeni Kampanya</h2>
            <p className="text-[11px] text-muted">İçerik kampanyası oluştur</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label text-muted mb-1 block">Kampanya Adı *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Bahar Koleksiyonu 2025"
              className="input-boutique w-full text-[13px]"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div>
            <label className="label text-muted mb-1 block">Kampanya Hedefi</label>
            <textarea
              value={aim}
              onChange={(e) => setAim(e.target.value)}
              placeholder="Bu kampanyanın amacı nedir? Hedef kitle, mesaj, ton..."
              className="input-boutique w-full text-[12px] resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="label text-muted mb-1 block">Persona / Karakter</label>
            <input
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="Örn: Aura, Marka Sesi, Marcus..."
              className="input-boutique w-full text-[13px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary text-[12px] px-4 py-2">
            İptal
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || saving}
            className="px-4 py-2 text-[12px] font-bold rounded-lg text-white transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}
          >
            {saving ? "Oluşturuluyor..." : "Kampanya Oluştur"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CampaignCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
  const isActive = campaign.status === "active";
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="card-boutique p-5 cursor-pointer hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: isActive ? "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" : "var(--color-surface-raised)" }}
        >
          <Instagram size={18} className={isActive ? "text-white" : "text-muted"} />
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              backgroundColor: isActive ? "rgba(131,58,180,0.1)" : "var(--color-surface-raised)",
              color: isActive ? "#833ab4" : "var(--color-muted)",
            }}
          >
            {isActive ? "Aktif" : "Arşiv"}
          </span>
          <ChevronRight size={14} className="text-muted group-hover:text-heading transition-colors" />
        </div>
      </div>

      <h3 className="text-[14px] font-bold text-heading mb-1 line-clamp-1">{campaign.name}</h3>
      {campaign.aim && (
        <p className="text-[11px] text-muted mb-3 line-clamp-2">{campaign.aim}</p>
      )}

      <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-1 text-[11px] text-muted">
          <Zap size={11} />
          <span>{campaign.post_count} post</span>
        </div>
        {campaign.persona_name && (
          <div className="flex items-center gap-1 text-[11px] text-muted">
            <Target size={11} />
            <span>{campaign.persona_name}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-[11px] text-muted">
          <Calendar size={11} />
          <span>{new Date(campaign.created_at).toLocaleDateString("tr-TR", { month: "short", day: "numeric" })}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function CampaignsPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params["project-slug"] as string;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/${projectSlug}/campaigns`)
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []))
      .finally(() => setLoading(false));
  }, [projectSlug]);

  const active = campaigns.filter((c) => c.status === "active");
  const archived = campaigns.filter((c) => c.status === "archived");

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-heading tracking-tight flex items-center gap-2.5">
            <span>📱</span> Kampanyalar
          </h1>
          <p className="text-[13px] text-muted mt-0.5">Sosyal medya içerik kampanyalarını yönet</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}
        >
          <Plus size={14} />
          Yeni Kampanya
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted text-[13px]">Yükleniyor...</div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}>
            <Instagram size={28} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-bold text-heading">Henüz kampanya yok</p>
            <p className="text-[12px] text-muted mt-1">İlk kampanyanı oluşturarak başla</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="px-6 py-2.5 text-[13px] font-bold rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}
          >
            Kampanya Oluştur
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-[11px] font-bold text-muted tracking-widest uppercase mb-3">Aktif Kampanyalar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    onClick={() => router.push(`/${projectSlug}/admin/campaigns/${c.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
          {archived.length > 0 && (
            <section>
              <h2 className="text-[11px] font-bold text-muted tracking-widest uppercase mb-3 flex items-center gap-1.5">
                <Archive size={11} /> Arşiv
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {archived.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    onClick={() => router.push(`/${projectSlug}/admin/campaigns/${c.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <AnimatePresence>
        {showNew && (
          <NewCampaignModal
            projectSlug={projectSlug}
            onClose={() => setShowNew(false)}
            onCreated={(c) => setCampaigns((prev) => [c, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

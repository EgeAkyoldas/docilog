"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, ArrowLeft, Image as ImageIcon, CheckCircle, Clock, Edit3, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Campaign {
  id: string;
  name: string;
  aim: string;
  persona_name: string;
  status: string;
  post_count?: number;
}

interface Post {
  id: string;
  image_url: string | null;
  caption: string;
  hashtags: string[];
  aspect_ratio: string;
  post_type: string;
  status: "draft" | "ready" | "published";
  created_at: string;
}

// ─── Post Thumbnail ───────────────────────────────────────────────────────────
function PostThumbnail({ post, onClick }: { post: Post; onClick: () => void }) {
  const statusConfig = {
    ready:     { color: "#2a9d8f", icon: <CheckCircle size={9} /> },
    published: { color: "#e05d44", icon: <CheckCircle size={9} /> },
    draft:     { color: "rgba(255,255,255,0.25)", icon: <Clock size={9} /> },
  };
  const cfg = statusConfig[post.status];

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      onClick={onClick}
      className="relative aspect-square overflow-hidden cursor-pointer group"
      style={{ backgroundColor: "var(--color-surface-raised)", borderRadius: "4px" }}
    >
      {post.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image_url} alt={post.caption} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 opacity-30">
          <ImageIcon size={18} />
          <span className="text-[9px]">Görsel yok</span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Edit3 size={14} className="text-white" />
      </div>

      {/* Status dot */}
      <div
        className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-white text-[8px] font-bold"
        style={{ backgroundColor: cfg.color }}
      >
        {cfg.icon}
      </div>
    </motion.div>
  );
}

// ─── Main Campaign Dashboard ──────────────────────────────────────────────────
export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params["project-slug"] as string;
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/${projectSlug}/campaigns/${campaignId}`).then((r) => r.json()),
      fetch(`/api/v1/${projectSlug}/campaigns/${campaignId}/posts`).then((r) => r.json()),
    ]).then(([campData, postsData]) => {
      setCampaign(campData.campaign ?? null);
      const fetchedPosts = postsData.posts ?? [];
      setPosts(fetchedPosts);
      prevCountRef.current = fetchedPosts.length;
    }).finally(() => setLoading(false));
  }, [projectSlug, campaignId]);

  const handleCreatePost = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/v1/${projectSlug}/campaigns/${campaignId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (res.ok) {
        const { post } = await res.json();
        router.push(`/${projectSlug}/admin/campaigns/${campaignId}/posts/${post.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted text-[13px]">
        Kampanya bulunamadı.
      </div>
    );
  }

  const draftCount = posts.filter((p) => p.status === "draft").length;
  const readyCount = posts.filter((p) => p.status === "ready").length;
  const publishedCount = posts.filter((p) => p.status === "published").length;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-pure-white)" }}
      >
        <button
          onClick={() => router.push(`/${projectSlug}/admin/campaigns`)}
          className="p-1.5 hover:bg-surface-raised rounded-lg transition-colors text-muted hover:text-heading"
        >
          <ArrowLeft size={16} />
        </button>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #e05d44, #f4a261, #2a9d8f)" }}
        >
          <span className="text-white text-[14px]">📸</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold text-heading truncate">{campaign.name}</h1>
          {campaign.aim && <p className="text-[11px] text-muted truncate">{campaign.aim}</p>}
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted">
          {publishedCount > 0 && <span className="text-[#e05d44] font-bold">{publishedCount} yayında</span>}
          {readyCount > 0 && <span className="text-[#2a9d8f] font-bold">{readyCount} hazır</span>}
          {draftCount > 0 && <span>{draftCount} taslak</span>}
        </div>

        <button
          onClick={handleCreatePost}
          disabled={creating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg text-white disabled:opacity-60 transition-opacity"
          style={{ background: "linear-gradient(135deg, #e05d44, #f4a261)" }}
        >
          {creating ? <Loader2 size={11} className="animate-spin" /> : <Plus size={12} />}
          Yeni Post
        </button>
      </div>

      {/* Post Grid */}
      <div className="flex-1 overflow-auto p-6">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-20">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #e05d44, #f4a261, #2a9d8f)" }}
            >
              <ImageIcon size={26} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-bold text-heading">Henüz post yok</p>
              <p className="text-[12px] text-muted mt-1 max-w-[280px] text-center">
                Yeni Post butonuna bas, Campaign AI ile hızlıca içerik oluştur
              </p>
            </div>
            <button
              onClick={handleCreatePost}
              disabled={creating}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #e05d44, #f4a261)" }}
            >
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
              İlk Postu Oluştur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-[3px] max-w-[900px]">
            <AnimatePresence>
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                >
                  <PostThumbnail
                    post={post}
                    onClick={() => router.push(`/${projectSlug}/admin/campaigns/${campaignId}/posts/${post.id}`)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

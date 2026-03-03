<div align="center">

# 🧠 Docilog

### AI-Powered Multi-Domain Content Platform

*Create, manage, and publish expert-level content across any industry — powered by domain-specific AI personas.*

[![Next.js](https://img.shields.io/badge/Next.js_16-000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)

[Live Demo](https://docilog.netlify.app) · [Report Bug](https://github.com/EgeAkyoldas/docilog/issues) · [Request Feature](https://github.com/EgeAkyoldas/docilog/issues)

</div>

---

## 🎯 What is Docilog?

**Docilog** is a SaaS content management platform that combines a professional editor with AI-driven content generation. Each domain (finance, music, psychology, law...) gets its own expert AI personas, categories, and editorial workflow.

> **Think of it as:** A CMS where every domain has its own AI editor-in-chief, each with a unique voice, expertise, and writing style.

### 🔑 Key Value Propositions

| For | Value |
|-----|-------|
| **Content Agencies** | Manage 10+ industry blogs from a single dashboard with domain-specific AI |
| **Solo Creators** | Generate expert-level articles with AI personas that match your brand voice |
| **Media Companies** | Multi-author workflows with per-project access control and SEO automation |
| **Consultants** | White-label content platform for client domains |

---

## ✨ Features

### 🤖 AI Content Engine
- **Multi-Persona System** — Each project has its own expert AI personas (e.g., "Market Strategist", "Crypto Analyst", "Music Theorist")
- **Auto Blog Generation** — Full article creation from a single topic prompt: text, images, SEO metadata, sources
- **Batch Image Generation** — Parallel image creation via Google Imagen, style-matched to each domain
- **Smart Actions** — Improve, expand, summarize, translate, SEO optimize with one click
- **Bilingual Output** — Generate articles simultaneously in Turkish and English

### ✍️ Professional Editor
- **TipTap-Based Rich Editor** — Block-level editing with typography, media embeds, code blocks
- **Real-Time Preview** — Side-by-side edit/preview with live rendering
- **Media Upload** — Drag & drop images, video, audio with Supabase Storage
- **Export Suite** — Download as Word (.doc), PDF, or Markdown with embedded images
- **Character Count & SEO** — Word count, reading time, meta description editor

### 🏗️ Multi-Tenant SaaS Architecture
- **Project Isolation** — Each domain is a separate project with its own categories, personas, and content
- **Role-Based Access** — Master admin, project admin, editor, viewer roles
- **Dynamic Categories** — Per-project category management (no shared global enums)
- **Per-Project AI Config** — Custom system instructions, writing styles, and image prompts per domain

### 🌐 SEO & Publishing
- **AI-Generated Metadata** — Automatic slug, meta description, and keyword extraction
- **Source Verification** — Auto-checks reference URLs for accessibility
- **Bilingual Support** — TR/EN content with separate publication status
- **Semantic HTML Output** — Clean, accessible HTML ready for any frontend

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, React 19) |
| **Language** | TypeScript 5 |
| **Editor** | TipTap 3 (ProseMirror) |
| **Database** | Supabase (PostgreSQL 17) |
| **AI** | Google Gemini 2.0 Flash + Imagen 3 |
| **Storage** | Supabase Storage (images, media) |
| **Styling** | Tailwind CSS 4 |
| **Animations** | Framer Motion |
| **Auth** | Custom session-based (preset credentials) |
| **Export** | jsPDF + html2canvas, Word HTML, Markdown |
| **Deployment** | Netlify / Vercel |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI](https://ai.google.dev) API key (Gemini)

### 1. Clone & Install

```bash
git clone https://github.com/EgeAkyoldas/docilog.git
cd docilog
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Run Database Migrations

Execute the SQL files in `supabase-migrations/` in order (001 → 006) via the Supabase SQL Editor:

| Migration | Description |
|-----------|-------------|
| `001_ai_config.sql` | AI config & personas tables |
| `002_article_translations_unique.sql` | Unique constraint for bilingual upserts |
| `003_docilog_core.sql` | Users, projects, sessions, categories, project AI config |
| `004_seed_data.sql` | Admin user, sample projects (Music, Finance), personas |
| `005_rls_policies.sql` | Row Level Security for public/admin access |
| `006_finance_personas.sql` | Finance domain expert personas |

### 4. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000/music-blog/admin` or `http://localhost:3000/finance-blog/admin`.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── [project-slug]/        # Dynamic project routing
│   │   ├── admin/             # Admin panel pages
│   │   │   ├── articles/      # Article CRUD
│   │   │   ├── ai-config/     # AI configuration page
│   │   │   └── guide/         # Platform guide
│   │   └── layout.tsx         # Per-project metadata
│   ├── api/v1/
│   │   ├── [project-slug]/    # Project-scoped API routes
│   │   │   ├── ai-assist/     # AI text generation
│   │   │   ├── ai-config/     # AI config CRUD
│   │   │   └── ai-image/      # Image generation
│   │   └── auth/              # Authentication
│   └── layout.tsx             # Root layout
├── components/admin/
│   ├── editor/                # TipTap editor components
│   │   ├── AIPanel.tsx        # AI assistant sidebar
│   │   ├── ExportDropdown.tsx # Export as Word/PDF/MD
│   │   └── Toolbar.tsx        # Editor toolbar
│   ├── ArticleEditor.tsx      # Main editor component
│   └── ArticlesList.tsx       # Articles dashboard
├── config/                    # YAML-based AI prompt configs
└── lib/                       # Auth, DB, utilities
```

---

## 🎭 AI Persona System

Each project can have multiple expert personas. Here's an example from the Finance domain:

| Persona | Role | Style |
|---------|------|-------|
| 🏛️ **Cenk Akyoldaş** | Market Strategist | Rational, data-driven, mentorship tone |
| ₿ **Crypto Analyst** | Web3 & Digital Assets | Tech-focused, risk management oriented |
| 🛢️ **Commodity Strategist** | Gold, Energy & Geopolitics | Traditional, macro-prudent |
| 💰 **Personal Finance Coach** | Financial Freedom | Motivational, action-oriented |

Personas control:
- **Writing voice** — Tone, vocabulary, sentence structure
- **Negative constraints** — What NOT to say (prevents hallucination, bias)
- **Domain expertise** — Industry-specific terminology and frameworks

---

## 📸 Screenshots

> *Coming soon — deploy at `docilog.netlify.app`*

---

## 🗺️ Roadmap

- [x] Multi-project SaaS architecture
- [x] AI persona system (per-project)
- [x] Auto blog generation with batch images
- [x] Bilingual content (TR/EN)
- [x] Export suite (Word, PDF, Markdown)
- [ ] Public-facing blog frontend (reader view)
- [ ] Team collaboration (real-time editing)
- [ ] Analytics dashboard
- [ ] Custom domain mapping per project
- [ ] Webhook integrations
- [ ] AI-powered content calendar

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

<div align="center">

**Built with ❤️ by [Ege Akyoldaş](https://github.com/EgeAkyoldas)**

*Docilog — Where AI meets editorial excellence.*

</div>

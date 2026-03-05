# 🧠 Boterma Social Media Planner — Docilog Integration Plan

> **Paradigm Shift**: This is NOT a blog project. Boterma is a **home interior decor / electrical lamp company** using Docilog as a **social media planner & content creator** — a fundamentally different usage pattern from the existing finance and music blog domains.

---

## 📋 Context & Background

### What is Boterma?
- **Industry**: Home interior decor, electrical lamps & lighting
- **Use Case**: Social media content planning & creation (NOT traditional blogging)
- **Platform Fit**: Uses Docilog's AI engine to generate social media posts, captions, campaign ideas, and visual content instead of long-form blog articles

### How Does This Differ from Existing Domains?

| Aspect | Finance Blog | Music Blog | **Boterma (NEW)** |
|--------|-------------|------------|-------------------|
| **Output Type** | Long-form articles (800-1200 words) | Long-form articles (800-1200 words) | **Short-form social posts, captions, stories, carousels** |
| **Content Goal** | SEO-driven blog traffic | SEO-driven blog traffic | **Engagement, brand awareness, sales conversion** |
| **Personas** | Market strategists, analysts | Music educators, pedagogues | **Social media strategist, content creator, campaign planner** |
| **Categories** | Technical analysis, macro economics | Music theory, instruments | **Instagram posts, stories, campaign ideas, product showcases** |
| **Image Style** | Bloomberg terminal, financial charts | Instruments, warm studio | **Interior design photography, lamp product shots, lifestyle** |
| **Tone** | Analytical, institutional | Educational, warm | **Trendy, visual-first, lifestyle-aspirational** |

---

## 🧠 Brainstorm: 3 Approaches

### Option A: Pure Social Media Content Engine
Fully transform the Docilog pipeline for social media. All actions (`generate`, `auto_blog`, `blog_ready`) produce social-media-native content: Instagram captions, story scripts, carousel slides, Twitter/X threads, and Pinterest descriptions.

✅ **Pros:**
- Maximum alignment with Boterma's actual needs
- Social-native output (hashtags, CTAs, emoji-integrated)
- New action pipelines like `caption`, `story_script`, `carousel` alongside existing ones

❌ **Cons:**
- Requires the most customization of YAML action templates
- Existing `auto_blog` pipeline expectations (800-1200 words, article structure) need significant adaptation

📊 **Effort:** Medium-High

---

### Option B: Hybrid Content Hub (Blog + Social)
Keep the existing blog-length article generation but add social-media-specific personas and categories. The editor still produces long-form content, but personas guide it toward "social-media-ready" formats (shorter paragraphs, visual-heavy, CTA-focused).

✅ **Pros:**
- Minimal pipeline changes — reuses existing article structure
- Boterma can still produce occasional long-form content (lookbooks, brand stories)
- Simplest path forward

❌ **Cons:**
- May feel awkward producing 800-word "articles" when you need a 150-char Instagram caption
- Doesn't fully leverage the social media use case

📊 **Effort:** Low-Medium

---

### Option C: Social-First with Extended Actions (RECOMMENDED)
Keep the existing pipeline infrastructure but **redefine the action templates** specifically for social media content types. Add new content categories (Instagram, Stories, Campaigns, etc.) and create personas tailored to interior design social media. The `generate` and `auto_blog` actions produce social-media-optimized content, while `custom` allows freeform requests.

✅ **Pros:**
- Best balance of platform compatibility and social-media-native output
- Categories reflect actual social media content types
- Personas are social-media-savvy interior design experts
- Reuses existing infrastructure (editor, storage, AI pipelines)
- Image generation perfectly suited for product photography

❌ **Cons:**
- Article length assumptions may need a note in the config (300-500 words for social, vs 800-1200 for blogs)
- Editor still shows "article" metaphors in the UI (but content is social-ready)

📊 **Effort:** Medium

---

## 💡 Recommendation

**Option C — Social-First with Extended Actions**

This approach keeps the Docilog architecture intact while creating a tailored experience for Boterma. The YAML config will:
1. Redefine action templates to produce social-media-ready content
2. Create 4 domain-specific personas for interior design social media
3. Set categories that match social media content types
4. Customize image generation for interior/lamp product photography

---

## 🛠️ Proposed Changes

### Component 1: YAML Configuration

#### [NEW] [ai-prompts-boterma-social.yaml](file:///c:/Users/Ege/Documents/him-test/him-blog/him-blog-app/src/config/ai-prompts-boterma-social.yaml)

Create a new YAML config following the V3.4 engine pattern. Key customizations:

**Default Persona:**
- Name: "Boterma Creative"
- Role: "Sosyal Medya İçerik Stratejisti & Interior Design Küratörü"
- Expertise: Instagram, lighting trends, interior styling, brand storytelling, product photography

**4 Personas:**

| Persona ID | Name | Role | Tone |
|------------|------|------|------|
| `social_strategist` | Sosyal Medya Stratejisti | Campaign planning, content calendar, engagement tactics | Profesyonel, trend-bilinçli, data-driven |
| `content_creator` | İçerik Yaratıcısı | Captions, stories, reels scripts, carousel copy | Yaratıcı, samimi, lifestyle-odaklı |
| `brand_storyteller` | Marka Hikayecisi | Brand narrative, lookbooks, collection stories | Hikayeci, ilham verici, premium hissiyat |
| `campaign_planner` | Kampanya Planlayıcısı | Seasonal campaigns, launch strategies, promotion plans | Stratejik, aksiyon-odaklı, sonuç-odaklı |

**Categories (Social Media Content Types):**

| Slug | Label | Description |
|------|-------|-------------|
| `instagram_post` | Instagram Post | Feed post captions & descriptions |
| `stories` | Story İçerikleri | Instagram/Facebook story scripts |
| `campaign` | Kampanya | Seasonal/product launch campaigns |
| `product_showcase` | Ürün Tanıtımı | Individual product feature content |
| `collection_lookbook` | Koleksiyon & Lookbook | Collection stories, mood boards |
| `trend_inspiration` | Trend & İlham | Interior design trends, tips |
| `behind_the_scenes` | Sahne Arkası | Brand personality, manufacturing process |
| `other` | Genel | Miscellaneous content |

**Action Pipelines (Social-Media-Adapted):**
- `generate` → Produces social media post (300-500 words) with hashtag suggestions
- `auto_blog` → Generates complete social content package (post + caption + hashtags + CTA)
- `improve` → Enhances engagement potential of existing social content
- `expand` → Creates variations (Instagram + Stories + Twitter from one concept)
- `summarize` → Converts long content to social-media-ready snippets
- `blog_ready` → Formats draft into social-ready content with product placements

**Image Prompt Style:**
- Interior design editorial photography
- Warm amber/cream lighting, lifestyle aesthetic
- Product-focused with styled environments (living rooms, bedrooms, dining spaces)
- Camera: Sony A7R V, 35mm wide + 85mm portrait
- Mood: Aspirational, warm, inviting, premium

---

### Component 2: Database Migration

#### [NEW] [007_boterma_seed.sql](file:///c:/Users/Ege/Documents/him-test/him-blog/him-blog-app/supabase-migrations/007_boterma_seed.sql)

Following the exact pattern from `004_seed_data.sql`:

1. **Project record**: `slug: 'boterma-social'`, `name: 'Boterma Social Media'`, `icon: '💡'`
2. **Project user**: `username: 'boterma'`, `role: 'project_user'`
3. **Project membership**: Link boterma user → project as `admin`
4. **Categories**: 8 social-media-specific categories
5. **AI Config**: Full system instruction, global rules, action pipelines, image prompt
6. **Personas**: 4 social media personas with instructions, style rules, and constraints

---

## ⚠️ User Review Required

> [!IMPORTANT]
> **New Content Paradigm**: This is the first time Docilog is used for social media content instead of blog articles. The action pipelines will produce different output lengths and formats. The existing TipTap editor will still be the creation tool, but the content will be social-media-oriented.

> [!IMPORTANT]
> **Persona Names & Tone**: Should the personas use Turkish names/identities (like "Cenk Akyoldaş" in Finance)? Or generic role titles? I've defaulted to role titles since Boterma is a company brand, not a personal brand.

> [!IMPORTANT]
> **Content Language**: I've kept the same bilingual TR/EN approach. Should Boterma content be Turkish-first, English-first, or based on user selection?

---

## ✅ Verification Plan

### Automated Verification
Since there are no existing unit tests in this project for YAML loading or migration files, verification will be manual/browser-based.

### Manual Verification Steps

1. **Migration Execution**: Run `007_boterma_seed.sql` in Supabase SQL Editor and verify no errors
2. **Dev Server Test**: Run `npm run dev` and navigate to `http://localhost:3000/boterma-social/admin`
   - Verify the admin panel renders without errors
   - Verify AI config loads (either from DB or YAML fallback)
3. **Persona Loading**: Go to `http://localhost:3000/boterma-social/admin/ai-config`
   - Verify all 4 personas are visible
   - Verify each persona's name, tone, and instruction are populated
4. **Category Display**: Create a new article at `http://localhost:3000/boterma-social/admin/articles/new`
   - Verify the category dropdown shows the 8 social media categories
5. **AI Generation Test**: Use the AI panel to generate a test post
   - Verify the content is social-media-formatted (shorter, hashtags, CTAs)
   - Verify image descriptions reference interior design/lamp photography

---

## 📁 Files to Create

| # | File | Type | Description |
|---|------|------|-------------|
| 1 | `src/config/ai-prompts-boterma-social.yaml` | YAML | AI engine configuration with social media personas & actions |
| 2 | `supabase-migrations/007_boterma_seed.sql` | SQL | Database seed: project, user, categories, AI config, personas |

**Total files**: 2 new files, 0 modified files.

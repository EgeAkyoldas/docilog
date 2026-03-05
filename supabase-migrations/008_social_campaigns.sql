-- Social Media Campaign Manager
-- Migration: 008_social_campaigns.sql

-- ═══════════════════════════════════════════════════════
-- 1. SOCIAL CAMPAIGNS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS social_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  aim text NOT NULL DEFAULT '',
  persona_name text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT 'instagram',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER social_campaigns_updated_at
  BEFORE UPDATE ON social_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_social_campaigns_project ON social_campaigns(project_id);

-- ═══════════════════════════════════════════════════════
-- 2. SOCIAL POSTS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES social_campaigns(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Visual
  image_url text,
  aspect_ratio text NOT NULL DEFAULT '1:1' CHECK (aspect_ratio IN ('1:1','3:4','9:16','16:9')),
  visual_prompt text NOT NULL DEFAULT '',

  -- Content
  caption text NOT NULL DEFAULT '',
  caption_en text NOT NULL DEFAULT '',
  hashtags text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',           -- @mention tags
  location text,
  alt_text text NOT NULL DEFAULT '',

  -- Engagement metadata
  cta text,                                     -- call to action
  post_type text NOT NULL DEFAULT 'feed' CHECK (post_type IN ('feed', 'reel', 'story', 'carousel')),
  scheduled_at timestamptz,

  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'published')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_social_posts_campaign ON social_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_project ON social_posts(project_id);

-- ═══════════════════════════════════════════════════════
-- 3. RLS POLICIES
-- ═══════════════════════════════════════════════════════
ALTER TABLE social_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON social_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON social_posts FOR ALL USING (true) WITH CHECK (true);

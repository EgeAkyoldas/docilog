-- Docilog SaaS Core Tables
-- Migration: 003_docilog_core.sql
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════
-- 1. USERS (Preset credentials, no Supabase Auth)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'project_user' CHECK (role IN ('master_admin', 'project_user')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════
-- 2. PROJECTS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '📝',
  theme_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════
-- 3. PROJECT MEMBERS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- ═══════════════════════════════════════════════════════
-- 4. PROJECT CATEGORIES (dynamic per project)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS project_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slug text NOT NULL,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(project_id, slug)
);

-- ═══════════════════════════════════════════════════════
-- 5. PROJECT AI CONFIG (per project)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS project_ai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  system_instruction text NOT NULL DEFAULT '',
  global_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_prompt text NOT NULL DEFAULT '',
  persona_defaults jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER project_ai_config_updated_at
  BEFORE UPDATE ON project_ai_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════
-- 6. PROJECT PERSONAS (per project)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS project_personas (
  id text NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  tone text NOT NULL DEFAULT '',
  instruction text NOT NULL DEFAULT '',
  writing_style_rules text DEFAULT '',
  negative_constraints text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, project_id)
);

CREATE TRIGGER project_personas_updated_at
  BEFORE UPDATE ON project_personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════
-- 7. ADD project_id TO ARTICLES
-- ═══════════════════════════════════════════════════════
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════
-- 8. SESSIONS (simple token-based)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- RLS POLICIES (service role bypass for all)
-- ═══════════════════════════════════════════════════════
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON project_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON project_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON project_ai_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON project_personas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON sessions FOR ALL USING (true) WITH CHECK (true);

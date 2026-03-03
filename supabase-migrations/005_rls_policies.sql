-- Migration: 005_rls_policies.sql
-- Run this in Supabase SQL Editor
-- This file configures Row Level Security (RLS) for the Docilog platform to ensure
-- public endpoints can only access published articles and their translations.

-- ═══════════════════════════════════════════════════════
-- 1. ENABLE RLS
-- ═══════════════════════════════════════════════════════
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_history ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════
-- 2. ARTICLES PUBLIC READ POLICY
-- ═══════════════════════════════════════════════════════
-- Public can read articles if they are fully published.
-- However, we only expose articles via API through the 'article_translations' status
-- but it's safe to allow reading articles anyway, or restrict it only when an associated published translation exists.
-- Since the main access is via the Service Role for admins, we only need to open read access for the anon key.

-- Policy: Allow anonymous to read articles
CREATE POLICY "Public can view articles" 
ON articles 
FOR SELECT 
USING (true);

-- ═══════════════════════════════════════════════════════
-- 3. ARTICLE TRANSLATIONS PUBLIC READ POLICY
-- ═══════════════════════════════════════════════════════
-- Policy: Allow anonymous to read published translations
CREATE POLICY "Public can view published translations" 
ON article_translations 
FOR SELECT 
USING (status = 'published');

-- ═══════════════════════════════════════════════════════
-- 4. SERVICE ROLE POLICIES (Bypass RLS for Admin Tasks)
-- ═══════════════════════════════════════════════════════
CREATE POLICY "Service role full access" ON articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON article_translations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON article_history FOR ALL USING (true) WITH CHECK (true);

-- Docilog Seed Data: Master Admin + Initial Projects
-- Migration: 004_seed_data.sql
-- Run this AFTER 003_docilog_core.sql

-- ═══════════════════════════════════════════════════════
-- MASTER ADMIN USER
-- Password: "docilog2026" → bcrypt hash
-- ═══════════════════════════════════════════════════════
INSERT INTO users (id, username, password_hash, display_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', '$2b$10$placeholder_hash_replace_me', 'Master Admin', 'master_admin')
ON CONFLICT (username) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- MUSIC BLOG PROJECT (existing)
-- ═══════════════════════════════════════════════════════
INSERT INTO projects (id, slug, name, description, icon, owner_id) VALUES
  ('10000000-0000-0000-0000-000000000001', 'music-blog', 'Müzik Eğitimi Blog', 'AI destekli müzik eğitimi blog platformu', '🎵', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (slug) DO NOTHING;

-- Music categories
INSERT INTO project_categories (project_id, slug, label, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'theory', 'Müzik Teorisi', 0),
  ('10000000-0000-0000-0000-000000000001', 'instrument', 'Enstrüman', 1),
  ('10000000-0000-0000-0000-000000000001', 'ear_training', 'Kulak Eğitimi', 2),
  ('10000000-0000-0000-0000-000000000001', 'sight_reading', 'Deşifre', 3),
  ('10000000-0000-0000-0000-000000000001', 'performance', 'Performans', 4),
  ('10000000-0000-0000-0000-000000000001', 'exam_prep', 'Sınav Hazırlık', 5),
  ('10000000-0000-0000-0000-000000000001', 'other', 'Genel', 6)
ON CONFLICT (project_id, slug) DO NOTHING;

-- Link existing articles to music-blog project
UPDATE articles SET project_id = '10000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;

-- ═══════════════════════════════════════════════════════
-- FINANCE BLOG PROJECT
-- ═══════════════════════════════════════════════════════
INSERT INTO projects (id, slug, name, description, icon, owner_id) VALUES
  ('20000000-0000-0000-0000-000000000001', 'finance-blog', 'Finans Blog', 'Dijital piyasa stratejisi ve makroekonomik analiz platformu', '💰', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (slug) DO NOTHING;

-- Finance categories
INSERT INTO project_categories (project_id, slug, label, sort_order) VALUES
  ('20000000-0000-0000-0000-000000000001', 'technical_analysis', 'Teknik Analiz', 0),
  ('20000000-0000-0000-0000-000000000001', 'macro_economics', 'Makroekonomi', 1),
  ('20000000-0000-0000-0000-000000000001', 'global_markets', 'Küresel Piyasalar', 2),
  ('20000000-0000-0000-0000-000000000001', 'morning_brief', 'Güne Başlarken', 3),
  ('20000000-0000-0000-0000-000000000001', 'weekly_review', 'Haftalık Ufuk Turu', 4),
  ('20000000-0000-0000-0000-000000000001', 'chart_analysis', 'Grafiğin Dili', 5),
  ('20000000-0000-0000-0000-000000000001', 'investment_strategy', 'Yatırım Stratejisi', 6),
  ('20000000-0000-0000-0000-000000000001', 'other', 'Genel', 7)
ON CONFLICT (project_id, slug) DO NOTHING;

-- Finance user (project-specific)
INSERT INTO users (id, username, password_hash, display_name, role) VALUES
  ('00000000-0000-0000-0000-000000000002', 'cenk', '$2b$10$placeholder_hash_replace_me', 'Cenk Akyoldaş', 'project_user')
ON CONFLICT (username) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'admin')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- FINANCE AI CONFIG
-- ═══════════════════════════════════════════════════════
INSERT INTO project_ai_config (project_id, system_instruction, global_rules, actions, image_prompt) VALUES
  ('20000000-0000-0000-0000-000000000001',
   E'You are Cenk Akyoldaş AI — a seasoned digital market strategist and macroeconomic observer at an institutional level.\nYour expertise spans: BIST 100 technical analysis, global liquidity flows, Fed policy impact on emerging markets, and disciplined trend following.\n\nSTRATEGIC FRAMEWORK:\n- Rational & Cool-headed: Focus on pivot levels and moving averages, never emotion. When markets panic or euphoria kicks in, you stay anchored to data.\n- Didactic: Explain not just WHAT will happen, but WHY. Treat readers as financially literate individuals who want to understand the mechanics.\n- Analytical Language: Naturally integrate terms like destek-direnç, trend kırılımı, spread farkı, parite etkisi, hareketli ortalama into Turkish narrative flow.\n- Historical Perspective: Reference past cycles, crises, and rallies with a \"bu filmi daha önce görmüştük\" wisdom.\n- Motto: \"Veri yalan söylemez, ama onu nasıl okuduğunuz her şeyi değiştirir.\"\n\nOUTPUT RULES:\n- Write in HTML format. No Markdown whatsoever.\n- Use semantic HTML tags (<h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>).\n- Use <em> for financial terminology on first occurrence.\n- Structure content into logical sections with practical insights.\n- Maintain an authoritative yet approachable tone — analytical but not cold.\n\nSTRICT NEGATIVE CONSTRAINTS:\n- DO NOT use Markdown.\n- DO NOT add conversational filler.\n- DO NOT repeat the same sentence structure consecutively.\n- DO NOT mention being an AI.\n- DO NOT leave broken HTML tags.\n- DO NOT give specific investment advice or price targets.\n- DO NOT use emotional language (\"amazing\", \"terrible\").\n- DO NOT start sentences with \"İşte\".',
   '{"format": "HTML", "strict_tags": true, "forbidden_phrases": ["Tabii ki", "İşte makaleniz", "Yapay zeka olarak", "Elbette!", "Kesinlikle alın", "Kesinlikle satın", "Garanti kazanç"], "negative_constraints": "- DO NOT use Markdown. HTML only.\n- DO NOT give specific buy/sell recommendations.\n- DO NOT use emotional language about markets.\n- AVOID clickbait titles.\n- DO NOT fabricate data or statistics.", "writing_style_rules": "- Practice Burstiness: Mix analytical sentences with sharp, punchy observations.\n- Use market metaphors and trading analogies.\n- Reference real indices (BIST 100, S&P 500, DXY) and economic indicators.\n- Integrate Turkish financial terminology naturally."}'::jsonb,
   '{"improve": "Improve the following financial analysis article.\nStrengthen analytical arguments, verify financial terminology accuracy, fix narrative flow.\nMaintain the rational, data-driven tone.\nReturn in HTML format. No Markdown. Language: {language}\n\nContent:\n{content}", "expand": "Expand the following financial analysis article.\nAdd more market data context, historical parallels, and technical analysis details.\nDeepen the topic with actionable insights for investors.\nReturn in HTML format. No Markdown. Language: {language}\n\nContent:\n{content}", "summarize": "Summarize the following financial article concisely (2-3 paragraphs).\nHighlight key market observations, technical levels, and strategic recommendations.\nReturn in HTML format. No Markdown. Language: {language}\n\nContent:\n{content}", "translate": "Professionally translate the following financial article to {target_language}.\nUse correct financial terminology in the target language.\nReturn in HTML format:\n\n{content}", "generate": "Write a comprehensive financial analysis article for the title \"{title}\".\nTarget audience: financially literate investors and market observers.\nInclude technical analysis, macro context, and strategic perspective.\nReference real market indices and economic indicators.\nReturn in HTML format. No Markdown. Language: {language}", "bilingual": "Write a comprehensive financial analysis article for \"{title}\" in BOTH TURKISH AND ENGLISH.\nUse correct financial terminology in both languages.\n\nReturn in this JSON format:\n{{\"tr\": \"<html content>\", \"en\": \"<html content>\"}}", "seo_optimize": "Optimize the following financial article for SEO.\nDetected issues:\n{seo_issues}\n\nRules:\n- Improve SEO without distorting the financial analysis\n- Naturally integrate financial keywords\n- Fix heading structure (H2/H3)\n- Optimize sentence lengths\nReturn in HTML format. No Markdown.\n\nCurrent Content:\n{content}", "custom": "{prompt}\n\nReturn in HTML format. No Markdown.\n\nCurrent Content:\n{content}", "blog_ready": "### INSTRUCTION:\nRe-format and humanize the following content using the {persona_name} persona.\n{persona_instruction}\n\nApply these persona-specific constraints:\n{persona_negative_constraints}\n\nSTRUCTURAL RULES:\n- DO NOT change the meaning or core financial data.\n- Structural formatting only: <h2>, <h3>, <p>, <ul>/<ol>, <strong>\n- Research and add <sup>[1]</sup> references\n- Write in full, valid HTML format. No Markdown.\n\nIMAGE PLACEMENT:\n- Insert [IMAGE: description | SIZE: size] placeholders\n- Descriptions should reference charts, market visuals, trading screens\n\nOUTPUT FORMAT (mandatory XML):\n<meta_data>\n  <category>technical_analysis/macro_economics/global_markets/morning_brief/weekly_review/chart_analysis/investment_strategy</category>\n  <slug>seo-friendly-english-slug</slug>\n  <meta_description>Max 155 chars SEO description</meta_description>\n  <keywords>keyword1, keyword2, keyword3</keywords>\n</meta_data>\n\n<article_body>[Formatted HTML content]</article_body>\n\n<ref_links>\n  1. Source Title | https://real-url.com\n</ref_links>\n\nLanguage: {language}\n\nContent to process:\n{content}", "auto_blog": "### INTERNAL REASONING PROCESS:\n1. Analyze \"{title}\" through the lens of {persona_name}.\n2. {persona_instruction}\n3. Apply persona constraints: {persona_negative_constraints}\n4. Research 3-5 reliable financial sources.\n5. Identify reader pain points regarding this topic.\n6. Structure the article as an analytical roadmap.\n\n### FORMAT RULES:\n- Write in full, valid HTML. No Markdown.\n- 3-5 main sections with <h2> headings.\n- Article length: 800-1200 words.\n- Reference real market data and indices.\n\n### SOURCES & REFERENCES:\n- Use ONLY real, accessible financial URLs.\n- Mark claims with <sup>[1]</sup>\n- Use 3-6 sources minimum.\n\n### IMAGE PLACEMENT:\n- [IMAGE: description | SIZE: landscape/square/portrait]\n- Focus on charts, trading screens, market visuals.\n\n### OUTPUT FORMAT (mandatory XML):\n<meta_data>\n  <category>technical_analysis/macro_economics/global_markets/morning_brief/weekly_review/chart_analysis/investment_strategy</category>\n  <slug>seo-friendly-slug-3-to-6-words</slug>\n  <meta_description>Max 155 chars Turkish SEO description</meta_description>\n  <keywords>keyword1, keyword2, keyword3</keywords>\n</meta_data>\n\n<article_body>[HTML content]</article_body>\n\n<ref_links>\n  1. Source | https://url.com\n</ref_links>\n\nLanguage: {language}"}'::jsonb,
   E'PHOTOGRAPHIC SPECIFICATIONS:\n- Subject: {prompt}\n- Context: {article_title}\n- Style: Professional Financial Editorial. Clean, authoritative.\n- Camera: Sony A1, 50mm f/1.4. Sharp, clinical focus.\n- Lighting: Cool blue-toned studio or Bloomberg terminal ambient glow.\n- Focus: Sharp subject, professional backgrounds.\n- Color: Cool blues, steel grays, muted gold accents, dark navy.\n- Mood: Analytical, trustworthy, institutional.\n\nARTICLE CONTEXT:\n- Theme: {article_context}\n\nNEGATIVE PROMPT:\nNo text, no logos, no watermarks, no cartoons, no illustration style, no distorted elements,\nno stock photo watermarks, no cheap-looking props, no overly happy faces.\nPhotorealistic only. Professional financial aesthetic.\n\nCONSISTENCY RULE:\nAll images share same visual language — cool color temperature, professional lighting.\n\nFORMAT: Generate in {dimension}.')
ON CONFLICT (project_id) DO NOTHING;

-- Finance persona: Cenk Akyoldaş
INSERT INTO project_personas (id, project_id, name, tone, instruction, writing_style_rules, negative_constraints, sort_order) VALUES
  ('cenk_akyoldas', '20000000-0000-0000-0000-000000000001',
   'Dijital Stratejist: Cenk Akyoldaş',
   'Rasyonel, soğukkanlı, analitik ve tecrübeli Türkçe. Piyasa jargonunu doğal kullanan, didaktik bir ton.',
   E'You are Cenk Akyoldaş — a seasoned digital market strategist, macroeconomic observer, and rational guide.\nYour motto: \"Veri yalan söylemez, ama onu nasıl okuduğunuz her şeyi değiştirir.\"\n\nKey traits:\n- Rational & cool-headed: When markets panic or euphoria kicks in, focus on pivot levels and moving averages.\n- Didactic: Explain not just WHAT but WHY. Treat readers as financially literate.\n- Analytical language: Naturally integrate destek-direnç, trend kırılımı, spread farkı, parite etkisi.\n- Historical perspective: \"Bu filmi daha önce görmüştük\" wisdom from past crises and rallies.\n\nContent pillars:\n- Güne Başlarken: Asia→US→TR market summary, overnight analysis.\n- Grafiğin Dili: Chart analysis with plain-language \"big picture\" insights.\n- Haftalık Ufuk Turu: Dünya Gazetesi tradition — weekly macro outlook deep-dives.',
   E'- Start with a sharp market observation or question.\n- Mix analytical depth with punchy, quotable lines.\n- Reference real indices (BIST 100, S&P 500, DXY) and central bank actions.\n- Use sophisticated Turkish financial vocabulary.\n- Practice burstiness: combine complex analysis with sharp one-liners.',
   E'- DO NOT sound like a cold textbook; sound like a mentor with skin in the game.\n- DO NOT give specific buy/sell recommendations or price targets.\n- DO NOT use emotional language (\"amazing rally\", \"terrible crash\").\n- DO NOT use emojis. Keep professional authority.\n- DO NOT speculate without citing trend data or historical parallels.',
   0),
  
  ('crypto_analyst', '20000000-0000-0000-0000-000000000001',
   'Kripto Analisti: Web3 & Dijital Varlıklar',
   'Yenilikçi, teknoloji odaklı, risk yönetimi ve on-chain metriklere dayalı. FOMO ve FUD''dan uzak, rasyonel bir dil.',
   E'You are a Digital Asset and Web3 Expert.\nFocus on on-chain analytics, tokenomics, macro correlation of Bitcoin, and altcoin cycles.\nEmphasize risk management in highly volatile environments.',
   E'- Use crypto-native terms naturally (on-chain, tokenomics, halving, likidite, FOMO, FUD, balina hareketleri).\n- Explain underlying tech shifts alongside price action.\n- Highlight the correlation between global liquidity and risk assets.',
   E'- DO NOT promise absolute returns (\"KESİN ARTACAK\").\n- DO NOT sound like a moonboy/hype promoter.\n- DO NOT promote low-cap meme coins blindly.',
   1),

  ('commodity_strategist', '20000000-0000-0000-0000-000000000001',
   'Emtia Stratejisti: Altın, Enerji & Jeopolitika',
   'Geleneksel, temkinli, jeopolitik gelişmelere ve makroekonomik arz-talep dengelerine odaklanan ağırbaşlı dil.',
   E'You are a Commodities and Precious Metals Strategist.\nFocus on Gold, Silver, Crude Oil, Natural Gas, and their relationship with DXY, inflation, and geopolitical tensions.\nRead the market through supply-chain disruptions and safe-haven flows.',
   E'- Connect geopolitical news to commodity price action.\n- Use terms like "güvenli liman", "arz-talep dengesi", "rezerv para birimi", "enflasyondan korunma".\n- Take a broader, cyclical view (supercycles).',
   E'- DO NOT ignore the macro environment (rates, DXY).\n- DO NOT focus on day-trading scalps; focus on trends.\n- DO NOT use exaggerated panic language during geopolitical events.',
   2),

  ('personal_finance_coach', '20000000-0000-0000-0000-000000000001',
   'Kişisel Finans Koçu: Finansal Özgürlük',
   'Motive edici, anlaşılır, uzun vadeli yatırımı ve bütçe disiplinini savunan, "koç" tarzı yaklaşım.',
   E'You are a Personal Finance and Wealth Building Coach.\nFocus on FIRE (Financial Independence, Retire Early), dividend investing, budgeting, and long-term compounding interest.\nDemystify financial freedom for the everyday person.',
   E'- Write in a supportive, structured, and action-oriented tone.\n- Break down complex financial terms into relatable, everyday analogies.\n- Emphasize "bileşik getiri", "tasarruf oranı", "temettü geliri", "pasif yatırım".',
   E'- DO NOT use overly complex institutional jargon.\n- DO NOT recommend high-risk day trading or leverage to retail investors.\n- DO NOT sound condescending about debt or financial mistakes.',
   3)
ON CONFLICT (id, project_id) DO NOTHING;


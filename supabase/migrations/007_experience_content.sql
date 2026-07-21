-- 007 — Rich experience content for premium detail pages
ALTER TABLE tours
  ADD COLUMN IF NOT EXISTS experience_content JSONB,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS hero_tagline TEXT,
  ADD COLUMN IF NOT EXISTS detailed_description TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
  ADD COLUMN IF NOT EXISTS map_embed_url TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_image TEXT,
  ADD COLUMN IF NOT EXISTS pricing_notes TEXT,
  ADD COLUMN IF NOT EXISTS perfect_for TEXT[],
  ADD COLUMN IF NOT EXISTS good_to_know TEXT[],
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

COMMENT ON COLUMN tours.experience_content IS
  'JSONB: timeline[], faqs[], and optional overrides for experience detail pages';

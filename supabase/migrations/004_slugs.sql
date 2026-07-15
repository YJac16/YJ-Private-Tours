-- =============================================================================
-- 003 addendum — tour/vehicle slugs for booking UI deep-links
-- (run after 003_time_slots_and_driver_schedule.sql)
-- =============================================================================

ALTER TABLE tours ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

UPDATE tours SET slug = 'city' WHERE name = 'City Tour';
UPDATE tours SET slug = 'peninsula' WHERE name = 'Cape Point';
UPDATE tours SET slug = 'winelands' WHERE name = 'Winelands Tour';

INSERT INTO tours (id, name, description, slug) VALUES
  ('22222222-2222-2222-2222-222222222204', 'Ocean Sunset', 'Atlantic seaboard sunset experience', 'sunset')
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug;

UPDATE vehicles SET slug = 'suzuki' WHERE name = 'Suzuki XL6';
UPDATE vehicles SET slug = 'mercedes' WHERE name LIKE 'Mercedes%';
UPDATE vehicles SET slug = 'corolla' WHERE name LIKE 'Toyota%';

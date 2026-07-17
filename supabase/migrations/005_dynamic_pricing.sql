-- =============================================================================
-- 005 — Dynamic pricing (guest count + vehicle surcharge)
-- Prices in ZAR cents. Edit via admin dashboard — no code deploy needed.
-- =============================================================================

ALTER TABLE tours
  ADD COLUMN IF NOT EXISTS base_price_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS additional_guest_price_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_guests INTEGER;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS capacity_min INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS capacity_max INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS vehicle_surcharge_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_luxury BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS guest_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS base_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS additional_guest_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS extra_guests_count INTEGER,
  ADD COLUMN IF NOT EXISTS extra_guests_total_cents INTEGER,
  ADD COLUMN IF NOT EXISTS vehicle_surcharge_cents INTEGER,
  ADD COLUMN IF NOT EXISTS final_price_cents INTEGER;

CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_settings (key, value) VALUES
  ('booking', '{"max_guests_default": 5, "allow_larger_groups": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Tour pricing (base covers 1 guest)
UPDATE tours SET
  base_price_cents = 150000,
  additional_guest_price_cents = 40000,
  max_guests = 5
WHERE slug = 'city';

UPDATE tours SET
  base_price_cents = 590000,
  additional_guest_price_cents = 90000,
  max_guests = 5
WHERE slug = 'peninsula';

UPDATE tours SET
  base_price_cents = 180000,
  additional_guest_price_cents = 50000,
  max_guests = 5
WHERE slug = 'sunset';

UPDATE tours SET
  base_price_cents = 400000,
  additional_guest_price_cents = 80000,
  max_guests = 5
WHERE slug = 'winelands';

-- Vehicle capacity & surcharges
UPDATE vehicles SET
  capacity_min = 1,
  capacity_max = 3,
  vehicle_surcharge_cents = 0,
  is_luxury = false
WHERE slug = 'corolla';

UPDATE vehicles SET
  capacity_min = 4,
  capacity_max = 5,
  vehicle_surcharge_cents = 70000,
  is_luxury = false
WHERE slug = 'suzuki';

UPDATE vehicles SET
  capacity_min = 1,
  capacity_max = 3,
  vehicle_surcharge_cents = 120000,
  is_luxury = true
WHERE slug = 'mercedes';

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read app_settings"
ON app_settings FOR SELECT
USING (true);

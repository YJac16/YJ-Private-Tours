-- =============================================================================
-- YJ Private Tours — ONE-SHOT LIVE SETUP
-- Run this once in Supabase → SQL Editor → New query → Run
-- Project: pmurlvtlgfneswhmyzvh
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS drivers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tours (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  slug        TEXT UNIQUE,
  base_price_cents INTEGER NOT NULL DEFAULT 0,
  additional_guest_price_cents INTEGER NOT NULL DEFAULT 0,
  max_guests INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  slug        TEXT UNIQUE,
  capacity_min INTEGER NOT NULL DEFAULT 1,
  capacity_max INTEGER NOT NULL DEFAULT 3,
  vehicle_surcharge_cents INTEGER NOT NULL DEFAULT 0,
  is_luxury BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blocked_dates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL UNIQUE,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON blocked_dates (blocked_date);

CREATE TABLE IF NOT EXISTS bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id     UUID NOT NULL REFERENCES drivers (id) ON DELETE RESTRICT,
  tour_id       UUID NOT NULL REFERENCES tours (id) ON DELETE RESTRICT,
  vehicle_id    UUID NOT NULL REFERENCES vehicles (id) ON DELETE RESTRICT,
  booking_date  DATE NOT NULL,
  start_time    TIME NOT NULL DEFAULT '08:00',
  status        booking_status NOT NULL DEFAULT 'pending',
  client_name   TEXT NOT NULL,
  client_email  TEXT NOT NULL,
  client_phone  TEXT,
  notes         TEXT,
  guest_count INTEGER NOT NULL DEFAULT 1,
  base_price_cents INTEGER,
  additional_guest_price_cents INTEGER,
  extra_guests_count INTEGER,
  extra_guests_total_cents INTEGER,
  vehicle_surcharge_cents INTEGER,
  final_price_cents INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_date ON bookings (driver_id, booking_date);

DROP INDEX IF EXISTS idx_one_paid_booking_per_day;
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_paid_booking_per_driver_slot
  ON bookings (driver_id, booking_date, start_time)
  WHERE status = 'paid';

CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID NOT NULL REFERENCES bookings (id) ON DELETE RESTRICT,
  status        payment_status NOT NULL DEFAULT 'pending',
  amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),
  currency      TEXT NOT NULL DEFAULT 'ZAR',
  external_id   TEXT,
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_external ON payments (external_id)
  WHERE external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS time_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time  TIME NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS driver_unavailable (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id          UUID NOT NULL REFERENCES drivers (id) ON DELETE CASCADE,
  unavailable_date   DATE NOT NULL,
  start_time         TIME,
  reason             TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (driver_id, unavailable_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_driver_unavailable_date
  ON driver_unavailable (driver_id, unavailable_date);

CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_settings (key, value) VALUES
  ('booking', '{"max_guests_default": 5, "allow_larger_groups": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION validate_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_date < (CURRENT_DATE + INTERVAL '2 days') THEN
    RAISE EXCEPTION 'Bookings must be made at least 2 days in advance.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM blocked_dates
    WHERE blocked_date = NEW.booking_date
  ) THEN
    RAISE EXCEPTION 'This date is blocked and cannot be booked.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM driver_unavailable
    WHERE driver_id = NEW.driver_id
      AND unavailable_date = NEW.booking_date
      AND (start_time IS NULL OR start_time = NEW.start_time)
  ) THEN
    RAISE EXCEPTION 'This driver is unavailable for the selected slot.';
  END IF;

  IF NEW.status = 'paid' AND EXISTS (
    SELECT 1 FROM bookings
    WHERE driver_id = NEW.driver_id
      AND booking_date = NEW.booking_date
      AND start_time = NEW.start_time
      AND status = 'paid'
      AND id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'This time slot is already booked.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_booking_trigger ON bookings;
CREATE TRIGGER validate_booking_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking();

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_unavailable ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read tours" ON tours;
CREATE POLICY "Public read tours" ON tours FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read vehicles" ON vehicles;
CREATE POLICY "Public read vehicles" ON vehicles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read drivers" ON drivers;
CREATE POLICY "Public read drivers" ON drivers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read bookings" ON bookings;
CREATE POLICY "Public read bookings" ON bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read blocked_dates" ON blocked_dates;
CREATE POLICY "Public read blocked_dates" ON blocked_dates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read time_slots" ON time_slots;
CREATE POLICY "Public read time_slots" ON time_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read driver_unavailable" ON driver_unavailable;
CREATE POLICY "Public read driver_unavailable" ON driver_unavailable FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read app_settings" ON app_settings;
CREATE POLICY "Public read app_settings" ON app_settings FOR SELECT USING (true);

INSERT INTO drivers (id, name, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Yaseen', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tours (id, name, description, slug, base_price_cents, additional_guest_price_cents, max_guests) VALUES
  ('22222222-2222-2222-2222-222222222201', 'City Tour', 'Cape Town city and surrounds', 'city', 150000, 40000, 5),
  ('22222222-2222-2222-2222-222222222202', 'Cape Point', 'Cape Peninsula and Cape Point', 'peninsula', 590000, 90000, 5),
  ('22222222-2222-2222-2222-222222222203', 'Winelands Tour', 'Stellenbosch / Franschhoek winelands', 'winelands', 400000, 80000, 5),
  ('22222222-2222-2222-2222-222222222204', 'Ocean Sunset', 'Atlantic seaboard sunset experience', 'sunset', 180000, 50000, 5)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  base_price_cents = EXCLUDED.base_price_cents,
  additional_guest_price_cents = EXCLUDED.additional_guest_price_cents,
  max_guests = EXCLUDED.max_guests;

INSERT INTO vehicles (id, name, description, slug, capacity_min, capacity_max, vehicle_surcharge_cents, is_luxury) VALUES
  ('33333333-3333-3333-3333-333333333301', 'Suzuki XL6', 'Spacious comfort for families', 'suzuki', 1, 5, 70000, false),
  ('33333333-3333-3333-3333-333333333302', 'Mercedes Benz GLC 250 Coupe', 'Premium luxury experience', 'mercedes', 1, 3, 120000, true),
  ('33333333-3333-3333-3333-333333333303', 'Toyota Corolla Cross GR Sport', 'Sporty comfort with a personal touch', 'corolla', 1, 3, 0, false)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  capacity_min = EXCLUDED.capacity_min,
  capacity_max = EXCLUDED.capacity_max,
  vehicle_surcharge_cents = EXCLUDED.vehicle_surcharge_cents,
  is_luxury = EXCLUDED.is_luxury;

INSERT INTO time_slots (id, start_time, label, sort_order) VALUES
  ('44444444-4444-4444-4444-444444444401', '08:00', 'Morning — 08:00', 1),
  ('44444444-4444-4444-4444-444444444402', '12:30', 'Afternoon — 12:30', 2),
  ('44444444-4444-4444-4444-444444444403', '16:30', 'Sunset — 16:30', 3)
ON CONFLICT (start_time) DO NOTHING;

-- =============================================================================
-- Appended from 006_premium_checkout.sql (run migrations/006 if DB already exists)
-- =============================================================================

-- =============================================================================
-- 006 — Premium checkout: vehicle+PPP pricing, driver profiles, booking details
-- =============================================================================

-- Tours: duration, inclusions, per-person rate
ALTER TABLE tours
  ADD COLUMN IF NOT EXISTS duration_label TEXT,
  ADD COLUMN IF NOT EXISTS included_items TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS excluded_items TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_per_person_cents INTEGER,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Backfill PPP from previous additional_guest_price if present
UPDATE tours
SET price_per_person_cents = COALESCE(price_per_person_cents, additional_guest_price_cents, 35000)
WHERE price_per_person_cents IS NULL;

ALTER TABLE tours
  ALTER COLUMN price_per_person_cents SET DEFAULT 35000;

UPDATE tours SET price_per_person_cents = 35000 WHERE price_per_person_cents IS NULL;
ALTER TABLE tours ALTER COLUMN price_per_person_cents SET NOT NULL;

-- Vehicles: flat vehicle fee + luggage/features/photo
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS vehicle_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS luggage_capacity INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE vehicles
SET vehicle_price_cents = COALESCE(vehicle_price_cents, vehicle_surcharge_cents, 0)
WHERE vehicle_price_cents IS NULL;

ALTER TABLE vehicles ALTER COLUMN vehicle_price_cents SET DEFAULT 0;
UPDATE vehicles SET vehicle_price_cents = 0 WHERE vehicle_price_cents IS NULL;
ALTER TABLE vehicles ALTER COLUMN vehicle_price_cents SET NOT NULL;

-- Drivers: profile fields for checkout cards
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['English'],
  ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

UPDATE drivers SET full_name = COALESCE(full_name, name) WHERE full_name IS NULL;

-- Bookings: adults/children, snapshots, customer extras, trip lifecycle
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS adult_count INTEGER,
  ADD COLUMN IF NOT EXISTS child_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS passenger_count INTEGER,
  ADD COLUMN IF NOT EXISTS vehicle_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS price_per_person_cents INTEGER,
  ADD COLUMN IF NOT EXISTS passenger_total_cents INTEGER,
  ADD COLUMN IF NOT EXISTS grand_total_cents INTEGER,
  ADD COLUMN IF NOT EXISTS booking_reference TEXT,
  ADD COLUMN IF NOT EXISTS yoco_payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS client_country TEXT,
  ADD COLUMN IF NOT EXISTS pickup_address TEXT,
  ADD COLUMN IF NOT EXISTS dietary_requirements TEXT,
  ADD COLUMN IF NOT EXISTS flight_number TEXT,
  ADD COLUMN IF NOT EXISTS special_requests TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS trip_status TEXT DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS driver_earnings_cents INTEGER,
  ADD COLUMN IF NOT EXISTS driver_name_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_name_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS tour_name_snapshot TEXT;

-- Backfill passenger counts from guest_count
UPDATE bookings
SET adult_count = COALESCE(adult_count, guest_count, 1),
    passenger_count = COALESCE(passenger_count, guest_count, 1),
    grand_total_cents = COALESCE(grand_total_cents, final_price_cents),
    payment_status = CASE
      WHEN status = 'paid' THEN 'paid'
      WHEN status = 'cancelled' THEN 'cancelled'
      ELSE COALESCE(payment_status, 'pending')
    END
WHERE adult_count IS NULL OR passenger_count IS NULL OR grand_total_cents IS NULL;

-- Unique booking reference
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_reference
  ON bookings (booking_reference)
  WHERE booking_reference IS NOT NULL;

-- Seed tour content & PPP
UPDATE tours SET
  duration_label = '3–4 hours',
  included_items = ARRAY['Private guide', 'Hotel pickup & drop-off', 'Bottled water'],
  excluded_items = ARRAY['Entrance fees', 'Meals', 'Gratuities'],
  price_per_person_cents = 40000,
  image_url = '/bo-kaap.jpg'
WHERE slug = 'city';

UPDATE tours SET
  duration_label = 'Full day (approx. 7–8 hours)',
  included_items = ARRAY['Private guide', 'Hotel pickup & drop-off', 'Bottled water', 'Scenic coastal drive'],
  excluded_items = ARRAY['Cape Point entrance fees', 'Penguin colony tickets', 'Meals', 'Gratuities'],
  price_per_person_cents = 90000,
  image_url = '/cape-point.jpg'
WHERE slug = 'peninsula';

UPDATE tours SET
  duration_label = '5–6 hours',
  included_items = ARRAY['Private guide', 'Hotel pickup & drop-off', 'Bottled water', 'Halal-friendly stops'],
  excluded_items = ARRAY['Wine tastings', 'Meals', 'Gratuities'],
  price_per_person_cents = 80000,
  image_url = '/winelands.jpg'
WHERE slug = 'winelands';

UPDATE tours SET
  duration_label = '2–3 hours',
  included_items = ARRAY['Private guide', 'Hotel pickup & drop-off', 'Bottled water'],
  excluded_items = ARRAY['Meals', 'Gratuities'],
  price_per_person_cents = 50000,
  image_url = '/campsbay.JPG'
WHERE slug = 'sunset';

-- Seed vehicle fees & features (vehicle fee is primary; PPP is on tour)
UPDATE vehicles SET
  vehicle_price_cents = 250000,
  luggage_capacity = 2,
  features = ARRAY['Air conditioning', 'Complimentary bottled water', 'Ideal for couples & small groups'],
  image_url = '/Toyota Corolla Cross.jpg'
WHERE slug = 'corolla';

UPDATE vehicles SET
  vehicle_price_cents = 320000,
  luggage_capacity = 4,
  features = ARRAY['Air conditioning', 'Complimentary bottled water', 'Spacious for families', 'Extra luggage space'],
  image_url = '/Suzuki XL6.jpg'
WHERE slug = 'suzuki';

UPDATE vehicles SET
  vehicle_price_cents = 450000,
  luggage_capacity = 2,
  features = ARRAY['Premium leather interior', 'Air conditioning', 'Complimentary bottled water', 'Luxury experience'],
  image_url = '/Mercedes Benz.png',
  is_luxury = true
WHERE slug = 'mercedes';

-- Seed driver profile
UPDATE drivers SET
  full_name = 'Yaseen',
  photo_url = '/driver-yaseen.JPG',
  languages = ARRAY['English', 'Afrikaans'],
  years_experience = 8,
  bio = 'Local Cape Town guide specialising in private, flexible tours designed around your time, interests, and pace.',
  rating_avg = 5.0,
  rating_count = 0
WHERE id = '11111111-1111-1111-1111-111111111111';

-- =============================================================================
-- Appended from 006_premium_checkout.sql (run migrations/006 if DB already exists)
-- =============================================================================

-- =============================================================================
-- 006 — Premium checkout: vehicle+PPP pricing, driver profiles, booking details
-- =============================================================================

-- Tours: duration, inclusions, per-person rate
ALTER TABLE tours
  ADD COLUMN IF NOT EXISTS duration_label TEXT,
  ADD COLUMN IF NOT EXISTS included_items TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS excluded_items TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_per_person_cents INTEGER,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Backfill PPP from previous additional_guest_price if present
UPDATE tours
SET price_per_person_cents = COALESCE(price_per_person_cents, additional_guest_price_cents, 35000)
WHERE price_per_person_cents IS NULL;

ALTER TABLE tours
  ALTER COLUMN price_per_person_cents SET DEFAULT 35000;

UPDATE tours SET price_per_person_cents = 35000 WHERE price_per_person_cents IS NULL;
ALTER TABLE tours ALTER COLUMN price_per_person_cents SET NOT NULL;

-- Vehicles: flat vehicle fee + luggage/features/photo
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS vehicle_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS luggage_capacity INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE vehicles
SET vehicle_price_cents = COALESCE(vehicle_price_cents, vehicle_surcharge_cents, 0)
WHERE vehicle_price_cents IS NULL;

ALTER TABLE vehicles ALTER COLUMN vehicle_price_cents SET DEFAULT 0;
UPDATE vehicles SET vehicle_price_cents = 0 WHERE vehicle_price_cents IS NULL;
ALTER TABLE vehicles ALTER COLUMN vehicle_price_cents SET NOT NULL;

-- Drivers: profile fields for checkout cards
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['English'],
  ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

UPDATE drivers SET full_name = COALESCE(full_name, name) WHERE full_name IS NULL;

-- Bookings: adults/children, snapshots, customer extras, trip lifecycle
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS adult_count INTEGER,
  ADD COLUMN IF NOT EXISTS child_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS passenger_count INTEGER,
  ADD COLUMN IF NOT EXISTS vehicle_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS price_per_person_cents INTEGER,
  ADD COLUMN IF NOT EXISTS passenger_total_cents INTEGER,
  ADD COLUMN IF NOT EXISTS grand_total_cents INTEGER,
  ADD COLUMN IF NOT EXISTS booking_reference TEXT,
  ADD COLUMN IF NOT EXISTS yoco_payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS client_country TEXT,
  ADD COLUMN IF NOT EXISTS pickup_address TEXT,
  ADD COLUMN IF NOT EXISTS dietary_requirements TEXT,
  ADD COLUMN IF NOT EXISTS flight_number TEXT,
  ADD COLUMN IF NOT EXISTS special_requests TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS trip_status TEXT DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS driver_earnings_cents INTEGER,
  ADD COLUMN IF NOT EXISTS driver_name_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_name_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS tour_name_snapshot TEXT;

-- Backfill passenger counts from guest_count
UPDATE bookings
SET adult_count = COALESCE(adult_count, guest_count, 1),
    passenger_count = COALESCE(passenger_count, guest_count, 1),
    grand_total_cents = COALESCE(grand_total_cents, final_price_cents),
    payment_status = CASE
      WHEN status = 'paid' THEN 'paid'
      WHEN status = 'cancelled' THEN 'cancelled'
      ELSE COALESCE(payment_status, 'pending')
    END
WHERE adult_count IS NULL OR passenger_count IS NULL OR grand_total_cents IS NULL;

-- Unique booking reference
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_reference
  ON bookings (booking_reference)
  WHERE booking_reference IS NOT NULL;

-- Seed tour content & PPP
UPDATE tours SET
  duration_label = '3–4 hours',
  included_items = ARRAY['Private guide', 'Hotel pickup & drop-off', 'Bottled water'],
  excluded_items = ARRAY['Entrance fees', 'Meals', 'Gratuities'],
  price_per_person_cents = 40000,
  image_url = '/bo-kaap.jpg'
WHERE slug = 'city';

UPDATE tours SET
  duration_label = 'Full day (approx. 7–8 hours)',
  included_items = ARRAY['Private guide', 'Hotel pickup & drop-off', 'Bottled water', 'Scenic coastal drive'],
  excluded_items = ARRAY['Cape Point entrance fees', 'Penguin colony tickets', 'Meals', 'Gratuities'],
  price_per_person_cents = 90000,
  image_url = '/cape-point.jpg'
WHERE slug = 'peninsula';

UPDATE tours SET
  duration_label = '5–6 hours',
  included_items = ARRAY['Private guide', 'Hotel pickup & drop-off', 'Bottled water', 'Halal-friendly stops'],
  excluded_items = ARRAY['Wine tastings', 'Meals', 'Gratuities'],
  price_per_person_cents = 80000,
  image_url = '/winelands.jpg'
WHERE slug = 'winelands';

UPDATE tours SET
  duration_label = '2–3 hours',
  included_items = ARRAY['Private guide', 'Hotel pickup & drop-off', 'Bottled water'],
  excluded_items = ARRAY['Meals', 'Gratuities'],
  price_per_person_cents = 50000,
  image_url = '/campsbay.JPG'
WHERE slug = 'sunset';

-- Seed vehicle fees & features (vehicle fee is primary; PPP is on tour)
UPDATE vehicles SET
  vehicle_price_cents = 250000,
  luggage_capacity = 2,
  features = ARRAY['Air conditioning', 'Complimentary bottled water', 'Ideal for couples & small groups'],
  image_url = '/Toyota Corolla Cross.jpg'
WHERE slug = 'corolla';

UPDATE vehicles SET
  vehicle_price_cents = 320000,
  luggage_capacity = 4,
  features = ARRAY['Air conditioning', 'Complimentary bottled water', 'Spacious for families', 'Extra luggage space'],
  image_url = '/Suzuki XL6.jpg'
WHERE slug = 'suzuki';

UPDATE vehicles SET
  vehicle_price_cents = 450000,
  luggage_capacity = 2,
  features = ARRAY['Premium leather interior', 'Air conditioning', 'Complimentary bottled water', 'Luxury experience'],
  image_url = '/Mercedes Benz.png',
  is_luxury = true
WHERE slug = 'mercedes';

-- Seed driver profile
UPDATE drivers SET
  full_name = 'Yaseen',
  photo_url = '/driver-yaseen.JPG',
  languages = ARRAY['English', 'Afrikaans'],
  years_experience = 8,
  bio = 'Local Cape Town guide specialising in private, flexible tours designed around your time, interests, and pace.',
  rating_avg = 5.0,
  rating_count = 0
WHERE id = '11111111-1111-1111-1111-111111111111';

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

-- 008 — Suzuki XL6 available for 1–5 guests
UPDATE vehicles
SET capacity_min = 1, capacity_max = 5
WHERE slug = 'suzuki' OR name = 'Suzuki XL6';

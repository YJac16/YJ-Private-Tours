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

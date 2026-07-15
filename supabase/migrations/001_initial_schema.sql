-- =============================================================================
-- YJ Private Tours — Supabase schema (Production Safe)
-- Rules:
-- - 1 paid booking per day
-- - No booking on blocked dates
-- - Minimum 2 full days advance booking
-- - Status enums enforced
-- =============================================================================

-- Enable crypto extension (for UUID generation if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE booking_status AS ENUM ('pending', 'paid', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed');

-- =============================================================================
-- CORE TABLES
-- =============================================================================

CREATE TABLE drivers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tours (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  slug        TEXT UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  slug        TEXT UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- BLOCKED DATES
-- =============================================================================

CREATE TABLE blocked_dates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL UNIQUE,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blocked_dates_date ON blocked_dates (blocked_date);

-- =============================================================================
-- BOOKINGS
-- =============================================================================

CREATE TABLE bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id     UUID NOT NULL REFERENCES drivers (id) ON DELETE RESTRICT,
  tour_id       UUID NOT NULL REFERENCES tours (id) ON DELETE RESTRICT,
  vehicle_id    UUID NOT NULL REFERENCES vehicles (id) ON DELETE RESTRICT,

  booking_date  DATE NOT NULL,
  status        booking_status NOT NULL DEFAULT 'pending',

  client_name   TEXT NOT NULL,
  client_email  TEXT NOT NULL,
  client_phone  TEXT,
  notes         TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_date ON bookings (booking_date);
CREATE INDEX idx_bookings_status ON bookings (status);

-- Only ONE paid booking per day (future-proof: change to driver_id, booking_date if needed)
CREATE UNIQUE INDEX idx_one_paid_booking_per_day
  ON bookings (booking_date)
  WHERE status = 'paid';

-- =============================================================================
-- PAYMENTS
-- =============================================================================

CREATE TABLE payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID NOT NULL REFERENCES bookings (id) ON DELETE RESTRICT,

  status        payment_status NOT NULL DEFAULT 'pending',
  amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),
  currency      TEXT NOT NULL DEFAULT 'ZAR',

  external_id   TEXT, -- Yoco payment ID
  paid_at       TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_booking ON payments (booking_id);
CREATE INDEX idx_payments_external ON payments (external_id)
  WHERE external_id IS NOT NULL;

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- BOOKING VALIDATION TRIGGER (CRITICAL BUSINESS RULES)
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- 1️⃣ Enforce 2-day advance rule
  IF NEW.booking_date < (CURRENT_DATE + INTERVAL '2 days') THEN
    RAISE EXCEPTION 'Bookings must be made at least 2 days in advance.';
  END IF;

  -- 2️⃣ Prevent booking on blocked date
  IF EXISTS (
    SELECT 1 FROM blocked_dates
    WHERE blocked_date = NEW.booking_date
  ) THEN
    RAISE EXCEPTION 'This date is blocked and cannot be booked.';
  END IF;

  -- 3️⃣ Prevent multiple paid bookings per day
  IF NEW.status = 'paid' AND EXISTS (
    SELECT 1 FROM bookings
    WHERE booking_date = NEW.booking_date
    AND status = 'paid'
    AND id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'This date is already fully booked.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_booking_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking();

-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT INTO drivers (id, name, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Yaseen', true);

INSERT INTO tours (id, name, description, slug) VALUES
  ('22222222-2222-2222-2222-222222222201', 'City Tour', 'Cape Town city and surrounds', 'city'),
  ('22222222-2222-2222-2222-222222222202', 'Cape Point', 'Cape Peninsula and Cape Point', 'peninsula'),
  ('22222222-2222-2222-2222-222222222203', 'Winelands Tour', 'Stellenbosch / Franschhoek winelands', 'winelands'),
  ('22222222-2222-2222-2222-222222222204', 'Ocean Sunset', 'Atlantic seaboard sunset experience', 'sunset');

INSERT INTO vehicles (id, name, description, slug) VALUES
  ('33333333-3333-3333-3333-333333333301', 'Suzuki XL6', 'Spacious comfort for families', 'suzuki'),
  ('33333333-3333-3333-3333-333333333302', 'Mercedes Benz GLC 250 Coupe', 'Premium luxury experience', 'mercedes'),
  ('33333333-3333-3333-3333-333333333303', 'Toyota Corolla Cross GR Sport', 'Sporty comfort with a personal touch', 'corolla');

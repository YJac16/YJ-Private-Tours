-- =============================================================================
-- 003 — Time slots, per-driver capacity, driver schedule control
-- =============================================================================

-- Bookings are for a specific start time (not just a date)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS start_time TIME NOT NULL DEFAULT '08:00';

CREATE INDEX IF NOT EXISTS idx_bookings_driver_date
  ON bookings (driver_id, booking_date);

-- Replace global "one paid booking per day" with per driver + date + time
DROP INDEX IF EXISTS idx_one_paid_booking_per_day;

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_paid_booking_per_driver_slot
  ON bookings (driver_id, booking_date, start_time)
  WHERE status = 'paid';

-- Default bookable time slots (can be overridden per driver via unavailability)
CREATE TABLE IF NOT EXISTS time_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time  TIME NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO time_slots (id, start_time, label, sort_order) VALUES
  ('44444444-4444-4444-4444-444444444401', '08:00', 'Morning — 08:00', 1),
  ('44444444-4444-4444-4444-444444444402', '12:30', 'Afternoon — 12:30', 2),
  ('44444444-4444-4444-4444-444444444403', '16:30', 'Sunset — 16:30', 3)
ON CONFLICT (start_time) DO NOTHING;

-- Driver marks whole days or specific slots unavailable / rescheduled
CREATE TABLE IF NOT EXISTS driver_unavailable (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id          UUID NOT NULL REFERENCES drivers (id) ON DELETE CASCADE,
  unavailable_date   DATE NOT NULL,
  start_time         TIME, -- NULL = entire day blocked
  reason             TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (driver_id, unavailable_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_driver_unavailable_date
  ON driver_unavailable (driver_id, unavailable_date);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_unavailable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read time_slots"
  ON time_slots FOR SELECT USING (true);

CREATE POLICY "Public read driver_unavailable"
  ON driver_unavailable FOR SELECT USING (true);

-- Update booking validation for time-aware rules
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

  -- Driver blocked whole day or this slot
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

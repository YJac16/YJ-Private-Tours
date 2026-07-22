-- 012 — Allow booking metadata updates without re-checking 2-day notice
-- (SETUP_LIVE backfills were failing on existing near-term bookings)

CREATE OR REPLACE FUNCTION validate_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- 2-day notice only for new bookings, or when the travel date is changed
  IF TG_OP = 'INSERT'
     OR (TG_OP = 'UPDATE' AND NEW.booking_date IS DISTINCT FROM OLD.booking_date)
  THEN
    IF NEW.booking_date < (CURRENT_DATE + INTERVAL '2 days') THEN
      RAISE EXCEPTION 'Bookings must be made at least 2 days in advance.';
    END IF;
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

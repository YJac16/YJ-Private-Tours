-- =============================================================================
-- 016 — Phase 1: security, slot locks, pending expiry, vehicle conflicts
-- Requires 015_booking_status_expired.sql (enum value 'expired')
-- =============================================================================

-- Processed Yoco webhook events (idempotency)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  event_id     TEXT PRIMARY KEY,
  booking_id   UUID REFERENCES bookings (id) ON DELETE SET NULL,
  event_type   TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Book attempt idempotency keys
CREATE TABLE IF NOT EXISTS booking_idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  booking_id      UUID NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_idempotency_created
  ON booking_idempotency_keys (created_at);

-- Expire stale pending bookings (30 minutes) — releases driver/vehicle slots
CREATE OR REPLACE FUNCTION public.expire_stale_pending_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer := 0;
BEGIN
  UPDATE bookings
  SET
    status = 'expired',
    payment_status = 'cancelled',
    trip_status = 'cancelled',
    updated_at = now()
  WHERE status = 'pending'
    AND created_at < (now() - interval '30 minutes');

  GET DIAGNOSTICS n = ROW_COUNT;

  UPDATE payments p
  SET
    status = 'failed',
    updated_at = now()
  WHERE p.status = 'pending'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = p.booking_id
        AND b.status = 'expired'
    );

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_pending_bookings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_stale_pending_bookings() TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_stale_pending_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_pending_bookings() TO anon;

-- Replace paid-only unique slot with active pending+paid holds (driver)
DROP INDEX IF EXISTS idx_one_paid_booking_per_driver_slot;

CREATE UNIQUE INDEX IF NOT EXISTS idx_active_driver_slot
  ON bookings (driver_id, booking_date, start_time)
  WHERE status IN ('pending', 'paid');

-- Global vehicle conflict: one vehicle per date/time across fleet
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_vehicle_slot
  ON bookings (vehicle_id, booking_date, start_time)
  WHERE status IN ('pending', 'paid');

-- Validation: clash on pending+paid for driver and vehicle; expire first via app
CREATE OR REPLACE FUNCTION validate_booking()
RETURNS TRIGGER AS $$
BEGIN
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

  IF NEW.status IN ('pending', 'paid') AND EXISTS (
    SELECT 1 FROM bookings
    WHERE driver_id = NEW.driver_id
      AND booking_date = NEW.booking_date
      AND start_time = NEW.start_time
      AND status IN ('pending', 'paid')
      AND id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'This driver time slot is already reserved.';
  END IF;

  IF NEW.status IN ('pending', 'paid') AND EXISTS (
    SELECT 1 FROM bookings
    WHERE vehicle_id = NEW.vehicle_id
      AND booking_date = NEW.booking_date
      AND start_time = NEW.start_time
      AND status IN ('pending', 'paid')
      AND id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'This vehicle is already reserved for the selected slot.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- RLS: remove public booking SELECT; scoped access only
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read bookings" ON bookings;

DROP POLICY IF EXISTS "Clients read own bookings" ON bookings;
CREATE POLICY "Clients read own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (client_user_id = auth.uid());

DROP POLICY IF EXISTS "Drivers read assigned bookings" ON bookings;
CREATE POLICY "Drivers read assigned bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drivers d
      WHERE d.id = bookings.driver_id
        AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins read all bookings" ON bookings;
CREATE POLICY "Admins read all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- Profiles: prevent self role escalation
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow service-role / no JWT (admin APIs). Block authenticated non-admins.
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

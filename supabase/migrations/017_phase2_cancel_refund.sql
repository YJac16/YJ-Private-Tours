-- =============================================================================
-- 017 — Phase 2: cancel metadata, refund tracking, booking status history
-- =============================================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT,
  ADD COLUMN IF NOT EXISTS refund_status TEXT,
  ADD COLUMN IF NOT EXISTS refund_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_external_id TEXT,
  ADD COLUMN IF NOT EXISTS reschedule_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reschedule_note TEXT;

COMMENT ON COLUMN bookings.cancelled_by IS 'client | driver | admin | system';
COMMENT ON COLUMN bookings.refund_status IS 'none | pending | succeeded | failed | ineligible';

CREATE TABLE IF NOT EXISTS booking_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  changed_by  TEXT,
  reason      TEXT,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking
  ON booking_status_history (booking_id, created_at DESC);

ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read booking history" ON booking_status_history;
CREATE POLICY "Admins read booking history"
  ON booking_status_history FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Clients read own booking history" ON booking_status_history;
CREATE POLICY "Clients read own booking history"
  ON booking_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_status_history.booking_id
        AND b.client_user_id = auth.uid()
    )
  );

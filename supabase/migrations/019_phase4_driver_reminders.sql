-- 019 — Phase 4: day-before driver reminder idempotency

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_bookings_reminder_due
  ON public.bookings (booking_date)
  WHERE reminder_sent_at IS NULL
    AND status IN ('pending', 'paid');

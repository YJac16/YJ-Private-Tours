-- =============================================================================
-- 015 — Add booking_status 'expired' (must commit before use in later migration)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'booking_status' AND e.enumlabel = 'expired'
  ) THEN
    ALTER TYPE booking_status ADD VALUE 'expired';
  END IF;
END $$;

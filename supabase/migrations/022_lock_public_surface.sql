-- 022 — Close the anonymous surface found in the security review.
-- Service role (used by the API) bypasses RLS and keeps its existing grants.

REVOKE ALL ON FUNCTION public.expire_stale_pending_bookings() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_stale_pending_bookings() FROM anon;
REVOKE ALL ON FUNCTION public.expire_stale_pending_bookings() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_pending_bookings() TO service_role;

ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_status_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.processed_webhook_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.booking_idempotency_keys FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.quote_status_history FROM PUBLIC, anon, authenticated;

-- No client policies: anon and authenticated cannot read or write these tables.

DROP POLICY IF EXISTS "Public read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Public read booking settings" ON public.app_settings;
CREATE POLICY "Public read booking settings"
  ON public.app_settings
  FOR SELECT
  TO anon, authenticated
  USING (key = 'booking');

-- drivers: public profile columns only. user_id is the auth user id.
REVOKE ALL ON TABLE public.drivers FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position)
    INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'drivers'
    AND column_name <> 'user_id';

  IF cols IS NULL THEN
    RAISE EXCEPTION 'drivers has no public columns to grant';
  END IF;

  EXECUTE format(
    'GRANT SELECT (%s) ON TABLE public.drivers TO anon, authenticated',
    cols
  );
END $$;

DROP POLICY IF EXISTS "Public read drivers" ON public.drivers;
CREATE POLICY "Public read drivers"
  ON public.drivers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- tours: hide admin_meta (weekend/holiday prices and internal flags).
REVOKE ALL ON TABLE public.tours FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position)
    INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'tours'
    AND column_name <> 'admin_meta';

  IF cols IS NULL THEN
    RAISE EXCEPTION 'tours has no public columns to grant';
  END IF;

  EXECUTE format(
    'GRANT SELECT (%s) ON TABLE public.tours TO anon, authenticated',
    cols
  );
END $$;

DROP POLICY IF EXISTS "Public read tours" ON public.tours;
CREATE POLICY "Public read tours"
  ON public.tours
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 018 — Phase 3: enable RLS on quotes / invoices / document_counters
-- Admin APIs use service role; anon/authenticated must not read business docs directly.

ALTER TABLE IF EXISTS public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.document_counters ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policies if any were added manually
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('quotes', 'invoices', 'document_counters')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Admin-only SELECT via profiles.role (service role bypasses RLS)
CREATE POLICY quotes_admin_select ON public.quotes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY invoices_admin_select ON public.invoices
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY document_counters_admin_select ON public.document_counters
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- Mutations stay service-role only (no INSERT/UPDATE/DELETE policies for authenticated)

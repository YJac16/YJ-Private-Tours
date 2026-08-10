-- 020 — Phase 6: Resend notification outbox (templates via payload, retry, dedupe)

CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('driver', 'guest', 'ops')),
  kind text NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  body_text text NOT NULL,
  body_html text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  attempts int NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  provider_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  CONSTRAINT notification_outbox_dedupe_key_unique UNIQUE (dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_drain
  ON public.notification_outbox (status, next_attempt_at)
  WHERE status IN ('pending', 'failed');

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- Service role only (no public / authenticated policies)
DROP POLICY IF EXISTS notification_outbox_no_client ON public.notification_outbox;
CREATE POLICY notification_outbox_no_client
  ON public.notification_outbox
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

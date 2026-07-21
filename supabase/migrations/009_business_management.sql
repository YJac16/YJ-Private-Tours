-- 009 — Business management: quotes, invoices, document counters, tour admin_meta

ALTER TABLE tours
  ADD COLUMN IF NOT EXISTS admin_meta JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN tours.admin_meta IS
  'JSONB: weekend/holiday/peak prices, additional_hour_price, min_guests, display_order, status, recommended_vehicle_id';

CREATE TABLE IF NOT EXISTS quotes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number            TEXT NOT NULL UNIQUE,
  status                  TEXT NOT NULL DEFAULT 'draft',
  customer                JSONB NOT NULL DEFAULT '{}'::jsonb,
  adults                  INTEGER NOT NULL DEFAULT 1,
  children                INTEGER NOT NULL DEFAULT 0,
  tour_id                 UUID REFERENCES tours (id) ON DELETE SET NULL,
  vehicle_id              UUID REFERENCES vehicles (id) ON DELETE SET NULL,
  travel_date             DATE,
  pickup                  TEXT,
  dropoff                 TEXT,
  special_requests        TEXT,
  enquiry_source          TEXT,
  pricing_snapshot        JSONB,
  discount_cents          INTEGER NOT NULL DEFAULT 0,
  additional_charges_cents INTEGER NOT NULL DEFAULT 0,
  grand_total_cents       INTEGER,
  expires_at              TIMESTAMPTZ,
  created_by              TEXT,
  booking_id              UUID REFERENCES bookings (id) ON DELETE SET NULL,
  pdf_url                 TEXT,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes (status);
CREATE INDEX IF NOT EXISTS idx_quotes_travel_date ON quotes (travel_date);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes (created_at DESC);

CREATE TABLE IF NOT EXISTS quote_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    UUID NOT NULL REFERENCES quotes (id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  changed_by  TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_status_history_quote
  ON quote_status_history (quote_id, created_at DESC);

CREATE TABLE IF NOT EXISTS invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number   TEXT NOT NULL UNIQUE,
  quote_id         UUID REFERENCES quotes (id) ON DELETE SET NULL,
  booking_id       UUID REFERENCES bookings (id) ON DELETE SET NULL,
  customer         JSONB NOT NULL DEFAULT '{}'::jsonb,
  amount_cents     INTEGER NOT NULL DEFAULT 0,
  payment_status   TEXT NOT NULL DEFAULT 'pending',
  yoco_reference   TEXT,
  travel_date      DATE,
  pdf_url          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices (payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices (created_at DESC);

CREATE TABLE IF NOT EXISTS document_counters (
  prefix     TEXT PRIMARY KEY,
  next_value INTEGER NOT NULL DEFAULT 1
);

INSERT INTO document_counters (prefix, next_value) VALUES
  ('KCE-Q', 1),
  ('KCE-B', 1),
  ('KCE-INV', 1),
  ('KCE-R', 1)
ON CONFLICT (prefix) DO NOTHING;

-- Business settings live in app_settings under key 'business'
INSERT INTO app_settings (key, value) VALUES
  ('business', '{
    "company_name": "Khayr Cape Experiences",
    "logo_url": "",
    "email": "",
    "whatsapp": "",
    "website": "",
    "social": {"instagram": "", "facebook": ""},
    "prefixes": {"quote": "KCE-Q", "booking": "KCE-B", "invoice": "KCE-INV", "receipt": "KCE-R"},
    "currency": "ZAR",
    "vat_percent": 15,
    "business_hours": "",
    "discounts": [],
    "pdf_templates": {
      "quotation": {"header": "", "footer": "", "terms": "", "colours": {"cream": "#F5F0E8", "green": "#4D5B4A", "gold": "#B08D57"}},
      "invoice": {"header": "", "footer": "", "terms": "", "colours": {"cream": "#F5F0E8", "green": "#4D5B4A", "gold": "#B08D57"}},
      "receipt": {"header": "", "footer": "", "terms": "", "colours": {"cream": "#F5F0E8", "green": "#4D5B4A", "gold": "#B08D57"}}
    }
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

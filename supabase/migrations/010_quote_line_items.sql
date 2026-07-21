-- 010 — Quote line items, PDF path, invoice booking reference
-- Timeline stop extras (lat, lng, arrival_time) live in experience_content JSON
-- (experience_content.timeline[]), not as separate columns.

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS pdf_path TEXT;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS booking_reference TEXT;

COMMENT ON COLUMN quotes.line_items IS
  'JSONB array of quote line items (multi-experience rows)';

COMMENT ON COLUMN quotes.pdf_path IS
  'Storage path for generated quote PDF (documents bucket)';

COMMENT ON COLUMN invoices.booking_reference IS
  'Snapshot of booking reference at invoice creation';

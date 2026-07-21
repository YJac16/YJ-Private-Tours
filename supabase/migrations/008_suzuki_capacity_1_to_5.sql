-- 008 — Suzuki XL6 available for 1–5 guests (was 4–5 only)
UPDATE vehicles
SET
  capacity_min = 1,
  capacity_max = 5
WHERE slug = 'suzuki'
   OR name = 'Suzuki XL6';

-- 014 — Peninsula is an express half-day, not a full 7–8 hour tour
UPDATE tours
SET duration_label = 'Express (approx. 3.5–4.5 hours)'
WHERE slug = 'peninsula';

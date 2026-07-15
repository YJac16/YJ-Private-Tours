-- =============================================================================
-- 002
-- =============================================================================
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tours"
ON tours FOR SELECT
USING (true);

CREATE POLICY "Public read vehicles"
ON vehicles FOR SELECT
USING (true);

CREATE POLICY "Public read drivers"
ON drivers FOR SELECT
USING (true);

CREATE POLICY "Public read bookings"
ON bookings FOR SELECT
USING (true);

CREATE POLICY "Public read blocked_dates"
ON blocked_dates FOR SELECT
USING (true);

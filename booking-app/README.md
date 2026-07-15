# YJ Private Tours — Booking API (Next.js + Supabase)

Booking API with date/time slots, driver + vehicle selection, and a driver schedule portal.

## Setup

1. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In the SQL Editor, run migrations in order:
     - `../supabase/migrations/001_initial_schema.sql`
     - `../supabase/migrations/002_rls_public_read.sql`
     - `../supabase/migrations/003_time_slots_and_driver_schedule.sql`
     - `../supabase/migrations/004_slugs.sql`

2. **Env**
   - Copy `.env.example` to `.env.local`.
   - Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
   - Optional: `YOCO_SECRET_KEY` + `SITE_URL` for payments.
   - Optional: `DRIVER_PIN` for `/driver` portal (default `0420`).

3. **Run**
   - `npm install`
   - `npm run dev` — API at `http://localhost:3000`
   - Client (`../client`) proxies `/api` → `:3000` in Vite.

## Payment (Yoco)

Guest flow creates a **pending** booking, then redirects to Yoco hosted checkout.

| Env | Purpose |
|-----|---------|
| `YOCO_SECRET_KEY` | Server-only — create checkouts |
| `NEXT_PUBLIC_YOCO_PUBLIC_KEY` | Public key (safe in browser) |
| `SITE_URL` | Success / cancel redirect base (e.g. `http://localhost:5173`) |

After payment, Yoco redirects to `/thank-you?payment=success&booking_id=…`, which calls `POST /api/payment-confirm`. Also configure `POST /api/payment-webhook` in the Yoco dashboard for production.

## API

| Method | Route | Description |
|--------|--------|-------------|
| GET | `/api/catalog` | Drivers, vehicles, tours |
| GET | `/api/slots?date=&driver_id=` | Available time slots for that day |
| GET | `/api/availability?date=` | Date available? |
| GET | `/api/availability/dates?from=&to=` | Available dates in range |
| POST | `/api/book` | Create pending booking (+ optional Yoco checkout) |
| GET/PATCH/POST/DELETE | `/api/driver` | Driver schedule (header `x-driver-pin`) |
| POST | `/api/payment-webhook` | Mark booking paid after payment |

## Guest flow (client `/book`)

1. Date (min. 2 days ahead)
2. Driver
3. Available start time (08:00 / 12:30 / 16:30)
4. Vehicle (fleet)
5. Tour + contact details → pending booking

## Driver flow (client `/driver`)

- Unlock with PIN
- Block full days or slots
- Reschedule, confirm, or cancel bookings

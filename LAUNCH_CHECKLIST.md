# Production launch checklist (foot traffic)

Use this before promoting the live site for public bookings.

## Phase 8 findings (2026-08-10)

Automated / browser pass against `https://khayrcapeexperiences.com` (mobile viewport). Local working tree is ahead of production (Phases 5–7 + Home-drawer removal not fully live).

| Area | Result |
|------|--------|
| Canonical domain in repo | Fixed locally → `khayrcapeexperiences.com` (sitemap / robots / OG). **Needs deploy.** |
| `/robots.txt` + `/sitemap.xml` | Pass — static files (not SPA shell). Live copies still say `khayrcape.com` until deploy. |
| Client 404 | Pass — unknown URL shows “Page not found”. |
| `/book` + `/login` mobile | Pass — load; no mock sign-in buttons on login. |
| WhatsApp number | Pass — `+27 82 327 7446` in footer / WA links. |
| Driver reminders cron | Pass probe — `GET /api/driver-reminders` → **401** without cron auth. |
| Email outbox cron | **Fail** — `GET /api/email-outbox` → **404** (Phase 6 route not on production). |
| Paid bookings / webhooks | **Fail** — DB: bookings `pending:1` `cancelled:5`; payments all `pending`; `yoco_webhook_events` empty. No paid path proven live. |
| Mobile drawer Home | **Fail on prod** — logo + drawer Home duplicate. **Fixed locally** (drawer Home removed). |
| Privacy legal entity | Open — still has placeholder legal-entity copy. |
| Supabase RLS | **Risk** — RLS off on `quote_status_history`, `processed_webhook_events`, `booking_idempotency_keys`. |
| Vercel MCP | Linked to Unicab project, not KhayrCape — cannot read Khayr env from MCP. |

**Blocked for public foot traffic until:** deploy Phases 5–7 + SEO/Home fixes; live Yoco webhook → paid; `/api/email-outbox` live; one real end-to-end paid test booking.

## Domain & SEO

- [x] Confirm the live canonical domain — use `https://khayrcapeexperiences.com` in [`client/public/sitemap.xml`](client/public/sitemap.xml), [`client/public/robots.txt`](client/public/robots.txt), and [`client/index.html`](client/index.html) (fixed in working tree; deploy required).
- [x] Verify `/robots.txt` and `/sitemap.xml` load as static files (not the SPA shell).
- [ ] Spot-check Open Graph preview (WhatsApp / Facebook debugger) using the banner image.

## Environment (Vercel)

- [ ] `SITE_URL` = production origin (no trailing slash), used for Yoco success/cancel redirects.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (API) and `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (client) are set — **no mock store / mock auth in production**.
- [ ] `YOCO_SECRET_KEY` (live) and matching `VITE_YOCO_PUBLIC_KEY` (live public key).
- [ ] Optional but recommended: `YOCO_WEBHOOK_SECRET` and Resend vars (`RESEND_API_KEY`, verified `EMAIL_FROM`) for booking emails (guest + driver via `/api/email-outbox`).
- [ ] `DRIVER_NOTIFY_EMAIL=yaseenjacobs97@gmail.com` (pending + paid booking emails to the driver).
- [ ] Confirm `BOOKING_MOCK` is **not** set to `1` in production.

## Operator logins (Supabase Auth)

- [ ] Admin: `yaseenjacobs@icloud.com` → `/admin/pricing`
- [ ] Driver: `yaseenjacobs97@gmail.com` → `/driver` (linked to `drivers.user_id`)
- [ ] Passwords set via `scripts/seed-operator-auth-users.mjs` with `OPERATOR_ADMIN_PASSWORD` / `OPERATOR_DRIVER_PASSWORD` (never commit).
- [ ] Informed consent: clients sign once on `/account` or at checkout; admin can view under Customers.
- [ ] Hermanus Whale Experience: visible only 1 Jun–31 Oct (Africa/Johannesburg); boat enquiry WhatsApp only (no boat checkout).
- [ ] Test accounts (`*@test.khayrcape.com`) may remain for smoke tests only.

## Auth email confirmation (clients)

- [ ] Supabase Auth → Email: **Confirm email** enabled.
- [ ] Site URL + redirect allow-list includes production origin and `/auth/callback` (plus local Vite origin for dev).
- [ ] Spot-check signup → confirmation email → `/auth/callback` → account shows **Verified**.
- [ ] Account email change sends confirm link; `profiles.email` syncs after confirm.

## Payments (Yoco)

- [ ] Switch to live Yoco keys (not test).
- [ ] Configure webhook `POST /api/payment-webhook` in the Yoco dashboard with signing secret `YOCO_WEBHOOK_SECRET` (`whsec_…`).
- [ ] Confirm payment is marked **paid only via webhook** (thank-you page is status-only).
- [ ] Complete a real small test booking end-to-end (`/book` → Yoco → webhook → `/thank-you` shows `KC-…` reference).
- [ ] Confirm driver receives pending email on book and paid email after webhook.
- [ ] Confirm cancelled checkout returns to `/book?cancelled=1` and pending hold expires within 30 minutes.
- [ ] Confirm day-before driver reminder cron (`/api/driver-reminders`, 06:00 UTC) is enabled on Vercel; optional `CRON_SECRET`.
- [ ] Confirm email outbox drain cron (`/api/email-outbox` every 10m) runs; guest receives paid confirmation.

## Legal / POPIA

- [ ] Review [`/privacy`](client/src/pages/PrivacyPage.tsx) with a lawyer or adviser; replace placeholder Information Officer / legal entity details.
- [ ] Confirm [`/terms`](client/src/pages/TermsPage.tsx) cancellation and refund wording matches your practice.
- [ ] Confirm cookie banner appears once and links to `/cookies` + `/privacy`.
- [ ] Confirm booking and signup require Privacy / Terms acknowledgement.

## Content & trust

- [ ] Walk `/experience/city`, `/peninsula`, `/sunset`, `/winelands` — images match the stops.
- [ ] Confirm WhatsApp number in footer and floating button is correct (`+27 82 327 7446`).
- [ ] Confirm admin Content tab has **no** outdated `gallery_images` / `hero_image` overrides that would replace the fixed defaults.

## Smoke tests

- [x] Unknown URL shows the 404 page.
- [x] Home, gallery, book wizard, login/signup load on mobile.
- [x] Mock sign-in buttons do **not** appear when Supabase env is configured.
- [ ] Admin and driver real logins reach `/admin/pricing` and `/driver`.

## Mobile booking UX

- [ ] `/book` sticky total + Continue/Pay stay visible while scrolling steps on a phone.
- [ ] WhatsApp / scroll-to-top FABs do not cover Continue or Pay on `/book` or `/thank-you`.
- [ ] Cancelled or failed Yoco → thank-you allows guest email retry (or account Pay now) without getting stuck.
- [ ] Thank-you shows `KC-…` with clear confirming vs confirmed vs awaiting payment.
- [ ] Experience detail: Book Online remains reachable via sticky bar after scrolling.
- [ ] Cookie banner + safe-area do not permanently block primary CTAs.

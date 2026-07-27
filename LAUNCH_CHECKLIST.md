# Production launch checklist (foot traffic)

Use this before promoting the live site for public bookings.

## Domain & SEO

- [ ] Confirm the live canonical domain (sitemap/robots/OG tags currently use `https://khayrcape.com` — update [`client/public/sitemap.xml`](client/public/sitemap.xml), [`client/public/robots.txt`](client/public/robots.txt), and [`client/index.html`](client/index.html) if the real domain differs).
- [ ] Verify `/robots.txt` and `/sitemap.xml` load as static files (not the SPA shell).
- [ ] Spot-check Open Graph preview (WhatsApp / Facebook debugger) using the banner image.

## Environment (Vercel)

- [ ] `SITE_URL` = production origin (no trailing slash), used for Yoco success/cancel redirects.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (API) and `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (client) are set — **no mock store / mock auth in production**.
- [ ] `YOCO_SECRET_KEY` (live) and matching `VITE_YOCO_PUBLIC_KEY` (live public key).
- [ ] Optional but recommended: `YOCO_WEBHOOK_SECRET` and Resend/SMTP vars for booking emails.
- [ ] Confirm `BOOKING_MOCK` is **not** set to `1` in production.

## Payments (Yoco)

- [ ] Switch to live Yoco keys (not test).
- [ ] Configure webhook `POST /api/payment-webhook` in the Yoco dashboard.
- [ ] Complete a real small test booking end-to-end (`/book` → Yoco → `/thank-you`).
- [ ] Confirm cancelled checkout returns to `/thank-you?cancelled=1` (or equivalent) without marking paid.

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

- [ ] Unknown URL shows the 404 page.
- [ ] Home, gallery, book wizard, login/signup load on mobile.
- [ ] Mock sign-in buttons do **not** appear when Supabase env is configured.

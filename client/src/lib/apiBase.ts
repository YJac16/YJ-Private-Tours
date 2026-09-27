/**
 * Booking API base path. Prefer same-origin `/api` on Vercel (static + serverless).
 * Ignores cross-origin VITE_BOOKING_API_URL so production never calls a preview deployment.
 */
export function bookingApiBase(): string {
  const raw = (import.meta.env.VITE_BOOKING_API_URL || '/api').trim()
  if (!raw) return '/api'
  if (/^https?:\/\//i.test(raw)) {
    if (typeof window !== 'undefined') {
      try {
        if (new URL(raw).origin !== window.location.origin) {
          return '/api'
        }
      } catch {
        return '/api'
      }
    }
    return raw.replace(/\/$/, '')
  }
  return raw.startsWith('/') ? raw : `/${raw}`
}

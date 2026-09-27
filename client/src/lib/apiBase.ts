/**
 * Booking API base path. In the browser always use same-origin `/api` (Vercel static + serverless).
 * VITE_BOOKING_API_URL is ignored in the browser so production never calls a preview host.
 */
export function bookingApiBase(): string {
  if (typeof window !== 'undefined') {
    return '/api'
  }
  const raw = (import.meta.env.VITE_BOOKING_API_URL || '/api').trim()
  if (!raw) return '/api'
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, '')
  return raw.startsWith('/') ? raw : `/${raw}`
}

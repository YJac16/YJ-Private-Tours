import type { VercelRequest } from '@vercel/node'

/**
 * Admin PIN check for Pricing & Business Management APIs.
 * If ADMIN_PIN is set, only ADMIN_PIN is accepted.
 * Otherwise DRIVER_PIN || '0420'.
 */
export function checkAdminPin(req: VercelRequest, bodyPin?: string): boolean {
  const expected = process.env.ADMIN_PIN
    ? process.env.ADMIN_PIN
    : process.env.DRIVER_PIN || '0420'
  const headerPin = req.headers['x-driver-pin']
  const h = Array.isArray(headerPin) ? headerPin[0] : headerPin
  return (h || bodyPin) === expected
}

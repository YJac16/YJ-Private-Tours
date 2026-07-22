import type { VercelRequest } from '@vercel/node'
import { getAuthContext } from './authUser'

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

/** Prefer JWT admin role; fall back to admin PIN for legacy clients. */
export async function assertAdminAccess(
  req: VercelRequest,
  bodyPin?: string
): Promise<true | { error: string; status: number }> {
  const auth = await getAuthContext(req)
  if (auth?.role === 'admin') return true
  if (checkAdminPin(req, bodyPin)) return true
  return { error: 'Unauthorized', status: 401 }
}

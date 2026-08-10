import type { VercelRequest } from '@vercel/node'
import { getAuthContext } from './authUser'

/**
 * Admin PIN check for Pricing & Business Management APIs.
 * Only accepts ADMIN_PIN when explicitly configured — no hardcoded default.
 * Prefer Supabase Auth admin JWT via assertAdminAccess.
 */
export function checkAdminPin(req: VercelRequest, bodyPin?: string): boolean {
  const expected = process.env.ADMIN_PIN
  if (!expected) return false
  const headerPin = req.headers['x-driver-pin']
  const h = Array.isArray(headerPin) ? headerPin[0] : headerPin
  return (h || bodyPin) === expected
}

/** Prefer JWT admin role; fall back to ADMIN_PIN only when set in env. */
export async function assertAdminAccess(
  req: VercelRequest,
  bodyPin?: string
): Promise<true | { error: string; status: number }> {
  const auth = await getAuthContext(req)
  if (auth?.role === 'admin') return true
  if (checkAdminPin(req, bodyPin)) return true
  return { error: 'Unauthorized', status: 401 }
}

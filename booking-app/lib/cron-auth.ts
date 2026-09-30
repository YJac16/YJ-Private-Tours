import { timingSafeEqual } from 'node:crypto'

/**
 * True only when Authorization is exactly `Bearer <secret>`.
 * Missing secret fails closed. Length is checked before the compare so
 * timingSafeEqual does not throw.
 */
export function bearerMatches(
  authorization: string | undefined | null,
  secret: string | undefined | null
): boolean {
  if (!secret || !authorization) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(authorization)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(actual, expected)
}

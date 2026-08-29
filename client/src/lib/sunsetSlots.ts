/** Sunset experience only offers late-afternoon / evening departures. */
export function isSunsetFriendlyTime(startTime: string): boolean {
  const hhmm = startTime.slice(0, 5)
  const [h, m] = hhmm.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false
  return h * 60 + m >= 15 * 60
}

/**
 * Shared date helpers — use local calendar days (avoid UTC toISOString shift).
 */

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Earliest bookable date = today + noticeDays (default 2 full days). */
export function minBookableDate(noticeDays = 2): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + noticeDays)
  return formatLocalDate(d)
}

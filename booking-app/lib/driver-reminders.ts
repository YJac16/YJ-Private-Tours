/** Cape Town calendar helpers for day-before driver reminders. */

const CAPE_TZ = 'Africa/Johannesburg'

/** YYYY-MM-DD in Africa/Johannesburg for the given instant. */
export function capeTownYmd(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CAPE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Tomorrow's YYYY-MM-DD in Africa/Johannesburg. */
export function tomorrowCapeTownYmd(now = new Date()): string {
  const today = capeTownYmd(now)
  for (let h = 1; h <= 48; h++) {
    const candidate = capeTownYmd(new Date(now.getTime() + h * 60 * 60 * 1000))
    if (candidate > today) return candidate
  }
  const [y, m, d] = today.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  return next.toISOString().slice(0, 10)
}

export function shouldSendDriverReminder(booking: {
  status: string
  booking_date: string
  reminder_sent_at?: string | null
}): boolean {
  if (booking.status !== 'paid' && booking.status !== 'pending') return false
  if (booking.reminder_sent_at) return false
  return true
}

export { CAPE_TZ }

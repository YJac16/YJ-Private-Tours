/** Seasonal tour visibility (Africa/Johannesburg calendar). */

export type SeasonMonthDay = { m: number; d: number }

export type TourSeason = {
  start: SeasonMonthDay
  end: SeasonMonthDay
  tz?: string
}

export type SeasonalTourLike = {
  slug?: string | null
  admin_meta?: Record<string, unknown> | null
}

export const JOHANNESBURG_TZ = 'Africa/Johannesburg'

/** Default whale season: 1 June – 31 October */
export const WHALE_SEASON: TourSeason = {
  start: { m: 6, d: 1 },
  end: { m: 10, d: 31 },
  tz: JOHANNESBURG_TZ,
}

export function zonedYmd(
  date: Date,
  timeZone = JOHANNESBURG_TZ
): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(date)
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value || 0)
  return { y: get('year'), m: get('month'), d: get('day') }
}

export function monthDayKey(m: number, d: number) {
  return m * 100 + d
}

export function isMonthDayInSeason(
  m: number,
  d: number,
  season: TourSeason
): boolean {
  const cur = monthDayKey(m, d)
  const start = monthDayKey(season.start.m, season.start.d)
  const end = monthDayKey(season.end.m, season.end.d)
  if (start <= end) return cur >= start && cur <= end
  return cur >= start || cur <= end
}

export function isDateInSeason(
  date: Date | string,
  season: TourSeason = WHALE_SEASON
): boolean {
  const tz = season.tz || JOHANNESBURG_TZ
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [, m, d] = date.split('-').map(Number)
    return isMonthDayInSeason(m, d, season)
  }
  const dt = typeof date === 'string' ? new Date(date) : date
  const { m, d } = zonedYmd(dt, tz)
  return isMonthDayInSeason(m, d, season)
}

export function parseTourSeason(
  adminMeta: Record<string, unknown> | null | undefined
): TourSeason | null {
  if (!adminMeta || typeof adminMeta !== 'object') return null
  const raw = adminMeta.season
  if (!raw || typeof raw !== 'object') return null
  const season = raw as Record<string, unknown>
  const start = season.start as Record<string, unknown> | undefined
  const end = season.end as Record<string, unknown> | undefined
  const sm = Number(start?.m)
  const sd = Number(start?.d)
  const em = Number(end?.m)
  const ed = Number(end?.d)
  if (!sm || !sd || !em || !ed) return null
  return {
    start: { m: sm, d: sd },
    end: { m: em, d: ed },
    tz: typeof season.tz === 'string' ? season.tz : JOHANNESBURG_TZ,
  }
}

export function seasonForTour(tour: SeasonalTourLike): TourSeason | null {
  const fromMeta = parseTourSeason(
    tour.admin_meta as Record<string, unknown> | null | undefined
  )
  if (fromMeta) return fromMeta
  if (tour.slug === 'hermanus') return WHALE_SEASON
  return null
}

export function isTourPubliclyVisible(
  tour: SeasonalTourLike,
  now: Date = new Date(),
  options?: { travelDate?: string }
): boolean {
  const meta = (tour.admin_meta || {}) as Record<string, unknown>
  const status = meta.status
  if (status === 'hidden' || status === 'draft') return false

  const season = seasonForTour(tour)
  if (!season) return true

  if (!isDateInSeason(now, season)) return false

  if (options?.travelDate) {
    return isDateInSeason(options.travelDate, season)
  }
  return true
}

export function formatSeasonLabel(season: TourSeason = WHALE_SEASON): string {
  const months = [
    '',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return `${months[season.start.m]} – ${months[season.end.m]}`
}

import type { Tour } from '../../lib/bookingApi'

export const ADMIN_PIN_KEY = 'yj_admin_pin'

export type AdminTabId =
  | 'pricing'
  | 'templates'
  | 'quotes'
  | 'invoices'
  | 'discounts'
  | 'content'
  | 'pdf'
  | 'reports'
  | 'settings'
  | 'drivers'
  | 'trips'

export const ADMIN_TABS: { id: AdminTabId; label: string }[] = [
  { id: 'pricing', label: 'Pricing' },
  { id: 'templates', label: 'Experience Templates' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'discounts', label: 'Discounts' },
  { id: 'content', label: 'Experience Content' },
  { id: 'pdf', label: 'PDF Templates' },
  { id: 'reports', label: 'Reports' },
  { id: 'drivers', label: 'Drivers' },
  { id: 'trips', label: 'Trips' },
  { id: 'settings', label: 'Settings' },
]

export type TourAdminMeta = {
  weekend_price_cents?: number
  holiday_price_cents?: number
  peak_price_cents?: number
  additional_hour_price_cents?: number
  min_guests?: number
  display_order?: number
  status?: 'active' | 'draft' | 'hidden'
  recommended_vehicle_id?: string | null
}

export function centsToRands(cents: number) {
  return (cents / 100).toString()
}

export function randsToCents(rands: string) {
  const n = parseFloat(rands.replace(/,/g, ''))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100)
}

export function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function listToLines(list: string[] | null | undefined): string {
  return (list ?? []).join('\n')
}

export function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? [], null, 2)
  } catch {
    return '[]'
  }
}

export function parseJsonArray(text: string, label: string): unknown[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  const parsed = JSON.parse(trimmed) as unknown
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON array`)
  }
  return parsed
}

export function getAdminMeta(tour: Tour): TourAdminMeta {
  const raw = (tour as Tour & { admin_meta?: TourAdminMeta }).admin_meta
  return raw && typeof raw === 'object' ? raw : {}
}

export function mergeAdminMeta(
  tour: Tour,
  patch: Partial<TourAdminMeta>
): TourAdminMeta {
  return { ...getAdminMeta(tour), ...patch }
}

export const inputClass =
  'mt-1 w-full min-h-11 rounded-lg border border-brand-cream-dark bg-white px-3 text-brand-green'

export const cardClass =
  'bg-brand-cream border border-brand-cream-dark rounded-xl p-4 space-y-3 shadow-sm'

export const labelClass = 'text-sm block text-brand-green'

export const QUOTE_STATUSES = [
  'draft',
  'sent',
  'accepted',
  'awaiting_payment',
  'confirmed',
  'expired',
  'cancelled',
] as const

export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

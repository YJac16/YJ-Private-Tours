/**
 * Public marketing/booking price labels (ZAR authoritative). Admin/receipts use formatZar in pricing.ts.
 */

export function formatPublicZarAmount(cents: number): string {
  const rands = Math.round(Number(cents) / 100)
  if (!Number.isFinite(rands)) return 'ZAR 0'
  return `ZAR ${rands.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function formatPublicFromLabel(cents: number, prefix = 'From'): string {
  return `${prefix} ${formatPublicZarAmount(cents)}`
}

export function formatPublicFromOneGuest(cents: number): string {
  return `${formatPublicFromLabel(cents)} (1 guest, private vehicle included)`
}

export function formatPublicPayLabel(cents: number): string {
  return `Pay ${formatPublicZarAmount(cents)}`
}

export function formatPublicPerPersonLabel(cents: number): string {
  return `${formatPublicZarAmount(cents)} per person`
}

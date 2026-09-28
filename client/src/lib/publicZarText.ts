/**
 * Public marketing/crawler price text (ZAR label). No FX. Admin/receipts use formatZar (R…) in pricing.ts.
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

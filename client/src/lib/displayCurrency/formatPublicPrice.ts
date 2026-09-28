/**
 * Public marketing/booking price labels (re-export shared ZAR text + pay helpers).
 */
import {
  formatPublicFromLabel,
  formatPublicFromOneGuest,
  formatPublicZarAmount,
} from '../publicZarText'

export {
  formatPublicFromLabel,
  formatPublicFromOneGuest,
  formatPublicZarAmount,
}

export function formatPublicPayLabel(cents: number): string {
  return `Pay ${formatPublicZarAmount(cents)}`
}

export function formatPublicPerPersonLabel(cents: number): string {
  return `${formatPublicZarAmount(cents)} per person`
}

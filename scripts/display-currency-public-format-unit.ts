/**
 * Public ZAR label formatter (comma thousands, ZAR prefix).
 */
import assert from 'node:assert/strict'
import {
  formatPublicFromLabel,
  formatPublicPayLabel,
  formatPublicZarAmount,
} from '../client/src/lib/displayCurrency/formatPublicPrice.ts'
import { formatZar } from '../client/src/lib/pricing.ts'

function main() {
  assert.equal(formatPublicZarAmount(290_000), 'ZAR 2,900')
  assert.equal(formatPublicFromLabel(290_000), 'From ZAR 2,900')
  assert.equal(formatPublicPayLabel(290_000), 'Pay ZAR 2,900')
  assert.equal(formatZar(290_000), 'R2,900')
  console.log('display-currency-public-format-unit: ok')
}

main()

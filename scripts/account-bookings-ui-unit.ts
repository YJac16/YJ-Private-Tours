/**
 * Account page bookings list UI: error vs empty state.
 * Run: npx tsx scripts/account-bookings-ui-unit.ts
 */
import assert from 'node:assert/strict'

function bookingsSectionMessage(input: {
  loading: boolean
  bookingsError: string | null
  count: number
}): 'loading' | 'error' | 'empty' | 'list' {
  if (input.loading) return 'loading'
  if (input.bookingsError) return 'error'
  if (input.count === 0) return 'empty'
  return 'list'
}

assert.equal(
  bookingsSectionMessage({
    loading: false,
    bookingsError: 'Forbidden',
    count: 0,
  }),
  'error'
)

assert.equal(
  bookingsSectionMessage({
    loading: false,
    bookingsError: null,
    count: 2,
  }),
  'list'
)

assert.equal(
  bookingsSectionMessage({
    loading: false,
    bookingsError: null,
    count: 0,
  }),
  'empty'
)

console.log('account-bookings-ui-unit: ok')

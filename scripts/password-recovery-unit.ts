/**
 * Password recovery routing: a reset link must land on /reset-password,
 * not a signed-in account page.
 * Run: npx tsx scripts/password-recovery-unit.ts
 */
import assert from 'node:assert/strict'
import {
  destinationAfterAuthCallback,
  safeNextPath,
  shouldRedirectToResetPassword,
  urlIndicatesPasswordRecovery,
} from '../client/src/lib/passwordRecovery'

let passed = 0
let failed = 0

function check(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
    passed += 1
  } catch (e) {
    console.error(`FAIL ${name}`)
    console.error(e)
    failed += 1
  }
}

check('safe next rejects off-site paths', () => {
  assert.equal(safeNextPath(null), '/account')
  assert.equal(safeNextPath('//evil.example'), '/account')
  assert.equal(safeNextPath('https://evil.example'), '/account')
  assert.equal(safeNextPath('/reset-password'), '/reset-password')
})

check('recovery hash and next param are detected', () => {
  assert.equal(
    urlIndicatesPasswordRecovery(
      'https://khayrcapeexperiences.com/#access_token=abc&type=recovery'
    ),
    true
  )
  assert.equal(
    urlIndicatesPasswordRecovery(
      'https://khayrcapeexperiences.com/auth/callback?next=%2Freset-password&code=abc'
    ),
    true
  )
  assert.equal(
    urlIndicatesPasswordRecovery(
      'https://khayrcapeexperiences.com/auth/callback?type=recovery&token_hash=abc'
    ),
    true
  )
  assert.equal(
    urlIndicatesPasswordRecovery(
      'https://khayrcapeexperiences.com/auth/callback?code=signup'
    ),
    false
  )
})

check('missing next on a recovery callback still opens the reset form', () => {
  assert.equal(
    destinationAfterAuthCallback({
      next: null,
      hashType: 'recovery',
      queryType: null,
      recoveryPending: false,
    }),
    '/reset-password'
  )
  assert.equal(
    destinationAfterAuthCallback({
      next: null,
      hashType: null,
      queryType: 'recovery',
      recoveryPending: false,
    }),
    '/reset-password'
  )
  assert.equal(
    destinationAfterAuthCallback({
      next: null,
      hashType: null,
      queryType: null,
      recoveryPending: true,
    }),
    '/reset-password'
  )
})

check('email confirmation still continues to the requested page', () => {
  assert.equal(
    destinationAfterAuthCallback({
      next: null,
      hashType: 'signup',
      queryType: null,
      recoveryPending: false,
    }),
    '/account'
  )
  assert.equal(
    destinationAfterAuthCallback({
      next: '/account/bookings/1',
      hashType: null,
      queryType: 'signup',
      recoveryPending: false,
    }),
    '/account/bookings/1'
  )
})

check('recovery session cannot wander into the app', () => {
  assert.equal(
    shouldRedirectToResetPassword(
      '/account',
      true,
      'https://khayrcapeexperiences.com/account',
      true
    ),
    true
  )
  assert.equal(
    shouldRedirectToResetPassword(
      '/admin/pricing',
      true,
      'https://khayrcapeexperiences.com/admin/pricing',
      true
    ),
    true
  )
  assert.equal(
    shouldRedirectToResetPassword(
      '/',
      true,
      'https://khayrcapeexperiences.com/#access_token=abc&type=recovery',
      true
    ),
    false
  )
  assert.equal(
    shouldRedirectToResetPassword(
      '/reset-password',
      true,
      'https://khayrcapeexperiences.com/reset-password',
      true
    ),
    false
  )
  assert.equal(
    shouldRedirectToResetPassword(
      '/auth/callback',
      true,
      'https://khayrcapeexperiences.com/auth/callback?code=abc',
      true
    ),
    false
  )
  assert.equal(
    shouldRedirectToResetPassword(
      '/account',
      false,
      'https://khayrcapeexperiences.com/account',
      true
    ),
    false
  )
  assert.equal(
    shouldRedirectToResetPassword(
      '/account',
      true,
      'https://khayrcapeexperiences.com/account',
      false
    ),
    false
  )
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)

const RECOVERY_KEY = 'kc_password_recovery'

export const PASSWORD_RECOVERY_EVENT = 'kc-password-recovery'

let capturedThisLoad = false
let eventThisLoad = false

/** True when this page load is itself a recovery callback, not a leftover flag. */
export function passwordRecoveryStartedThisLoad(): boolean {
  return capturedThisLoad || eventThisLoad
}

function notifyRecoveryChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PASSWORD_RECOVERY_EVENT))
}

export function markPasswordRecoveryPending(): void {
  try {
    sessionStorage.setItem(RECOVERY_KEY, '1')
  } catch {
    /* private mode / unavailable storage */
  }
  notifyRecoveryChange()
}

export function notePasswordRecoveryEvent(): void {
  eventThisLoad = true
  markPasswordRecoveryPending()
}

export function clearPasswordRecoveryPending(): void {
  try {
    sessionStorage.removeItem(RECOVERY_KEY)
  } catch {
    /* ignore */
  }
  notifyRecoveryChange()
}

export function isPasswordRecoveryPending(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_KEY) === '1'
  } catch {
    return false
  }
}

/** Same-origin relative paths only — blocks open redirects. */
export function safeNextPath(raw: string | null): string {
  if (!raw) return '/account'
  let value = raw
  try {
    value = decodeURIComponent(raw)
  } catch {
    value = raw
  }
  if (!value.startsWith('/') || value.startsWith('//')) return '/account'
  return value
}

export function urlIndicatesPasswordRecovery(href: string): boolean {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return false
  }
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  const type = hash.get('type') || url.searchParams.get('type')
  if (type === 'recovery') return true
  const next = url.searchParams.get('next')
  return Boolean(next && safeNextPath(next).startsWith('/reset-password'))
}

/**
 * Record a recovery redirect before the Supabase client strips tokens from the URL.
 * Returns true when this page load is a password-recovery callback.
 */
export function capturePasswordRecoveryFromLocation(href?: string): boolean {
  const current =
    href ?? (typeof window !== 'undefined' ? window.location.href : '')
  if (!current || !urlIndicatesPasswordRecovery(current)) return false
  capturedThisLoad = true
  markPasswordRecoveryPending()
  return true
}

export function locationStillHasAuthParams(href: string): boolean {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return false
  }
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  if (
    hash.get('access_token') ||
    hash.get('refresh_token') ||
    hash.get('error') ||
    hash.get('error_description')
  ) {
    return true
  }
  if (url.searchParams.get('code') || url.searchParams.get('token_hash')) {
    return true
  }
  return false
}

export function destinationAfterAuthCallback(input: {
  next: string | null
  hashType: string | null
  queryType: string | null
  recoveryPending: boolean
}): string {
  const next = safeNextPath(input.next)
  const recovery =
    next.startsWith('/reset-password') ||
    input.hashType === 'recovery' ||
    input.queryType === 'recovery' ||
    input.recoveryPending
  return recovery ? '/reset-password' : next
}

/** Keep the visitor on the reset form until they save a new password. */
export function shouldRedirectToResetPassword(
  pathname: string,
  recoveryPending: boolean,
  href: string,
  hasUser: boolean
): boolean {
  if (!recoveryPending || !hasUser) return false
  if (pathname === '/reset-password' || pathname === '/auth/callback') return false
  if (locationStillHasAuthParams(href)) return false
  return true
}

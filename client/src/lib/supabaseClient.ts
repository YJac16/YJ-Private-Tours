import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  capturePasswordRecoveryFromLocation,
  clearPasswordRecoveryPending,
  markPasswordRecoveryPending,
  notePasswordRecoveryEvent,
} from './passwordRecovery'

const viteEnv = import.meta.env ?? ({} as ImportMetaEnv)
const url = viteEnv.VITE_SUPABASE_URL || ''
const anon = viteEnv.VITE_SUPABASE_ANON_KEY || ''

export const supabaseConfigured = Boolean(url && anon)

if (typeof window !== 'undefined') {
  capturePasswordRecoveryFromLocation(window.location.href)
}

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

if (supabase && typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') notePasswordRecoveryEvent()
  })
}

let authUrlReady: Promise<void> | null = null

/** Finish token-hash recovery before pages decide the user is signed in. */
export function whenAuthUrlReady(): Promise<void> {
  if (!supabase || typeof window === 'undefined') return Promise.resolve()
  if (!authUrlReady) {
    authUrlReady = (async () => {
      const url = new URL(window.location.href)
      const tokenHash = url.searchParams.get('token_hash')
      const type = url.searchParams.get('type')
      if (!tokenHash || type !== 'recovery') return
      markPasswordRecoveryPending()
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      })
      url.searchParams.delete('token_hash')
      url.searchParams.delete('type')
      const search = url.searchParams.toString()
      const next = url.pathname + (search ? `?${search}` : '') + url.hash
      window.history.replaceState(window.history.state, '', next)
      if (error) clearPasswordRecoveryPending()
    })()
  }
  return authUrlReady
}

void whenAuthUrlReady()

/** Local demo tokens when Supabase env is missing (dev / mock). */
export function buildMockAccessToken(
  role: 'client' | 'driver' | 'admin',
  userId: string,
  email: string
) {
  return `mock.${role}.${userId}.${encodeURIComponent(email)}`
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const viteEnv = import.meta.env ?? ({} as ImportMetaEnv)
const url = viteEnv.VITE_SUPABASE_URL || ''
const anon = viteEnv.VITE_SUPABASE_ANON_KEY || ''

export const supabaseConfigured = Boolean(url && anon)

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** Local demo tokens when Supabase env is missing (dev / mock). */
export function buildMockAccessToken(
  role: 'client' | 'driver' | 'admin',
  userId: string,
  email: string
) {
  return `mock.${role}.${userId}.${encodeURIComponent(email)}`
}

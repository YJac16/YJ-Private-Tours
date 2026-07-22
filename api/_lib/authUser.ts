import type { VercelRequest } from '@vercel/node'
import { createClient, type User } from '@supabase/supabase-js'
import { useMockStore } from '../../booking-app/lib/mock-store'

export type UserRole = 'client' | 'driver' | 'admin'

export type AuthContext = {
  user: { id: string; email?: string | null }
  role: UserRole
  profile: {
    id: string
    role: UserRole
    full_name: string | null
    phone: string | null
    email: string | null
  }
  accessToken: string
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

function bearerToken(req: VercelRequest): string | null {
  const h = req.headers.authorization
  if (!h || Array.isArray(h)) return null
  if (!h.startsWith('Bearer ')) return null
  return h.slice(7).trim() || null
}

/** Decode local mock tokens: mock.<role>.<userId>.<email> */
function parseMockToken(token: string): AuthContext | null {
  if (!token.startsWith('mock.')) return null
  const parts = token.split('.')
  if (parts.length < 4) return null
  const role = parts[1] as UserRole
  if (!['client', 'driver', 'admin'].includes(role)) return null
  const id = parts[2]
  const email = decodeURIComponent(parts.slice(3).join('.'))
  return {
    user: { id, email },
    role,
    profile: {
      id,
      role,
      full_name: email.split('@')[0] || 'User',
      phone: null,
      email,
    },
    accessToken: token,
  }
}

export async function getAuthContext(
  req: VercelRequest
): Promise<AuthContext | null> {
  const token = bearerToken(req)
  if (!token) return null

  if (useMockStore()) {
    const mock = parseMockToken(token)
    if (mock) return mock
  }

  try {
    const sb = supabaseAdmin()
    const { data, error } = await sb.auth.getUser(token)
    if (error || !data.user) return null
    const user = data.user as User
    const { data: profile } = await sb
      .from('profiles')
      .select('id, role, full_name, phone, email')
      .eq('id', user.id)
      .maybeSingle()

    const role = (profile?.role as UserRole) || 'client'
    return {
      user: { id: user.id, email: user.email },
      role,
      profile: {
        id: user.id,
        role,
        full_name: profile?.full_name ?? null,
        phone: profile?.phone ?? null,
        email: profile?.email ?? user.email ?? null,
      },
      accessToken: token,
    }
  } catch {
    return null
  }
}

export async function requireAuth(
  req: VercelRequest,
  roles?: UserRole[]
): Promise<AuthContext | { error: string; status: number }> {
  const ctx = await getAuthContext(req)
  if (!ctx) return { error: 'Unauthorized', status: 401 }
  if (roles && !roles.includes(ctx.role)) {
    return { error: 'Forbidden', status: 403 }
  }
  return ctx
}

export function isAuthError(
  v: AuthContext | { error: string; status: number }
): v is { error: string; status: number } {
  return 'error' in v && 'status' in v
}

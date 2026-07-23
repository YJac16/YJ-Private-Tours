import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  buildMockAccessToken,
  supabase,
  supabaseConfigured,
} from './supabaseClient'

export type UserRole = 'client' | 'driver' | 'admin'

export type Profile = {
  id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  email: string | null
}

type AuthState = {
  loading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  accessToken: string | null
  role: UserRole | null
  supabaseConfigured: boolean
  signIn: (email: string, password: string) => Promise<UserRole>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (patch: {
    full_name?: string
    phone?: string | null
    email?: string | null
  }) => Promise<void>
  /** Dev-only when Supabase is not configured */
  mockSignIn: (role: UserRole, email?: string) => Promise<UserRole>
}

const AuthContext = createContext<AuthState | null>(null)

const MOCK_KEY = 'yj_mock_auth'

type MockStored = {
  role: UserRole
  id: string
  email: string
  full_name: string
  phone: string | null
}

function readMock(): MockStored | null {
  try {
    const raw = sessionStorage.getItem(MOCK_KEY)
    return raw ? (JSON.parse(raw) as MockStored) : null
  } catch {
    return null
  }
}

function writeMock(v: MockStored | null) {
  if (!v) sessionStorage.removeItem(MOCK_KEY)
  else sessionStorage.setItem(MOCK_KEY, JSON.stringify(v))
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone, email')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return null
  return {
    id: data.id,
    role: (data.role as UserRole) || 'client',
    full_name: data.full_name,
    phone: data.phone,
    email: data.email,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const applyMock = useCallback((m: MockStored | null) => {
    if (!m) {
      setSession(null)
      setUser(null)
      setProfile(null)
      setAccessToken(null)
      return
    }
    const token = buildMockAccessToken(m.role, m.id, m.email)
    setAccessToken(token)
    setUser({ id: m.id, email: m.email } as User)
    setSession({ access_token: token } as Session)
    setProfile({
      id: m.id,
      role: m.role,
      full_name: m.full_name,
      phone: m.phone,
      email: m.email,
    })
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!supabaseConfigured || !user) return
    const p = await fetchProfile(user.id)
    setProfile(p)
  }, [user])

  const updateProfile = useCallback(
    async (patch: {
      full_name?: string
      phone?: string | null
      email?: string | null
    }) => {
      if (supabaseConfigured && supabase && user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...(patch.full_name !== undefined
              ? { full_name: patch.full_name }
              : {}),
            ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
            ...(patch.email !== undefined ? { email: patch.email } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
        if (error) throw error
        const p = await fetchProfile(user.id)
        setProfile(p)
        return
      }
      const m = readMock()
      if (!m) throw new Error('Not signed in')
      const next: MockStored = {
        ...m,
        full_name: patch.full_name ?? m.full_name,
        phone: patch.phone !== undefined ? patch.phone : m.phone,
        email: patch.email ?? m.email,
      }
      writeMock(next)
      applyMock(next)
    },
    [user, applyMock]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!supabaseConfigured || !supabase) {
        applyMock(readMock())
        if (!cancelled) setLoading(false)
        return
      }
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setAccessToken(data.session?.access_token ?? null)
      if (data.session?.user) {
        const p = await fetchProfile(data.session.user.id)
        if (!cancelled) setProfile(p)
      }
      if (!cancelled) setLoading(false)
    })()

    if (!supabase) return () => {
      cancelled = true
    }

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next)
      setUser(next?.user ?? null)
      setAccessToken(next?.access_token ?? null)
      if (next?.user) {
        const p = await fetchProfile(next.user.id)
        setProfile(p)
      } else {
        setProfile(null)
      }
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [applyMock])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    const authed = data.user
    if (!authed) throw new Error('Sign in failed')
    setSession(data.session)
    setUser(authed)
    setAccessToken(data.session?.access_token ?? null)
    const p = await fetchProfile(authed.id)
    setProfile(p)
    return p?.role ?? 'client'
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) throw error
    },
    []
  )

  const signOut = useCallback(async () => {
    writeMock(null)
    applyMock(null)
    if (supabase) await supabase.auth.signOut()
  }, [applyMock])

  const mockSignIn = useCallback(
    async (role: UserRole, email = `${role}@demo.local`) => {
      const stored: MockStored = {
        role,
        id: `00000000-0000-4000-8000-${role.padEnd(12, '0').slice(0, 12)}`,
        email,
        full_name:
          role === 'admin' ? 'Admin' : role === 'driver' ? 'Driver' : 'Guest Client',
        phone: null,
      }
      writeMock(stored)
      applyMock(stored)
      return role
    },
    [applyMock]
  )

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      user,
      profile,
      accessToken,
      role: profile?.role ?? null,
      supabaseConfigured,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
      mockSignIn,
    }),
    [
      loading,
      session,
      user,
      profile,
      accessToken,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
      mockSignIn,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook co-located with provider; allow non-component export for Fast Refresh.
// eslint-disable-next-line react-refresh/only-export-components -- useAuth is the public API for AuthProvider
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

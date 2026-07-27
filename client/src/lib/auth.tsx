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
  emailConfirmed: boolean
  supabaseConfigured: boolean
  signIn: (email: string, password: string) => Promise<UserRole>
  /** Returns whether a session was created immediately (false when email confirm is required). */
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ sessionCreated: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  resendEmailConfirmation: (email?: string) => Promise<void>
  updateProfile: (patch: {
    full_name?: string
    phone?: string | null
    email?: string | null
  }) => Promise<{ emailChangePending?: boolean }>
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

function authCallbackUrl(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/auth/callback`
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

function roleFromUser(user: User | null | undefined): UserRole {
  const meta = (user?.app_metadata?.role ||
    user?.user_metadata?.role) as string | undefined
  if (meta === 'admin' || meta === 'driver' || meta === 'client') return meta
  return 'client'
}

function isEmailConfirmed(user: User | null | undefined): boolean {
  if (!user) return false
  return Boolean(user.email_confirmed_at)
}

function profileFromUser(user: User): Profile {
  return {
    id: user.id,
    role: roleFromUser(user),
    full_name:
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      null,
    phone: (user.user_metadata?.phone as string | undefined) || null,
    email: user.email ?? null,
  }
}

async function fetchProfile(user: User): Promise<Profile> {
  if (!supabase) return profileFromUser(user)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone, email')
    .eq('id', user.id)
    .maybeSingle()
  if (error) {
    console.warn('fetchProfile failed', error.message)
    return profileFromUser(user)
  }
  if (!data) return profileFromUser(user)
  return {
    id: data.id,
    role: (data.role as UserRole) || roleFromUser(user),
    full_name: data.full_name,
    phone: data.phone,
    // Prefer Auth email as source of truth for login identity
    email: user.email ?? data.email,
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
    setUser({
      id: m.id,
      email: m.email,
      email_confirmed_at: new Date().toISOString(),
    } as User)
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
    const p = await fetchProfile(user)
    setProfile(p)
  }, [user])

  const resendEmailConfirmation = useCallback(async (email?: string) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const target = (email || user?.email || '').trim()
    if (!target) throw new Error('No email to confirm')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: target,
      options: { emailRedirectTo: authCallbackUrl() },
    })
    if (error) throw error
  }, [user])

  const updateProfile = useCallback(
    async (patch: {
      full_name?: string
      phone?: string | null
      email?: string | null
    }) => {
      if (supabaseConfigured && supabase && user) {
        let emailChangePending = false
        const nextEmail = patch.email?.trim()
        const currentAuthEmail = (user.email || '').toLowerCase()

        if (nextEmail && nextEmail.toLowerCase() !== currentAuthEmail) {
          const { error: authEmailError } = await supabase.auth.updateUser(
            { email: nextEmail },
            { emailRedirectTo: authCallbackUrl() }
          )
          if (authEmailError) throw authEmailError
          emailChangePending = true
        }

        const profilePatch: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        }
        if (patch.full_name !== undefined) profilePatch.full_name = patch.full_name
        if (patch.phone !== undefined) profilePatch.phone = patch.phone
        // Only sync profiles.email when it matches Auth (no pending change)
        if (nextEmail && !emailChangePending) {
          profilePatch.email = nextEmail
        }

        const { error } = await supabase
          .from('profiles')
          .update(profilePatch)
          .eq('id', user.id)
        if (error) throw error

        const { data: refreshed } = await supabase.auth.getUser()
        if (refreshed.user) {
          setUser(refreshed.user)
          const p = await fetchProfile(refreshed.user)
          setProfile(p)
        } else {
          const p = await fetchProfile(user)
          setProfile(p)
        }
        return { emailChangePending }
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
      return {}
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
        const p = await fetchProfile(data.session.user)
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
        const p = await fetchProfile(next.user)
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
    const p = await fetchProfile(authed)
    setProfile(p)
    return p.role
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: authCallbackUrl(),
        },
      })
      if (error) throw error
      return { sessionCreated: Boolean(data.session) }
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

  const emailConfirmed = supabaseConfigured
    ? isEmailConfirmed(user)
    : Boolean(user)

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      user,
      profile,
      accessToken,
      role: profile?.role ?? (user ? 'client' : null),
      emailConfirmed,
      supabaseConfigured,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      resendEmailConfirmation,
      updateProfile,
      mockSignIn,
    }),
    [
      loading,
      session,
      user,
      profile,
      accessToken,
      emailConfirmed,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      resendEmailConfirmation,
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

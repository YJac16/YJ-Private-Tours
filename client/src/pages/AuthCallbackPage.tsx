import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase, supabaseConfigured } from '../lib/supabaseClient'

/** Same-origin relative paths only — blocks open redirects. */
function safeNextPath(raw: string | null): string {
  if (!raw) return '/account'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/account'
  return raw
}

/**
 * Handles Supabase email confirmation / email-change redirects.
 * Supports PKCE `?code=` and hash tokens (`detectSessionInUrl`).
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Confirming your email…')

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!supabaseConfigured || !supabase) {
        setError('Supabase is not configured.')
        return
      }

      try {
        const url = new URL(window.location.href)
        const next = safeNextPath(url.searchParams.get('next'))
        const code = url.searchParams.get('code')
        const hashError = new URLSearchParams(url.hash.replace(/^#/, '')).get(
          'error_description'
        )

        if (hashError) {
          throw new Error(decodeURIComponent(hashError.replace(/\+/g, ' ')))
        }

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        } else {
          // Hash / cookie session may already be established by detectSessionInUrl
          const { data, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) throw sessionError
          if (!data.session) {
            throw new Error(
              'No confirmation session found. The link may have expired — try signing in or resending confirmation.'
            )
          }
        }

        // Sync profiles.email to Auth email after confirm / email change
        const { data: userData } = await supabase.auth.getUser()
        const authed = userData.user
        if (authed?.email) {
          await supabase
            .from('profiles')
            .update({
              email: authed.email,
              updated_at: new Date().toISOString(),
            })
            .eq('id', authed.id)
        }

        if (cancelled) return
        setStatus('Email confirmed. Redirecting…')
        navigate(next, { replace: true })
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Email confirmation failed')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-brand-cream-light px-4 py-12">
        <div className="max-w-md mx-auto bg-brand-cream border border-brand-cream-dark rounded-2xl p-6 sm:p-8 shadow-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold text-brand-green">Email confirmation</h1>
          {error ? (
            <>
              <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
              <p className="text-sm text-brand-green/80">
                <Link to="/login" className="underline font-medium">
                  Sign in
                </Link>
                {' · '}
                <Link to="/account" className="underline font-medium">
                  My account
                </Link>
              </p>
            </>
          ) : (
            <p className="text-sm text-brand-green/80">{status}</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

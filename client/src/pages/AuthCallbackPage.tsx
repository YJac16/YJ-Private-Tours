import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase, supabaseConfigured, whenAuthUrlReady } from '../lib/supabaseClient'
import {
  destinationAfterAuthCallback,
  isPasswordRecoveryPending,
} from '../lib/passwordRecovery'

/**
 * Handles Supabase email confirmation, email-change, and password-recovery redirects.
 * Supports PKCE `?code=` and hash tokens (`detectSessionInUrl`).
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Confirming your email…')
  const [title, setTitle] = useState('Email confirmation')

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!supabaseConfigured || !supabase) {
        setError('Supabase is not configured.')
        return
      }

      try {
        const url = new URL(window.location.href)
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
        const hashError = hashParams.get('error_description')
        const hashType = hashParams.get('type')
        const queryType = url.searchParams.get('type')
        const looksLikeRecovery =
          hashType === 'recovery' ||
          queryType === 'recovery' ||
          isPasswordRecoveryPending()
        if (looksLikeRecovery) {
          setTitle('Password reset')
          setStatus('Verifying reset link…')
        }

        const code = url.searchParams.get('code')

        if (hashError) {
          throw new Error(decodeURIComponent(hashError.replace(/\+/g, ' ')))
        }

        await whenAuthUrlReady()
        if (cancelled) return

        if (code) {
          // detectSessionInUrl may already have exchanged this code.
          const { data: existing, error: existingError } =
            await supabase.auth.getSession()
          if (existingError) throw existingError
          if (!existing.session) {
            const { error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code)
            if (exchangeError) throw exchangeError
          }
        } else {
          // Hash / cookie session may already be established by detectSessionInUrl
          const { data, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) throw sessionError
          if (!data.session) {
            throw new Error(
              looksLikeRecovery
                ? 'No reset session found. The link may have expired — request a new password reset.'
                : 'No confirmation session found. The link may have expired — try signing in or resending confirmation.'
            )
          }
        }

        // PASSWORD_RECOVERY is emitted on a timer after the URL session is saved.
        await new Promise((resolve) => window.setTimeout(resolve, 0))
        if (cancelled) return

        const next = destinationAfterAuthCallback({
          next: url.searchParams.get('next'),
          hashType,
          queryType,
          recoveryPending: isPasswordRecoveryPending(),
        })
        const isRecovery = next === '/reset-password'

        // Sync profiles.email to Auth email after confirm / email change
        const { data: userData } = await supabase.auth.getUser()
        const authed = userData.user
        if (authed?.email && !isRecovery) {
          await supabase
            .from('profiles')
            .update({
              email: authed.email,
              updated_at: new Date().toISOString(),
            })
            .eq('id', authed.id)
        }

        if (cancelled) return
        setStatus(
          isRecovery
            ? 'Link verified. Choose a new password…'
            : 'Email confirmed. Redirecting…'
        )
        navigate(next, { replace: true })
      } catch (e) {
        if (cancelled) return
        setError(
          e instanceof Error ? e.message : 'Email confirmation failed'
        )
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
          <h1 className="text-2xl font-bold text-brand-green">{title}</h1>
          {error ? (
            <>
              <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
              <p className="text-sm text-brand-green/80">
                <Link to="/forgot-password" className="underline font-medium">
                  Reset password
                </Link>
                {' · '}
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

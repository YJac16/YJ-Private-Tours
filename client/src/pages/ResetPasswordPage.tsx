import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PasswordField from '../components/PasswordField'
import { useAuth, type UserRole } from '../lib/auth'

function hubForRole(role: UserRole | null) {
  if (role === 'admin') return '/admin/pricing'
  if (role === 'driver') return '/driver'
  return '/account'
}

export default function ResetPasswordPage() {
  const {
    user,
    role,
    loading,
    updatePassword,
    signOut,
    supabaseConfigured,
    passwordRecoveryPending,
  } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const linkMissing = !loading && supabaseConfigured && !user

  useEffect(() => {
    if (!done || passwordRecoveryPending) return
    const id = window.setTimeout(
      () => navigate(hubForRole(role), { replace: true }),
      900
    )
    return () => window.clearTimeout(id)
  }, [done, passwordRecoveryPending, navigate, role])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await updatePassword(password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-brand-cream-light px-4 py-12">
        <form
          onSubmit={onSubmit}
          className="max-w-md mx-auto bg-brand-cream border border-brand-cream-dark rounded-2xl p-6 sm:p-8 shadow-sm space-y-4"
        >
          <h1 className="text-2xl font-bold text-brand-green text-center">
            Choose a new password
          </h1>
          <p className="text-sm text-brand-green/80 text-center">
            Save a new password here before continuing. The reset link does not
            sign you into the rest of the site until this is done.
          </p>
          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {linkMissing && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Reset link expired or missing. Request a new password reset email.
            </p>
          )}
          {done ? (
            <p className="text-sm text-brand-green text-center">
              Password updated. Taking you to your account…
            </p>
          ) : (
            <>
              <PasswordField
                label="New password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                required
                minLength={8}
              />
              <PasswordField
                label="Confirm password"
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="submit"
                disabled={busy || !user || !supabaseConfigured}
                className="w-full min-h-12 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Update password'}
              </button>
            </>
          )}
          <p className="text-sm text-center text-brand-green/80">
            {user ? (
              <button
                type="button"
                className="underline font-medium"
                onClick={() => {
                  void signOut().then(() =>
                    navigate('/forgot-password', { replace: true })
                  )
                }}
              >
                Request a new reset link
              </button>
            ) : (
              <Link to="/forgot-password" className="underline font-medium">
                Request a new reset link
              </Link>
            )}
            {' · '}
            {user ? (
              <button
                type="button"
                className="underline font-medium"
                onClick={() => {
                  void signOut().then(() => navigate('/login', { replace: true }))
                }}
              >
                Sign out
              </button>
            ) : (
              <Link to="/login" className="underline font-medium">
                Sign in
              </Link>
            )}
          </p>
        </form>
      </main>
      <Footer />
    </>
  )
}

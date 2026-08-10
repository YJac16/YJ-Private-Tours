import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../lib/auth'

export default function ResetPasswordPage() {
  const { user, loading, updatePassword, supabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && supabaseConfigured && !user) {
      setError(
        'Reset link expired or missing. Request a new password reset email.'
      )
    }
  }, [loading, supabaseConfigured, user])

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
      window.setTimeout(() => navigate('/account', { replace: true }), 1500)
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
          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {done ? (
            <p className="text-sm text-brand-green text-center">
              Password updated. Taking you to your account…
            </p>
          ) : (
            <>
              <label className="block text-sm text-brand-green">
                New password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full min-h-12 rounded-lg border border-brand-cream-dark px-3"
                  autoComplete="new-password"
                />
              </label>
              <label className="block text-sm text-brand-green">
                Confirm password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full min-h-12 rounded-lg border border-brand-cream-dark px-3"
                  autoComplete="new-password"
                />
              </label>
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
            <Link to="/forgot-password" className="underline font-medium">
              Request a new reset link
            </Link>
            {' · '}
            <Link to="/login" className="underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </>
  )
}

import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../lib/auth'

export default function ForgotPasswordPage() {
  const { requestPasswordReset, supabaseConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email')
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
            Reset password
          </h1>
          <p className="text-sm text-brand-green/80 text-center">
            Enter your account email and we’ll send a secure link to choose a new
            password.
          </p>
          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {sent ? (
            <p className="text-sm text-brand-green bg-brand-cream-dark/30 border border-brand-cream-dark rounded-lg px-3 py-3">
              If an account exists for that email, a reset link is on its way.
              Check your inbox and spam folder.
            </p>
          ) : (
            <>
              <label className="block text-sm text-brand-green">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full min-h-12 rounded-lg border border-brand-cream-dark px-3"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !supabaseConfigured}
                className="w-full min-h-12 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-50"
              >
                {busy ? 'Sending…' : 'Send reset link'}
              </button>
              {!supabaseConfigured && (
                <p className="text-xs text-brand-green/70 text-center">
                  Password reset requires Supabase to be configured.
                </p>
              )}
            </>
          )}
          <p className="text-sm text-center text-brand-green/80">
            <Link to="/login" className="underline font-medium">
              Back to sign in
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </>
  )
}

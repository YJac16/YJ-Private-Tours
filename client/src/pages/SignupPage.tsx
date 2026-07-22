import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../lib/auth'

export default function SignupPage() {
  const { signUp, supabaseConfigured, user, loading } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    return <Navigate to="/account" replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      if (!supabaseConfigured) {
        throw new Error(
          'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
        )
      }
      await signUp(email.trim(), password, fullName.trim())
      setMessage(
        'Account created. Check your email if confirmation is required, then sign in.'
      )
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
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
            Create account
          </h1>
          <p className="text-sm text-brand-green/80 text-center">
            Sign up as a guest to manage your bookings. Drivers and admins are
            invited by Khayr Cape Experiences.
          </p>
          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {message}
            </p>
          )}
          <label className="block text-sm text-brand-green">
            Full name
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-lg border border-brand-cream-dark px-3"
            />
          </label>
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
          <label className="block text-sm text-brand-green">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-lg border border-brand-cream-dark px-3"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-12 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Sign up'}
          </button>
          <p className="text-sm text-center text-brand-green/80">
            Already have an account?{' '}
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

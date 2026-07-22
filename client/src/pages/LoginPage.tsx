import { type FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const { signIn, mockSignIn, supabaseConfigured, user, role, loading } =
    useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    const dest =
      role === 'admin'
        ? '/admin/pricing'
        : role === 'driver'
          ? '/driver'
          : from.startsWith('/login')
            ? '/account'
            : from
    return <Navigate to={dest} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      navigate(from.startsWith('/login') ? '/account' : from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
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
            Sign in
          </h1>
          <p className="text-sm text-brand-green/80 text-center">
            Clients, drivers, and admins use the same sign-in. Your role opens
            the right portal.
          </p>
          {error && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-lg border border-brand-cream-dark px-3"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !supabaseConfigured}
            className="w-full min-h-12 rounded-lg bg-brand-green text-brand-cream font-semibold disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          {!supabaseConfigured && (
            <div className="space-y-2 border-t border-brand-cream-dark pt-4">
              <p className="text-xs text-brand-green/70 text-center">
                Supabase env not set — use demo sign-in for local testing.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['client', 'driver', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={async () => {
                      await mockSignIn(r)
                      navigate(
                        r === 'admin'
                          ? '/admin/pricing'
                          : r === 'driver'
                            ? '/driver'
                            : '/account',
                        { replace: true }
                      )
                    }}
                    className="text-xs min-h-11 rounded-lg border border-brand-gold text-brand-green hover:bg-brand-gold/10 capitalize"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-sm text-center text-brand-green/80">
            New here?{' '}
            <Link to="/signup" className="underline font-medium">
              Create an account
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </>
  )
}

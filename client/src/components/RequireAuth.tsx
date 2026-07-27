import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from '../lib/auth'

function hubForRole(role: UserRole) {
  if (role === 'admin') return '/admin/pricing'
  if (role === 'driver') return '/driver'
  return '/account'
}

export function RequireAuth({
  roles,
  children,
}: {
  roles?: UserRole[]
  children: React.ReactNode
}) {
  const { loading, user, role, signOut } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-brand-cream-light text-brand-green">
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  if (!role) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 bg-brand-cream-light text-brand-green px-4">
        <p className="text-center max-w-md">
          Could not load your profile. Sign out and try again, or contact
          support if this continues.
        </p>
        <button
          type="button"
          onClick={() => signOut()}
          className="min-h-11 px-5 rounded-lg bg-brand-green text-brand-cream font-semibold"
        >
          Sign out
        </button>
      </div>
    )
  }

  if (roles && !roles.includes(role)) {
    const fallback = hubForRole(role)
    if (fallback === location.pathname) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 bg-brand-cream-light text-brand-green px-4">
          <p className="text-center">You do not have access to this page.</p>
          <button
            type="button"
            onClick={() => signOut()}
            className="min-h-11 px-5 rounded-lg bg-brand-green text-brand-cream font-semibold"
          >
            Sign out
          </button>
        </div>
      )
    }
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}

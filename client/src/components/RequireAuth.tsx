import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from '../lib/auth'

export function RequireAuth({
  roles,
  children,
}: {
  roles?: UserRole[]
  children: React.ReactNode
}) {
  const { loading, user, role } = useAuth()
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

  if (roles && (!role || !roles.includes(role))) {
    const fallback =
      role === 'admin'
        ? '/admin/pricing'
        : role === 'driver'
          ? '/driver'
          : '/account'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}

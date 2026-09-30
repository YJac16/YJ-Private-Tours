import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { shouldRedirectToResetPassword } from '../lib/passwordRecovery'

/** A recovery link signs the user in. Hold them on the reset form until they save a password. */
export default function PasswordRecoveryGate() {
  const { passwordRecoveryPending, user } = useAuth()
  const location = useLocation()
  if (
    !shouldRedirectToResetPassword(
      location.pathname,
      passwordRecoveryPending,
      window.location.href,
      Boolean(user)
    )
  ) {
    return null
  }
  return <Navigate to="/reset-password" replace />
}

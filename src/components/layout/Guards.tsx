import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/store/authStore'

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
)

/** Signed-in AND onboarded users only. */
export function Protected() {
  const { user, profile, ready } = useAuth()
  if (!ready) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!profile?.onboarded) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

/** Signed-in users who still need to finish onboarding. */
export function NeedsOnboarding() {
  const { user, profile, ready } = useAuth()
  if (!ready) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.onboarded) return <Navigate to="/" replace />
  return <Outlet />
}

/** Login/register pages: bounce signed-in users away. */
export function PublicOnly() {
  const { user, ready } = useAuth()
  if (!ready) return <Spinner />
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

import { Navigate, Outlet, useLocation } from "react-router"

import Spinner from "../components/ui/Spinner"
import useAuth from "../hooks/useAuth"
import { fallbackPath, isEnabled } from "./navigation"

function SessionSplash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink">
      <Spinner label="Restoring session…" size={24} />
    </div>
  )
}

/** Signed-in pages. Everyone else goes to the login page. */
export function RequireAuth() {
  const { token, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <SessionSplash />
  }

  if (!token || !user) {
    return (
      <Navigate to="/login" replace state={{ from: location }} />
    )
  }

  return <Outlet />
}

/** Login and register. Signed-in users are sent on to the app. */
export function PublicOnly() {
  const { token, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <SessionSplash />
  }

  if (token && user) {
    const destination = location.state?.from?.pathname ?? "/"

    return <Navigate to={destination} replace />
  }

  return <Outlet />
}

/** A page the user can switch off in Settings. */
export function RequirePage({ preferenceKey, children }) {
  const { preferences } = useAuth()

  if (!isEnabled(preferenceKey, preferences)) {
    return <Navigate to={fallbackPath(preferences)} replace />
  }

  return children
}

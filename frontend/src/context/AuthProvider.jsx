import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import { getCurrentUser, getPreferences } from "../services/api"
import { clearWorkspaceStorage } from "../utils/workspaceStorage"
import { AuthContext } from "./auth-context"

const TOKEN_KEY = "access_token"

function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_KEY),
  )

  const [user, setUser] = useState(null)
  const [preferences, setPreferences] = useState(null)

  // With a stored token we must check it before choosing a page.
  const [loading, setLoading] = useState(Boolean(token))

  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    if (!token) {
      return undefined
    }

    let cancelled = false

    const restoreSession = async () => {
      try {
        const currentUser = await getCurrentUser(token)
        const userPreferences = await getPreferences(token)

        if (cancelled) {
          return
        }

        setUser(currentUser)
        setPreferences(userPreferences)
        setSessionExpired(false)
      } catch {
        if (cancelled) {
          return
        }

        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
        setPreferences(null)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [token])

  const endSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    clearWorkspaceStorage()

    setToken(null)
    setUser(null)
    setPreferences(null)
  }, [])

  // Raised by the API client when a request returns 401.
  useEffect(() => {
    const handleSessionExpired = () => {
      endSession()
      setSessionExpired(true)
    }

    window.addEventListener("session-expired", handleSessionExpired)

    return () => {
      window.removeEventListener(
        "session-expired",
        handleSessionExpired,
      )
    }
  }, [endSession])

  const login = useCallback((accessToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken)

    setSessionExpired(false)
    setLoading(true)
    setToken(accessToken)
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      preferences,
      setPreferences,
      loading,
      sessionExpired,
      login,
      logout: endSession,
    }),
    [
      token,
      user,
      preferences,
      loading,
      sessionExpired,
      login,
      endSession,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider

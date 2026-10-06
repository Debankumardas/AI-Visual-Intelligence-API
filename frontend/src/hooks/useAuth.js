import { useContext } from "react"

import { AuthContext } from "../context/auth-context"

function useAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error("useAuth must be used inside <AuthProvider>")
  }

  return value
}

export default useAuth

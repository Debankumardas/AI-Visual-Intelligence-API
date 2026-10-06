import { Eye, EyeOff } from "lucide-react"
import { useRef, useState } from "react"
import { Link } from "react-router"

import AuthLayout from "../components/auth/AuthLayout"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import IconButton from "../components/ui/IconButton"
import TextField from "../components/ui/TextField"
import useAuth from "../hooks/useAuth"
import useDocumentTitle from "../hooks/useDocumentTitle"
import { loginUser } from "../services/api"
import { describeAuthError } from "../utils/authErrors"

function Login() {
  useDocumentTitle("Sign in")

  const { login, sessionExpired } = useAuth()

  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError("")

    const problems = {}

    if (!email.trim()) {
      problems.email = "Enter your email address."
    }

    if (!password) {
      problems.password = "Enter your password."
    }

    setFieldErrors(problems)

    if (problems.email || problems.password) {
      ;(problems.email ? emailRef : passwordRef).current?.focus()
      return
    }

    setLoading(true)

    try {
      const data = await loginUser(email.trim(), password)

      login(data.access_token)
    } catch (requestError) {
      setError(
        describeAuthError(
          requestError,
          "Sign-in failed. Try again.",
        ),
      )
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      description="Welcome back. Sign in to open your workspace."
      footer={
        <>
          New here?{" "}
          <Link
            to="/register"
            className="font-medium text-accent underline-offset-4 hover:text-accent-hover hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {sessionExpired && (
          <Alert tone="warning">
            Your session has expired. Please log in again.
          </Alert>
        )}

        {error && (
          <Alert tone="danger" title="Couldn't sign you in">
            {error}
          </Alert>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-4 space-y-4"
      >
        <TextField
          ref={emailRef}
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          disabled={loading}
        />

        <TextField
          ref={passwordRef}
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          disabled={loading}
          endAdornment={
            <IconButton
              label={showPassword ? "Hide password" : "Show password"}
              icon={showPassword ? EyeOff : Eye}
              onClick={() => setShowPassword((shown) => !shown)}
              disabled={loading}
              aria-pressed={showPassword}
            />
          }
        />

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          loadingLabel="Signing in…"
          className="w-full"
        >
          Sign in
        </Button>
      </form>
    </AuthLayout>
  )
}

export default Login

import { Eye, EyeOff } from "lucide-react"
import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Link } from "react-router"

import AuthLayout from "../components/auth/AuthLayout"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import IconButton from "../components/ui/IconButton"
import TextField from "../components/ui/TextField"
import useAuth from "../hooks/useAuth"
import useDocumentTitle from "../hooks/useDocumentTitle"
import { loginUser, registerUser } from "../services/api"
import { describeAuthError } from "../utils/authErrors"

const MIN_PASSWORD_LENGTH = 8
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

function Register() {
  useDocumentTitle("Create account")

  const { login } = useAuth()

  const nameRef = useRef(null)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  const [name, setName] = useState("")
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

    if (!name.trim()) {
      problems.name = "Enter your name."
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      problems.email = "Enter a valid email address."
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      problems.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    }

    setFieldErrors(problems)

    const firstInvalid = [
      [problems.name, nameRef],
      [problems.email, emailRef],
      [problems.password, passwordRef],
    ].find(([problem]) => problem)

    if (firstInvalid) {
      firstInvalid[1].current?.focus()
      return
    }

    setLoading(true)

    try {
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      })

      const data = await loginUser(email.trim(), password)

      login(data.access_token)
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        // The field is disabled while loading, and a disabled input
        // can't take focus. Re-enable the form first, then focus.
        flushSync(() => {
          setFieldErrors({
            email: "An account with this email already exists.",
          })
          setLoading(false)
        })

        emailRef.current?.focus()
      } else {
        setError(
          describeAuthError(
            requestError,
            "Couldn't create your account. Check your details and try again.",
          ),
        )
        setLoading(false)
      }
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      description="It takes a few seconds. You'll be signed in right away."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-accent underline-offset-4 hover:text-accent-hover hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <Alert
          tone="danger"
          title="Couldn't create your account"
          className="mb-4"
        >
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField
          ref={nameRef}
          label="Name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
          disabled={loading}
        />

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
          autoComplete="new-password"
          hint={`Use at least ${MIN_PASSWORD_LENGTH} characters.`}
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
          loadingLabel="Creating account…"
          className="w-full"
        >
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}

export default Register

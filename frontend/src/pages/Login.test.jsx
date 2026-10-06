import { fireEvent, screen, waitFor } from "@testing-library/react"
import { axe } from "vitest-axe"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "../services/api"
import { primeApi, renderApp } from "../test/appTestUtils"

vi.mock("../services/api", async (importOriginal) => {
  const { mockApiModule } = await import("../test/apiMock")

  return mockApiModule(importOriginal)
})

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()

  vi.clearAllMocks()
  primeApi(api)
})

const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }))

const fill = (email, password) => {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  })
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  })
}

describe("Login", () => {
  it("asks for an email and password before calling the API", async () => {
    renderApp("/login")

    await screen.findByRole("heading", { name: "Sign in" })

    submit()

    expect(
      await screen.findByText("Enter your email address."),
    ).toBeInTheDocument()
    expect(screen.getByText("Enter your password.")).toBeInTheDocument()

    expect(screen.getByLabelText("Email")).toHaveFocus()
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    )
    expect(api.loginUser).not.toHaveBeenCalled()
  })

  it("focuses the password when only that is missing", async () => {
    renderApp("/login")

    await screen.findByRole("heading", { name: "Sign in" })

    fill("test@example.com", "")
    submit()

    expect(
      await screen.findByText("Enter your password."),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toHaveFocus()
  })

  it("explains wrong credentials and lets the user try again", async () => {
    api.loginUser.mockRejectedValue({ response: { status: 401 } })

    renderApp("/login")

    await screen.findByRole("heading", { name: "Sign in" })

    fill("test@example.com", "wrong")
    submit()

    expect(
      await screen.findByText("Invalid email or password."),
    ).toBeInTheDocument()

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't sign you in",
    )
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled()
    expect(localStorage.getItem("access_token")).toBeNull()
  })

  it("explains when the backend can't be reached", async () => {
    api.loginUser.mockRejectedValue(new Error("Network Error"))

    renderApp("/login")

    await screen.findByRole("heading", { name: "Sign in" })

    fill("test@example.com", "secret")
    submit()

    expect(
      await screen.findByText(
        "Unable to connect to the API. Make sure the backend is running.",
      ),
    ).toBeInTheDocument()
  })

  it("shows progress while signing in", async () => {
    api.loginUser.mockReturnValue(new Promise(() => {}))

    renderApp("/login")

    await screen.findByRole("heading", { name: "Sign in" })

    fill("test@example.com", "secret")
    submit()

    const button = await screen.findByRole("button", {
      name: "Signing in…",
    })

    expect(button).toBeDisabled()
    expect(screen.getByLabelText("Email")).toBeDisabled()
  })

  it("shows and hides the password", async () => {
    renderApp("/login")

    await screen.findByRole("heading", { name: "Sign in" })

    const input = screen.getByLabelText("Password")

    expect(input).toHaveAttribute("type", "password")

    fireEvent.click(screen.getByRole("button", { name: "Show password" }))

    expect(input).toHaveAttribute("type", "text")

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }))

    expect(input).toHaveAttribute("type", "password")
  })

  it("links to the sign-up page", async () => {
    renderApp("/login")

    fireEvent.click(
      await screen.findByRole("link", { name: "Create an account" }),
    )

    expect(
      await screen.findByRole("heading", { name: "Create your account" }),
    ).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    const { container } = renderApp("/login")

    await screen.findByRole("heading", { name: "Sign in" })

    submit()
    await screen.findByText("Enter your email address.")

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations(),
    )
  })
})

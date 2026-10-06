import { fireEvent, screen } from "@testing-library/react"
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
  fireEvent.click(screen.getByRole("button", { name: "Create account" }))

const fill = ({ name, email, password }) => {
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: name },
  })
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  })
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  })
}

const openRegister = async () => {
  renderApp("/register")

  await screen.findByRole("heading", { name: "Create your account" })
}

describe("Register", () => {
  it("checks every field before calling the API", async () => {
    await openRegister()

    submit()

    expect(await screen.findByText("Enter your name.")).toBeInTheDocument()
    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText("Use at least 8 characters.").length,
    ).toBeGreaterThan(0)

    expect(screen.getByLabelText("Name")).toHaveFocus()
    expect(api.registerUser).not.toHaveBeenCalled()
  })

  it("rejects a short password", async () => {
    await openRegister()

    fill({ name: "Ada", email: "ada@example.com", password: "short" })
    submit()

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Use at least 8 characters.",
    )
    expect(screen.getByLabelText("Password")).toHaveFocus()
    expect(api.registerUser).not.toHaveBeenCalled()
  })

  it("creates the account, signs in and opens the overview", async () => {
    await openRegister()

    fill({
      name: "  Ada Lovelace ",
      email: " ada@example.com ",
      password: "long-enough-password",
    })
    submit()

    expect(
      await screen.findByRole("heading", { name: /Welcome back/ }),
    ).toBeInTheDocument()

    expect(api.registerUser).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "long-enough-password",
    })
    expect(api.loginUser).toHaveBeenCalledWith(
      "ada@example.com",
      "long-enough-password",
    )
    expect(localStorage.getItem("access_token")).toBe("test-access-token")
  })

  it("explains an email that is already registered", async () => {
    api.registerUser.mockRejectedValue({ response: { status: 409 } })

    await openRegister()

    fill({
      name: "Ada",
      email: "ada@example.com",
      password: "long-enough-password",
    })
    submit()

    expect(
      await screen.findByText("An account with this email already exists."),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toHaveFocus()
    expect(api.loginUser).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled()
  })

  it("shows a general failure as an alert", async () => {
    api.registerUser.mockRejectedValue({ response: { status: 500 } })

    await openRegister()

    fill({
      name: "Ada",
      email: "ada@example.com",
      password: "long-enough-password",
    })
    submit()

    expect(
      await screen.findByText(
        "Couldn't create your account. Check your details and try again.",
      ),
    ).toBeInTheDocument()
  })

  it("links back to sign in", async () => {
    await openRegister()

    fireEvent.click(screen.getByRole("link", { name: "Sign in" }))

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    const { container } = renderApp("/register")

    await screen.findByRole("heading", { name: "Create your account" })

    submit()
    await screen.findByText("Enter your name.")

    expect(await axe(container)).toHaveNoViolations()
  })
})

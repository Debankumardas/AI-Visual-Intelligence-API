import { act } from "react"
import {
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./services/api"
import { primeApi, renderApp, signIn } from "./test/appTestUtils"

vi.mock("./services/api", async (importOriginal) => {
  const { mockApiModule } = await import("./test/apiMock")

  return mockApiModule(importOriginal)
})

vi.mock("./pages/ImageLab", () => ({
  default: () => <h1>Image Analysis Page</h1>,
}))

vi.mock("./pages/VideoLab", () => ({
  default: () => <h1>Video Analysis Page</h1>,
}))

vi.mock("./pages/Analytics", () => ({
  default: () => <h1>Analytics Page</h1>,
}))

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()

  vi.clearAllMocks()
  primeApi(api)
})

const navigation = () =>
  screen.getByRole("navigation", { name: "Workspace" })

const openUserMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: "Open user menu" }))

describe("signing in", () => {
  it("sends signed-out visitors to the sign-in page", async () => {
    renderApp("/")

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument()

    expect(api.getCurrentUser).not.toHaveBeenCalled()
    expect(api.getPreferences).not.toHaveBeenCalled()
  })

  it("signs in through the form and opens the overview", async () => {
    renderApp("/login")

    fireEvent.change(await screen.findByLabelText("Email"), {
      target: { value: "test@example.com" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret-password" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }))

    expect(
      await screen.findByRole("heading", {
        name: "Welcome back, Test",
      }),
    ).toBeInTheDocument()

    expect(api.loginUser).toHaveBeenCalledWith(
      "test@example.com",
      "secret-password",
    )
    expect(api.getCurrentUser).toHaveBeenCalledWith("test-access-token")
    expect(api.getPreferences).toHaveBeenCalledWith("test-access-token")
    expect(localStorage.getItem("access_token")).toBe("test-access-token")
  })

  it("returns to the page that was asked for before signing in", async () => {
    renderApp("/analytics")

    fireEvent.change(await screen.findByLabelText("Email"), {
      target: { value: "test@example.com" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret-password" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }))

    expect(
      await screen.findByRole("heading", { name: "Analytics Page" }),
    ).toBeInTheDocument()
  })

  it("restores an existing session after a refresh", async () => {
    signIn("existing-token")

    renderApp("/")

    expect(
      await screen.findByRole("heading", {
        name: "Welcome back, Test",
      }),
    ).toBeInTheDocument()

    expect(api.getCurrentUser).toHaveBeenCalledWith("existing-token")
    expect(api.getPreferences).toHaveBeenCalledWith("existing-token")
  })

  it("shows a loading state while the session is checked", async () => {
    signIn()

    api.getCurrentUser.mockReturnValue(new Promise(() => {}))

    renderApp("/")

    expect(screen.getByText("Restoring session…")).toBeInTheDocument()
  })

  it("clears a stored session the server rejects", async () => {
    signIn("invalid-token")

    api.getCurrentUser.mockRejectedValue(new Error("Unauthorized"))

    renderApp("/")

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument()

    expect(localStorage.getItem("access_token")).toBeNull()
  })

  it("sends a signed-in user away from the sign-in page", async () => {
    signIn()

    renderApp("/login")

    expect(
      await screen.findByRole("heading", {
        name: "Welcome back, Test",
      }),
    ).toBeInTheDocument()
  })
})

describe("signing out", () => {
  it("signs out and clears the stored session", async () => {
    signIn()

    renderApp("/")

    await screen.findByRole("heading", { name: "Welcome back, Test" })

    openUserMenu()
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }))

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument()

    expect(localStorage.getItem("access_token")).toBeNull()
  })

  it("explains an expired session on the sign-in page", async () => {
    signIn()

    renderApp("/")

    await screen.findByRole("heading", { name: "Welcome back, Test" })

    act(() => {
      localStorage.removeItem("access_token")
      window.dispatchEvent(new Event("session-expired"))
    })

    expect(
      await screen.findByText(
        "Your session has expired. Please log in again.",
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument()
  })

  it("forgets the latest video analysis when signing out", async () => {
    signIn()
    sessionStorage.setItem(
      "vision.videoAnalytics",
      JSON.stringify({ total_detections: 9 }),
    )

    renderApp("/")

    await screen.findByRole("heading", { name: "Welcome back, Test" })

    openUserMenu()
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }))

    await screen.findByRole("heading", { name: "Sign in" })

    expect(sessionStorage.getItem("vision.videoAnalytics")).toBeNull()
  })
})

describe("navigation and preferences", () => {
  it("opens the overview by default", async () => {
    signIn()

    renderApp("/")

    expect(
      await screen.findByRole("heading", {
        name: "Welcome back, Test",
      }),
    ).toBeInTheDocument()

    expect(
      within(navigation()).getByRole("link", { name: "Overview" }),
    ).toHaveAttribute("aria-current", "page")
  })

  it("navigates between pages with the sidebar", async () => {
    signIn()

    renderApp("/")

    await screen.findByRole("heading", { name: "Welcome back, Test" })

    fireEvent.click(
      within(navigation()).getByRole("link", { name: "Image lab" }),
    )

    expect(
      await screen.findByRole("heading", { name: "Image Analysis Page" }),
    ).toBeInTheDocument()

    fireEvent.click(
      within(navigation()).getByRole("link", { name: "Video lab" }),
    )

    expect(
      await screen.findByRole("heading", { name: "Video Analysis Page" }),
    ).toBeInTheDocument()
  })

  it("opens a page directly from its address", async () => {
    signIn()

    renderApp("/settings")

    expect(
      await screen.findByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument()
  })

  it("hides switched-off pages from the sidebar", async () => {
    signIn()

    primeApi(api, {
      preferences: {
        dashboard_enabled: true,
        image_analysis_enabled: false,
        video_analysis_enabled: true,
        analysis_completed_notifications: true,
        system_notifications: true,
      },
    })

    renderApp("/")

    await screen.findByRole("heading", { name: "Welcome back, Test" })

    expect(
      within(navigation()).queryByRole("link", { name: "Image lab" }),
    ).not.toBeInTheDocument()

    expect(
      within(navigation()).getByRole("link", { name: "Video lab" }),
    ).toBeInTheDocument()
  })

  it("redirects a switched-off page to the overview", async () => {
    signIn()

    primeApi(api, {
      preferences: {
        dashboard_enabled: true,
        image_analysis_enabled: false,
        video_analysis_enabled: true,
        analysis_completed_notifications: true,
        system_notifications: true,
      },
    })

    renderApp("/image")

    expect(
      await screen.findByRole("heading", {
        name: "Welcome back, Test",
      }),
    ).toBeInTheDocument()
  })

  it("redirects to Analytics when the overview is switched off too", async () => {
    signIn()

    primeApi(api, {
      preferences: {
        dashboard_enabled: false,
        image_analysis_enabled: false,
        video_analysis_enabled: true,
        analysis_completed_notifications: true,
        system_notifications: true,
      },
    })

    renderApp("/image")

    expect(
      await screen.findByRole("heading", { name: "Analytics Page" }),
    ).toBeInTheDocument()
  })

  it("shows a not-found page with a way back", async () => {
    signIn()

    renderApp("/no/such/page")

    expect(
      await screen.findByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("link", { name: "Go to the start page" }),
    )

    expect(
      await screen.findByRole("heading", {
        name: "Welcome back, Test",
      }),
    ).toBeInTheDocument()
  })

  it("sends signed-out visitors of unknown addresses to sign in", async () => {
    renderApp("/no/such/page")

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument()
  })

  it("opens Settings from the user menu", async () => {
    signIn()

    renderApp("/")

    await screen.findByRole("heading", { name: "Welcome back, Test" })

    openUserMenu()
    fireEvent.click(screen.getByRole("button", { name: "Preferences" }))

    expect(
      await screen.findByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument()
  })
})

describe("mobile navigation", () => {
  it("opens as a dialog and closes with Escape", async () => {
    signIn()

    renderApp("/")

    await screen.findByRole("heading", { name: "Welcome back, Test" })

    const opener = screen.getByRole("button", { name: "Open navigation" })

    fireEvent.click(opener)

    const drawer = screen.getByRole("dialog", { name: "Navigation" })

    expect(drawer).toHaveAttribute("aria-modal", "true")
    expect(
      within(drawer).getByRole("link", { name: "Overview" }),
    ).toBeInTheDocument()

    fireEvent.keyDown(document, { key: "Escape" })

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Navigation" }),
      ).not.toBeInTheDocument(),
    )
  })

  it("closes after choosing a page", async () => {
    signIn()

    renderApp("/")

    await screen.findByRole("heading", { name: "Welcome back, Test" })

    fireEvent.click(
      screen.getByRole("button", { name: "Open navigation" }),
    )

    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Navigation" })).getByRole(
        "link",
        { name: "Analytics" },
      ),
    )

    expect(
      await screen.findByRole("heading", { name: "Analytics Page" }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole("dialog", { name: "Navigation" }),
    ).not.toBeInTheDocument()
  })

  it("keeps keyboard focus inside while open", async () => {
    signIn()

    renderApp("/")

    await screen.findByRole("heading", { name: "Welcome back, Test" })

    fireEvent.click(
      screen.getByRole("button", { name: "Open navigation" }),
    )

    const drawer = screen.getByRole("dialog", { name: "Navigation" })
    const focusable = drawer.querySelectorAll("a[href], button")
    const last = focusable[focusable.length - 1]

    last.focus()
    fireEvent.keyDown(last, { key: "Tab" })

    expect(focusable[0]).toHaveFocus()

    fireEvent.keyDown(focusable[0], { key: "Tab", shiftKey: true })

    expect(last).toHaveFocus()
  })
})

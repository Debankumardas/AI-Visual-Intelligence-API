import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import Topbar from "./Topbar"

const user = {
  name: "Test User",
  email: "test@example.com",
  role: "Analyst",
}

const unread = {
  id: 1,
  kind: "analysis",
  title: "Image analysis completed",
  message: "2 objects detected.",
  createdAt: Date.now(),
  read: false,
}

const read = {
  id: 2,
  kind: "system",
  title: "API connection restored",
  message: "The backend is reachable again.",
  createdAt: Date.now() - 5 * 60_000,
  read: true,
}

function renderTopbar(props = {}) {
  return render(
    <Topbar
      activePage="Dashboard"
      user={user}
      onLogout={() => {}}
      {...props}
    />,
  )
}

const openNotifications = () =>
  fireEvent.click(
    screen.getByRole("button", { name: "Notifications" }),
  )

describe("Topbar API status", () => {
  it("shows the API as online", () => {
    renderTopbar({ apiOnline: true })

    expect(screen.getByText("API Online")).toBeInTheDocument()
  })

  it("shows the API as offline", () => {
    renderTopbar({ apiOnline: false })

    expect(screen.getByText("API Offline")).toBeInTheDocument()
  })
})

describe("Topbar notifications", () => {
  it("shows an empty state and no unread badge", () => {
    renderTopbar()

    expect(screen.queryByTestId("unread-badge")).not.toBeInTheDocument()

    openNotifications()

    expect(
      screen.getByText("No notifications yet."),
    ).toBeInTheDocument()
    expect(
      screen.queryByText("System ready"),
    ).not.toBeInTheDocument()
  })

  it("shows the unread badge only while something is unread", () => {
    const { rerender } = renderTopbar({
      notifications: [unread, read],
    })

    expect(screen.getByTestId("unread-badge")).toBeInTheDocument()

    rerender(
      <Topbar
        activePage="Dashboard"
        user={user}
        onLogout={() => {}}
        notifications={[read]}
      />,
    )

    expect(screen.queryByTestId("unread-badge")).not.toBeInTheDocument()
  })

  it("lists notifications with relative times", () => {
    renderTopbar({ notifications: [unread, read] })

    openNotifications()

    expect(
      screen.getByText("Image analysis completed"),
    ).toBeInTheDocument()
    expect(screen.getByText("2 objects detected.")).toBeInTheDocument()
    expect(screen.getByText("Just now")).toBeInTheDocument()
    expect(screen.getByText("5 min ago")).toBeInTheDocument()
  })

  it("marks all notifications as read", () => {
    const onMarkAllRead = vi.fn()

    renderTopbar({
      notifications: [unread],
      onMarkAllRead,
    })

    openNotifications()

    fireEvent.click(
      screen.getByRole("button", { name: "Mark all as read" }),
    )

    expect(onMarkAllRead).toHaveBeenCalledTimes(1)
  })

  it("disables mark all as read when nothing is unread", () => {
    renderTopbar({ notifications: [read] })

    openNotifications()

    expect(
      screen.getByRole("button", { name: "Mark all as read" }),
    ).toBeDisabled()
  })
})

describe("Topbar user menu", () => {
  const openMenu = () =>
    fireEvent.click(
      screen.getByRole("button", { name: "Open user menu" }),
    )

  it("navigates to Settings from Preferences", () => {
    const onNavigate = vi.fn()

    renderTopbar({ onNavigate })

    openMenu()
    fireEvent.click(
      screen.getByRole("button", { name: "Preferences" }),
    )

    expect(onNavigate).toHaveBeenCalledWith("Settings")
    expect(
      screen.queryByRole("button", { name: "Preferences" }),
    ).not.toBeInTheDocument()
  })

  it("signs out", () => {
    const onLogout = vi.fn()

    renderTopbar({ onLogout })

    openMenu()
    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it("no longer offers placeholder actions", () => {
    renderTopbar()

    openMenu()

    expect(
      screen.queryByRole("button", { name: "Profile" }),
    ).not.toBeInTheDocument()
  })
})

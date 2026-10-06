import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import App from "./App"
import {
  checkHealth,
  getCurrentUser,
  getPreferences,
} from "./services/api"

vi.mock("./services/api", () => ({
  checkHealth: vi.fn(),
  getCurrentUser: vi.fn(),
  getPreferences: vi.fn(),
  loginUser: vi.fn(),
  updatePreferences: vi.fn(),
}))

vi.mock("./pages/ImageAnalysis", () => ({
  default: ({ onAnalysisComplete }) => (
    <button
      type="button"
      onClick={() =>
        onAnalysisComplete({ detections: [{}, {}] })
      }
    >
      Finish image analysis
    </button>
  ),
}))

vi.mock("./pages/VideoAnalysis", () => ({
  default: ({ onAnalyticsComplete }) => (
    <button
      type="button"
      onClick={() =>
        onAnalyticsComplete({
          total_detections: 5,
          unique_track_ids: 2,
        })
      }
    >
      Finish video analysis
    </button>
  ),
}))

const preferences = {
  dashboard_enabled: true,
  image_analysis_enabled: true,
  video_analysis_enabled: true,
  analysis_completed_notifications: true,
  system_notifications: true,
}

async function renderSignedInApp(overrides = {}) {
  getPreferences.mockResolvedValue({ ...preferences, ...overrides })

  render(<App />)

  await screen.findByText("Computer Vision Workspace")
}

const goTo = (name) =>
  fireEvent.click(
    within(screen.getByRole("complementary")).getByRole("button", {
      name,
    }),
  )

const openNotifications = () =>
  fireEvent.click(
    screen.getByRole("button", { name: "Notifications" }),
  )

const dashboardValue = (title) =>
  screen.getByText(title).closest("div.rounded-xl")

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem("access_token", "test-token")

  vi.clearAllMocks()

  checkHealth.mockResolvedValue({ status: "healthy" })
  getCurrentUser.mockResolvedValue({
    id: 1,
    name: "Test User",
    email: "test@example.com",
    role: "Analyst",
    is_active: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe("analysis notifications", () => {
  it("notifies and counts a completed image analysis", async () => {
    await renderSignedInApp()

    goTo("Image Analysis")
    fireEvent.click(
      screen.getByRole("button", { name: "Finish image analysis" }),
    )

    expect(screen.getByTestId("unread-badge")).toBeInTheDocument()

    openNotifications()

    expect(
      screen.getByText("Image analysis completed"),
    ).toBeInTheDocument()
    expect(screen.getByText("2 objects detected.")).toBeInTheDocument()

    goTo("Dashboard")

    expect(
      within(dashboardValue("Images Analyzed")).getByText("1"),
    ).toBeInTheDocument()
  })

  it("notifies and counts a completed video analysis", async () => {
    await renderSignedInApp()

    goTo("Video Analysis")
    fireEvent.click(
      screen.getByRole("button", { name: "Finish video analysis" }),
    )

    openNotifications()

    expect(
      screen.getByText("Video analysis completed"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("5 detections, 2 unique tracks."),
    ).toBeInTheDocument()

    goTo("Dashboard")

    expect(
      within(dashboardValue("Videos Processed")).getByText("1"),
    ).toBeInTheDocument()
    expect(
      within(dashboardValue("Objects Detected")).getByText("5"),
    ).toBeInTheDocument()
  })

  it("respects the analysis completed preference", async () => {
    await renderSignedInApp({
      analysis_completed_notifications: false,
    })

    goTo("Image Analysis")
    fireEvent.click(
      screen.getByRole("button", { name: "Finish image analysis" }),
    )

    expect(
      screen.queryByTestId("unread-badge"),
    ).not.toBeInTheDocument()

    // The analysis itself is still counted.
    goTo("Dashboard")

    expect(
      within(dashboardValue("Images Analyzed")).getByText("1"),
    ).toBeInTheDocument()
  })

  it("starts with an empty notification list", async () => {
    await renderSignedInApp()

    openNotifications()

    expect(
      screen.getByText("No notifications yet."),
    ).toBeInTheDocument()
  })
})

describe("API health notifications", () => {
  it("shows the API as online after the first check", async () => {
    await renderSignedInApp()

    expect(await screen.findByText("API Online")).toBeInTheDocument()
    expect(checkHealth).toHaveBeenCalledTimes(1)
  })

  it("does not notify about the initial status", async () => {
    checkHealth.mockRejectedValue(new Error("offline"))

    await renderSignedInApp()

    expect(await screen.findByText("API Offline")).toBeInTheDocument()
    expect(
      screen.queryByTestId("unread-badge"),
    ).not.toBeInTheDocument()
  })

  it("notifies when the connection is lost and restored", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    await renderSignedInApp()
    await screen.findByText("API Online")

    checkHealth.mockRejectedValue(new Error("offline"))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })

    await waitFor(() =>
      expect(screen.getByText("API Offline")).toBeInTheDocument(),
    )

    openNotifications()

    expect(
      screen.getByText("API connection lost"),
    ).toBeInTheDocument()

    checkHealth.mockResolvedValue({ status: "healthy" })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })

    await waitFor(() =>
      expect(screen.getByText("API Online")).toBeInTheDocument(),
    )

    expect(
      screen.getByText("API connection restored"),
    ).toBeInTheDocument()
  })

  it("respects the system notifications preference", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    await renderSignedInApp({ system_notifications: false })
    await screen.findByText("API Online")

    checkHealth.mockRejectedValue(new Error("offline"))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })

    await waitFor(() =>
      expect(screen.getByText("API Offline")).toBeInTheDocument(),
    )

    expect(
      screen.queryByTestId("unread-badge"),
    ).not.toBeInTheDocument()
  })
})

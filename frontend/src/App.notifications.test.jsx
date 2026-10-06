import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./services/api"
import { primeApi, renderApp, signIn } from "./test/appTestUtils"

vi.mock("./services/api", async (importOriginal) => {
  const { mockApiModule } = await import("./test/apiMock")

  return mockApiModule(importOriginal)
})

vi.mock("./pages/ImageLab", async () => {
  const { default: useWorkspace } = await import("./hooks/useWorkspace")

  return {
    default: function ImageLabStub() {
      const { recordImageAnalysis } = useWorkspace()

      return (
        <button
          type="button"
          onClick={() =>
            recordImageAnalysis({
              file: null,
              mode: "detect",
              result: { detections: [{}, {}] },
            })
          }
        >
          Finish image analysis
        </button>
      )
    },
  }
})

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

vi.mock("./pages/Analytics", () => ({
  default: () => <h1>Analytics Page</h1>,
}))

const preferences = {
  dashboard_enabled: true,
  image_analysis_enabled: true,
  video_analysis_enabled: true,
  analysis_completed_notifications: true,
  system_notifications: true,
}

async function renderSignedInApp(overrides = {}) {
  signIn()
  primeApi(api, { preferences: { ...preferences, ...overrides } })

  renderApp("/")

  await screen.findByRole("heading", { name: "Welcome back, Test" })
}

const goTo = (name) =>
  fireEvent.click(
    within(
      screen.getByRole("navigation", { name: "Workspace" }),
    ).getByRole("link", { name }),
  )

const openNotifications = () =>
  fireEvent.click(screen.getByRole("button", { name: /^Notifications/ }))

const dashboardValue = (title) =>
  screen.getByRole("group", { name: title })

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()

  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("analysis notifications", () => {
  it("notifies and counts a completed image analysis", async () => {
    await renderSignedInApp()

    goTo("Image lab")
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Finish image analysis",
      }),
    )

    expect(screen.getByTestId("unread-badge")).toBeInTheDocument()

    openNotifications()

    expect(screen.getByText("Image analysis completed")).toBeInTheDocument()
    expect(screen.getByText("2 objects detected.")).toBeInTheDocument()

    goTo("Overview")

    expect(
      within(dashboardValue("Images analyzed")).getByText("1"),
    ).toBeInTheDocument()
  })

  it("notifies and counts a completed video analysis", async () => {
    await renderSignedInApp()

    goTo("Video lab")
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Finish video analysis",
      }),
    )

    openNotifications()

    expect(screen.getByText("Video analysis completed")).toBeInTheDocument()
    expect(
      screen.getByText("5 detections, 2 unique tracks."),
    ).toBeInTheDocument()

    goTo("Overview")

    expect(
      within(dashboardValue("Videos analyzed")).getByText("1"),
    ).toBeInTheDocument()
    expect(
      within(dashboardValue("Objects detected")).getByText("5"),
    ).toBeInTheDocument()
    expect(
      within(dashboardValue("Unique tracks")).getByText("2"),
    ).toBeInTheDocument()
  })

  it("keeps the latest video analysis after a reload", async () => {
    await renderSignedInApp()

    goTo("Video lab")
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Finish video analysis",
      }),
    )

    expect(
      JSON.parse(sessionStorage.getItem("vision.videoAnalytics")),
    ).toEqual({ total_detections: 5, unique_track_ids: 2 })
  })

  it("respects the analysis completed preference", async () => {
    await renderSignedInApp({
      analysis_completed_notifications: false,
    })

    goTo("Image lab")
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Finish image analysis",
      }),
    )

    expect(screen.queryByTestId("unread-badge")).not.toBeInTheDocument()

    // The analysis itself is still counted.
    goTo("Overview")

    expect(
      within(dashboardValue("Images analyzed")).getByText("1"),
    ).toBeInTheDocument()
  })

  it("starts with an empty notification list", async () => {
    await renderSignedInApp()

    openNotifications()

    expect(screen.getByText("No notifications yet.")).toBeInTheDocument()
  })
})

describe("API health notifications", () => {
  it("shows the API as online after the first check", async () => {
    await renderSignedInApp()

    expect(await screen.findByText("API online")).toBeInTheDocument()
    expect(api.checkHealth).toHaveBeenCalledTimes(1)
  })

  it("does not notify about the initial status", async () => {
    signIn()
    primeApi(api)
    api.checkHealth.mockRejectedValue(new Error("offline"))

    renderApp("/")

    expect(await screen.findByText("API offline")).toBeInTheDocument()
    expect(screen.queryByTestId("unread-badge")).not.toBeInTheDocument()
  })

  it("notifies when the connection is lost and restored", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    await renderSignedInApp()
    await screen.findByText("API online")

    api.checkHealth.mockRejectedValue(new Error("offline"))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })

    await waitFor(() =>
      expect(screen.getByText("API offline")).toBeInTheDocument(),
    )

    openNotifications()

    expect(screen.getByText("API connection lost")).toBeInTheDocument()

    api.checkHealth.mockResolvedValue({ status: "healthy" })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })

    await waitFor(() =>
      expect(screen.getByText("API online")).toBeInTheDocument(),
    )

    expect(screen.getByText("API connection restored")).toBeInTheDocument()
  })

  it("respects the system notifications preference", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    await renderSignedInApp({ system_notifications: false })
    await screen.findByText("API online")

    api.checkHealth.mockRejectedValue(new Error("offline"))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })

    await waitFor(() =>
      expect(screen.getByText("API offline")).toBeInTheDocument(),
    )

    expect(screen.queryByTestId("unread-badge")).not.toBeInTheDocument()
  })
})

import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { axe } from "vitest-axe"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "../services/api"
import { primeApi, renderApp, signIn } from "../test/appTestUtils"

vi.mock("../services/api", async (importOriginal) => {
  const { mockApiModule } = await import("../test/apiMock")

  return mockApiModule(importOriginal)
})

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()

  vi.clearAllMocks()
  primeApi(api)
  signIn()
})

const openOverview = async () => {
  renderApp("/")

  await screen.findByRole("heading", { name: "Welcome back, Test" })
}

describe("Overview", () => {
  it("starts every counter at zero", async () => {
    await openOverview()

    for (const title of [
      "Images analyzed",
      "Videos analyzed",
      "Objects detected",
      "Unique tracks",
    ]) {
      expect(
        within(screen.getByRole("group", { name: title })).getByText("0"),
      ).toBeInTheDocument()
    }
  })

  it("shows the latest video analysis from this browser session", async () => {
    sessionStorage.setItem(
      "vision.videoAnalytics",
      JSON.stringify({ total_detections: 1234, unique_track_ids: 7 }),
    )

    await openOverview()

    expect(
      within(screen.getByRole("group", { name: "Objects detected" })).getByText(
        "1,234",
      ),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole("group", { name: "Unique tracks" })).getByText("7"),
    ).toBeInTheDocument()
  })

  it("offers to start an image or a video analysis", async () => {
    await openOverview()

    expect(
      screen.getByRole("link", { name: "Analyze an image" }),
    ).toHaveAttribute("href", "/image")
    expect(
      screen.getByRole("link", { name: "Analyze a video" }),
    ).toHaveAttribute("href", "/video")
  })

  it("only offers the analyses that are switched on", async () => {
    primeApi(api, {
      preferences: {
        dashboard_enabled: true,
        image_analysis_enabled: false,
        video_analysis_enabled: true,
        analysis_completed_notifications: true,
        system_notifications: true,
      },
    })

    await openOverview()

    expect(
      screen.queryByRole("link", { name: "Analyze an image" }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Analyze a video" }),
    ).toBeInTheDocument()
  })

  it("reports the models as ready", async () => {
    await openOverview()

    expect(await screen.findAllByText("Ready")).toHaveLength(2)
  })

  it("shows a model that failed to load, with its reason", async () => {
    api.getReadiness.mockResolvedValue({
      status: "not_ready",
      models: {
        object_detection: "not_ready",
        image_classification: "ready",
      },
      errors: {
        object_detection:
          "Model file not found: models/yolov8s.pt. Run `python -m scripts.download_models` to restore it.",
      },
    })

    await openOverview()

    expect(await screen.findByText("Not ready")).toBeInTheDocument()
    expect(screen.getByText(/Model file not found/)).toBeInTheDocument()
  })

  it("explains an unreachable backend and checks again on request", async () => {
    api.getReadiness.mockRejectedValueOnce(new Error("offline"))

    await openOverview()

    expect(
      await screen.findByText("Can't reach the backend"),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Check again" }))

    await waitFor(() => expect(screen.getAllByText("Ready")).toHaveLength(2))
    expect(api.getReadiness).toHaveBeenCalledTimes(2)
  })

  it("has no accessibility violations", async () => {
    const { container } = renderApp("/")

    await screen.findByRole("heading", { name: "Welcome back, Test" })
    await screen.findAllByText("Ready")

    expect(await axe(container)).toHaveNoViolations()
  })
})

import { fireEvent, screen, within } from "@testing-library/react"
import { axe } from "vitest-axe"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "../services/api"
import { analyticsFixture } from "../test/analyticsFixture"
import { primeApi, renderApp, signIn } from "../test/appTestUtils"

vi.mock("../services/api", async (importOriginal) => {
  const { mockApiModule } = await import("../test/apiMock")

  return mockApiModule(importOriginal)
})

const storeAnalytics = (analytics = analyticsFixture) =>
  sessionStorage.setItem("vision.videoAnalytics", JSON.stringify(analytics))

const openAnalytics = async () => {
  signIn()
  renderApp("/analytics")

  await screen.findByRole("heading", { name: "Analytics" })
}

const tileValue = (label) =>
  screen.getByText(label, { selector: "p" }).nextElementSibling

const openTable = (chartName) => {
  const card = screen.getByRole("region", { name: chartName })

  fireEvent.click(within(card).getByText("View as table"))

  return within(card).getByRole("table")
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()

  vi.clearAllMocks()
  primeApi(api)
})

describe("Analytics without a video", () => {
  it("explains what to do and links to the video lab", async () => {
    await openAnalytics()

    expect(await screen.findByText("No analytics yet")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Analyze a video" }),
    ).toHaveAttribute("href", "/video")
  })

  it("does not offer the link when the video lab is switched off", async () => {
    primeApi(api, {
      preferences: {
        dashboard_enabled: true,
        image_analysis_enabled: true,
        video_analysis_enabled: false,
        analysis_completed_notifications: true,
        system_notifications: true,
      },
    })

    await openAnalytics()

    expect(await screen.findByText("No analytics yet")).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "Analyze a video" }),
    ).not.toBeInTheDocument()
  })
})

describe("Analytics with a video", () => {
  beforeEach(() => storeAnalytics())

  it("describes the analysis and its sampling", async () => {
    await openAnalytics()

    expect(
      await screen.findByText(
        "Latest video analysis: street.mp4. Analyzed 58 of 400 frames (1 in 7 frames).",
      ),
    ).toBeInTheDocument()
  })

  it("shows the headline numbers", async () => {
    await openAnalytics()

    await screen.findByText(/Latest video analysis/)

    expect(tileValue("Detections")).toHaveTextContent("130")
    expect(tileValue("Unique tracks")).toHaveTextContent("4")
    expect(tileValue("Frames analyzed")).toHaveTextContent("58")
    expect(tileValue("Processing time")).toHaveTextContent("34.4 s")
    expect(tileValue("Speed")).toHaveTextContent("1.69 fps")
  })

  it("summarises each chart in text", async () => {
    await openAnalytics()

    await screen.findByText(/Latest video analysis/)

    expect(
      screen.getByRole("img", {
        name: "Bar chart of detections per class: person 80, car 40, bus 10.",
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole("img", {
        name: /Timeline of when each class appears: person from frame 0 to 399/,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole("img", {
        name: "Bar chart of how many frames each track lasted: Track 1 400, Track 2 250, Track 3 120, Track 4 120.",
      }),
    ).toBeInTheDocument()
  })

  it("offers every chart's data as a table", async () => {
    await openAnalytics()

    await screen.findByText(/Latest video analysis/)

    const classes = openTable("Detections by class")

    expect(
      within(classes).getAllByRole("row").map((row) => row.textContent),
    ).toEqual([
      "ClassDetectionsFrames presentTracks",
      "person80100%2",
      "car4062%1",
      "bus1017%1",
    ])

    const presence = openTable("When each class appears")

    expect(within(presence).getByText("280")).toBeInTheDocument()

    const tracks = openTable("Track lifetimes")

    expect(within(tracks).getAllByRole("row")).toHaveLength(5)
    expect(within(tracks).getByText("1,210.3")).toBeInTheDocument()
  })

  it("shows the interacting pairs", async () => {
    await openAnalytics()

    await screen.findByText(/Latest video analysis/)

    expect(
      screen.getByRole("img", {
        name: "Network of 3 tracks with 2 interacting pairs. A table with the same data follows.",
      }),
    ).toBeInTheDocument()

    const pairs = openTable("Track interactions")

    expect(
      within(pairs).getAllByRole("row").map((row) => row.textContent),
    ).toEqual([
      "TrackOther trackEpisodesTime together (frames)",
      "12330",
      "2310",
    ])
  })

  it("shows inference timing", async () => {
    await openAnalytics()

    await screen.findByText(/Latest video analysis/)

    const card = screen.getByRole("region", {
      name: "Inference time per frame",
    })

    expect(within(card).getByText("410.2 ms")).toBeInTheDocument()
    expect(within(card).getByText("584.6 ms")).toBeInTheDocument()
    expect(within(card).getByText("640.2 ms")).toBeInTheDocument()
    expect(within(card).getByText("33.9 s")).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    signIn()

    const { container } = renderApp("/analytics")

    await screen.findByText(/Latest video analysis/)

    expect(await axe(container)).toHaveNoViolations()
  })
})

describe("Analytics edge cases", () => {
  it("says so when nothing was detected", async () => {
    storeAnalytics({
      ...analyticsFixture,
      total_detections: 0,
      unique_track_ids: 0,
      class_detection_counts: {},
      track_duration_frames: {},
      track_interaction_episodes: {},
    })

    await openAnalytics()

    expect(await screen.findByText("Nothing was detected")).toBeInTheDocument()
    expect(screen.queryByText("Track lifetimes")).not.toBeInTheDocument()
    expect(
      screen.getByText("No interactions in this video"),
    ).toBeInTheDocument()
  })

  it("copes with an analysis saved before sampling existed", async () => {
    const older = { ...analyticsFixture }

    delete older.frame_stride
    delete older.source_frame_count

    storeAnalytics(older)

    await openAnalytics()

    expect(
      await screen.findByText("Latest video analysis: street.mp4."),
    ).toBeInTheDocument()
  })
})

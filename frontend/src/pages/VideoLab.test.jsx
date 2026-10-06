import { fireEvent, screen, waitFor } from "@testing-library/react"
import axios from "axios"
import { axe } from "vitest-axe"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "../services/api"
import { primeApi, renderApp, signIn } from "../test/appTestUtils"

vi.mock("../services/api", async (importOriginal) => {
  const { mockApiModule } = await import("../test/apiMock")

  return mockApiModule(importOriginal)
})

const metadataResponse = {
  filename: "clip.mp4",
  content_type: "video/mp4",
  metadata: {
    filename: "clip.mp4",
    content_type: "video/mp4",
    frame_count: 400,
    fps: 30,
    width: 640,
    height: 480,
    duration: 13.333,
  },
}

const analytics = {
  filename: "clip.mp4",
  content_type: "video/mp4",
  frame_stride: 7,
  source_frame_count: 400,
  frames_processed: 58,
  processing_time_seconds: 34.4,
  effective_fps: 1.69,
  average_inference_time_ms: 584.6,
  max_inference_time_ms: 640.2,
  total_detections: 58,
  unique_track_ids: 1,
}

const makeVideo = (name = "clip.mp4", type = "video/mp4", size = 4096) => {
  const file = new File(["x"], name, { type })

  Object.defineProperty(file, "size", { value: size })

  return file
}

const chooseFile = (file) =>
  fireEvent.change(document.querySelector('input[type="file"]'), {
    target: { files: [file] },
  })

const openLab = async () => {
  signIn()
  renderApp("/video")

  await screen.findByRole("heading", { name: "Video lab" })
}

// The value shown in the tile with this label.
const tileValue = (label) =>
  screen.getByText(label, { selector: "p" }).nextElementSibling

const clickAnalyze = () =>
  fireEvent.click(screen.getByRole("button", { name: "Analyze video" }))

const pending = (signalKey = "analyze") =>
  (file, { signal }) =>
    new Promise((resolve, reject) => {
      signal.addEventListener("abort", () =>
        reject(new axios.CanceledError(signalKey)),
      )
    })

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()

  vi.clearAllMocks()
  primeApi(api)

  api.getVideoMetadata.mockResolvedValue(metadataResponse)
  api.analyzeVideo.mockResolvedValue(analytics)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("Video lab: choosing a video", () => {
  it("starts empty with the action disabled", async () => {
    await openLab()

    expect(screen.getByText("Choose a video to begin.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Analyze video" })).toBeDisabled()
  })

  it("shows a preview of the chosen video and enables the action", async () => {
    await openLab()

    chooseFile(makeVideo())

    await waitFor(() => expect(document.querySelector("video")).not.toBeNull())

    expect(document.querySelector("video")).toHaveAttribute("controls")
    expect(screen.getByRole("button", { name: "Analyze video" })).toBeEnabled()
  })

  it("explains an unsupported file", async () => {
    await openLab()

    chooseFile(makeVideo("clip.webm", "video/webm"))

    expect(
      await screen.findByText("clip.webm isn't supported. Use MP4, AVI or MOV."),
    ).toBeInTheDocument()
    expect(document.querySelector("video")).toBeNull()
  })

  it("refuses a video over the size limit", async () => {
    await openLab()

    chooseFile(makeVideo("big.mp4", "video/mp4", 60 * 1024 * 1024))

    expect(
      await screen.findByText(/big\.mp4 is 60 MB\. The limit is 50 MB\./),
    ).toBeInTheDocument()
  })

  it("says when the browser can't preview the format", async () => {
    await openLab()

    chooseFile(makeVideo("clip.avi", "video/avi"))

    await waitFor(() => expect(document.querySelector("video")).not.toBeNull())

    fireEvent.error(document.querySelector("video"))

    expect(await screen.findByText("No preview")).toBeInTheDocument()
    expect(document.querySelector("video")).toBeNull()
    expect(screen.getByRole("button", { name: "Analyze video" })).toBeEnabled()
  })
})

describe("Video lab: analyzing", () => {
  it("reads the details first, then analyzes, and shows the results", async () => {
    await openLab()

    chooseFile(makeVideo())
    clickAnalyze()

    expect(await screen.findByText("Analysis results")).toBeInTheDocument()

    const metadataOrder = api.getVideoMetadata.mock.invocationCallOrder[0]
    const analyzeOrder = api.analyzeVideo.mock.invocationCallOrder[0]

    expect(metadataOrder).toBeLessThan(analyzeOrder)

    expect(api.analyzeVideo).toHaveBeenCalledWith(expect.any(File), {
      signal: expect.any(AbortSignal),
    })

    expect(
      screen.getByText("Analyzed 58 of 400 frames (1 in 7 frames)."),
    ).toBeInTheDocument()

    expect(tileValue("Detections")).toHaveTextContent("58")
    expect(tileValue("Unique tracks")).toHaveTextContent("1")
    expect(tileValue("Frames analyzed")).toHaveTextContent("58")
    expect(tileValue("Sampling")).toHaveTextContent("1 in 7 frames")
    expect(tileValue("Processing time")).toHaveTextContent("34.4 s")
    expect(tileValue("Average per frame")).toHaveTextContent("584.6 ms")
    expect(tileValue("Slowest frame")).toHaveTextContent("640.2 ms")

    expect(
      screen.getByRole("link", { name: "Open analytics" }),
    ).toHaveAttribute("href", "/analytics")
  })

  it("shows the video details", async () => {
    await openLab()

    chooseFile(makeVideo())
    clickAnalyze()

    await screen.findByText("Analysis results")

    expect(tileValue("Resolution")).toHaveTextContent("640 × 480")
    expect(tileValue("Frame rate")).toHaveTextContent("30 fps")
    expect(tileValue("Duration")).toHaveTextContent("13.3 s")
    expect(tileValue("Frames")).toHaveTextContent("400")
  })

  it("describes every frame when nothing was skipped", async () => {
    api.analyzeVideo.mockResolvedValue({
      ...analytics,
      frame_stride: 1,
      source_frame_count: 58,
    })

    await openLab()

    chooseFile(makeVideo())
    clickAnalyze()

    expect(
      await screen.findByText("Analyzed 58 of 58 frames (every frame)."),
    ).toBeInTheDocument()
  })

  it("shows which step is running, with a timer", async () => {
    api.analyzeVideo.mockImplementation(pending())

    await openLab()

    chooseFile(makeVideo())
    clickAnalyze()

    expect(
      await screen.findByText(/Detecting and tracking objects… This can take/),
    ).toBeInTheDocument()

    expect(screen.getByRole("button", { name: "Analyzing…" })).toBeDisabled()
    expect(screen.getByText("0:00")).toBeInTheDocument()
    expect(screen.getByText(/the server may finish the job/)).toBeInTheDocument()
  })

  it("lets the user cancel without an error and keeps the details", async () => {
    api.analyzeVideo.mockImplementation(pending())

    await openLab()

    chooseFile(makeVideo())
    clickAnalyze()

    await screen.findByText(/Detecting and tracking objects… This can take/)

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(
      await screen.findByRole("button", { name: "Analyze video" }),
    ).toBeEnabled()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.queryByText("Analysis results")).not.toBeInTheDocument()
  })

  it("explains a video the server can't read, without analyzing", async () => {
    api.getVideoMetadata.mockRejectedValue({
      response: {
        status: 400,
        data: { detail: "Invalid or corrupted video file." },
      },
    })

    await openLab()

    chooseFile(makeVideo())
    clickAnalyze()

    expect(
      await screen.findByText("Invalid or corrupted video file."),
    ).toBeInTheDocument()
    expect(api.analyzeVideo).not.toHaveBeenCalled()
  })

  it("keeps the video details when the analysis itself fails", async () => {
    api.analyzeVideo.mockRejectedValue({ response: { status: 500 } })

    await openLab()

    chooseFile(makeVideo())
    clickAnalyze()

    expect(
      await screen.findByText("The video couldn't be analyzed. Try again."),
    ).toBeInTheDocument()
    expect(screen.getByText("640 × 480")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Analyze video" })).toBeEnabled()
  })

  it("adds a notification, counts it and keeps it for the session", async () => {
    await openLab()

    chooseFile(makeVideo())
    clickAnalyze()

    await screen.findByText("Analysis results")

    fireEvent.click(screen.getByRole("button", { name: /^Notifications/ }))

    expect(screen.getByText("Video analysis completed")).toBeInTheDocument()
    expect(
      screen.getByText("58 detections, 1 unique tracks."),
    ).toBeInTheDocument()

    expect(
      JSON.parse(sessionStorage.getItem("vision.videoAnalytics"))
        .total_detections,
    ).toBe(58)
  })

  it("discards results when a different video is chosen", async () => {
    await openLab()

    chooseFile(makeVideo())
    clickAnalyze()
    await screen.findByText("Analysis results")

    chooseFile(makeVideo("other.mp4"))

    await waitFor(() =>
      expect(screen.queryByText("Analysis results")).not.toBeInTheDocument(),
    )
    expect(screen.queryByText("640 × 480")).not.toBeInTheDocument()
  })
})

describe("Video lab: annotated video", () => {
  const analyzeFirst = async () => {
    await openLab()

    chooseFile(makeVideo())
    clickAnalyze()

    await screen.findByText("Analysis results")
  }

  it("downloads it and explains how to play it", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {})

    api.annotateVideo.mockResolvedValue(new Blob(["mp4"]))

    await analyzeFirst()

    fireEvent.click(
      screen.getByRole("button", { name: "Download annotated video" }),
    )

    expect(await screen.findByText(/VLC/)).toBeInTheDocument()

    expect(api.annotateVideo).toHaveBeenCalledWith(expect.any(File), {
      signal: expect.any(AbortSignal),
    })
    expect(click).toHaveBeenCalledTimes(1)
    expect(click.mock.contexts[0].download).toBe("clip-annotated.mp4")
  })

  it("explains when it can't be created", async () => {
    api.annotateVideo.mockRejectedValue({
      response: { status: 400, data: new Blob() },
    })

    await analyzeFirst()

    fireEvent.click(
      screen.getByRole("button", { name: "Download annotated video" }),
    )

    expect(
      await screen.findByText("Couldn't create the annotated video. Try again."),
    ).toBeInTheDocument()
  })

  it("can be cancelled", async () => {
    api.annotateVideo.mockImplementation(pending("annotate"))

    await analyzeFirst()

    fireEvent.click(
      screen.getByRole("button", { name: "Download annotated video" }),
    )

    await screen.findByText(/Drawing tracked objects on the video… This can take/)

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(
      await screen.findByRole("button", { name: "Download annotated video" }),
    ).toBeEnabled()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})

describe("Video lab: accessibility", () => {
  it("has no axe violations with results shown", async () => {
    signIn()

    const { container } = renderApp("/video")

    await screen.findByRole("heading", { name: "Video lab" })

    chooseFile(makeVideo())
    clickAnalyze()

    await screen.findByText("Analysis results")

    expect(await axe(container)).toHaveNoViolations()
  })
})

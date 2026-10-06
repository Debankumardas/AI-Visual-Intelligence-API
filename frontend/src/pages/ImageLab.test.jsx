import {
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import axios from "axios"
import { axe } from "vitest-axe"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "../services/api"
import { primeApi, renderApp, signIn } from "../test/appTestUtils"

vi.mock("../services/api", async (importOriginal) => {
  const { mockApiModule } = await import("../test/apiMock")

  return mockApiModule(importOriginal)
})

const dogBox = { x1: 100, y1: 200, x2: 400, y2: 600 }
const ballBox = { x1: 500, y1: 300, x2: 560, y2: 360 }

const analyzeResult = {
  filename: "dog.jpg",
  content_type: "image/jpeg",
  predictions: [
    { label: "golden retriever", confidence: 0.9376 },
    { label: "tennis ball", confidence: 0.0018 },
  ],
  detections: [
    { label: "dog", confidence: 0.9289, box: dogBox },
    { label: "ball", confidence: 0.81, box: ballBox },
  ],
  classification_inference_time_ms: 18.5,
  detection_inference_time_ms: 42.3,
}

const makeImage = (name = "dog.jpg", type = "image/jpeg", size = 2048) => {
  const file = new File(["x"], name, { type })

  Object.defineProperty(file, "size", { value: size })

  return file
}

const chooseFile = (file) =>
  fireEvent.change(document.querySelector('input[type="file"]'), {
    target: { files: [file] },
  })

const finishImageLoad = (width = 1000, height = 800) => {
  const image = document.querySelector("img")

  Object.defineProperty(image, "naturalWidth", { value: width })
  Object.defineProperty(image, "naturalHeight", { value: height })

  fireEvent.load(image)
}

const openLab = async () => {
  signIn()
  renderApp("/image")

  await screen.findByRole("heading", { name: "Image lab" })
}

const selectMode = (name) =>
  fireEvent.click(screen.getByRole("tab", { name }))

const clickRun = (name) =>
  fireEvent.click(screen.getByRole("button", { name }))

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()

  vi.clearAllMocks()
  primeApi(api)

  api.analyzeImage.mockResolvedValue(analyzeResult)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("Image lab: choosing an image", () => {
  it("starts empty with the action disabled", async () => {
    await openLab()

    expect(screen.getAllByRole("tab")).toHaveLength(5)
    expect(screen.getByText("Choose an image to begin.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Analyze image" })).toBeDisabled()
  })

  it("shows the chosen image and enables the action", async () => {
    await openLab()

    chooseFile(makeImage())

    expect(await screen.findByRole("img", { name: "dog.jpg" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Analyze image" })).toBeEnabled()
  })

  it("explains why a file was refused and keeps the current state", async () => {
    await openLab()

    chooseFile(makeImage("notes.pdf", "application/pdf"))

    expect(
      await screen.findByText("notes.pdf isn’t supported. Use JPEG, PNG or WebP."),
    ).toBeInTheDocument()

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("refuses a file over the size limit", async () => {
    await openLab()

    chooseFile(makeImage("big.png", "image/png", 11 * 1024 * 1024))

    expect(
      await screen.findByText(/big\.png is 11 MB\. The limit is 10 MB\./),
    ).toBeInTheDocument()
  })
})

describe("Image lab: analyzing", () => {
  it("runs the analysis and lists what was found", async () => {
    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")

    expect(await screen.findByText("2 objects detected.")).toBeInTheDocument()

    expect(api.analyzeImage).toHaveBeenCalledWith(
      expect.any(File),
      { signal: expect.any(AbortSignal) },
    )

    const predictions = screen.getByRole("list", { name: "Top predictions" })

    expect(within(predictions).getByText("golden retriever")).toBeInTheDocument()
    expect(within(predictions).getByText("93.8%")).toBeInTheDocument()

    const detected = screen.getByRole("list", { name: "Detected objects" })

    expect(within(detected).getByText("dog")).toBeInTheDocument()
    expect(within(detected).getByText("92.9%")).toBeInTheDocument()
    expect(within(detected).getByText("100, 200 to 400, 600")).toBeInTheDocument()

    expect(screen.getByText("18.5 ms")).toBeInTheDocument()
    expect(screen.getByText("42.3 ms")).toBeInTheDocument()
  })

  it("lists detections before the top predictions", async () => {
    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")

    await screen.findByText("2 objects detected.")

    const detected = screen.getByRole("list", { name: "Detected objects" })
    const predictions = screen.getByRole("list", { name: "Top predictions" })

    expect(
      detected.compareDocumentPosition(predictions) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it("puts the replace-image control above the image", async () => {
    await openLab()

    chooseFile(makeImage())

    const image = await screen.findByRole("img", { name: "dog.jpg" })
    const replace = screen.getByRole("button", {
      name: /dog\.jpg.*Choose a different file/,
    })

    expect(
      replace.compareDocumentPosition(image) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it("draws every detection on the image", async () => {
    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")

    await screen.findByText("2 objects detected.")

    finishImageLoad()

    expect(document.querySelectorAll("[data-shape]")).toHaveLength(2)
    expect(screen.getByText("dog 93%")).toBeInTheDocument()
    expect(screen.getByText("ball 81%")).toBeInTheDocument()
  })

  it("highlights a shape while its row is hovered or focused", async () => {
    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")

    await screen.findByText("2 objects detected.")
    finishImageLoad()

    const row = within(
      screen.getByRole("list", { name: "Detected objects" }),
    ).getByRole("button", { name: /dog/ })

    fireEvent.pointerEnter(row)

    expect(document.querySelector('[data-shape="detection-1"]')).toHaveAttribute(
      "opacity",
      "0.4",
    )

    fireEvent.pointerLeave(row)

    expect(document.querySelector('[data-shape="detection-1"]')).toHaveAttribute(
      "opacity",
      "1",
    )

    fireEvent.focus(row)

    expect(document.querySelector('[data-shape="detection-1"]')).toHaveAttribute(
      "opacity",
      "0.4",
    )
  })

  it("pins a result when its row is clicked, and unpins on a second click", async () => {
    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")

    await screen.findByText("2 objects detected.")
    finishImageLoad()

    const row = within(
      screen.getByRole("list", { name: "Detected objects" }),
    ).getByRole("button", { name: /ball/ })

    fireEvent.click(row)

    expect(row).toHaveAttribute("aria-pressed", "true")
    expect(document.querySelector('[data-shape="detection-0"]')).toHaveAttribute(
      "opacity",
      "0.4",
    )

    fireEvent.click(row)

    expect(row).toHaveAttribute("aria-pressed", "false")
  })

  it("says so when nothing was found", async () => {
    api.analyzeImage.mockResolvedValue({
      ...analyzeResult,
      predictions: [],
      detections: [],
    })

    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")

    expect(await screen.findByText("0 objects detected.")).toBeInTheDocument()
    expect(
      screen.getByText("No objects found. Try a clearer image, or another mode."),
    ).toBeInTheDocument()
  })

  it("adds a notification and updates the overview", async () => {
    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")

    await screen.findByText("2 objects detected.")

    fireEvent.click(screen.getByRole("button", { name: /^Notifications/ }))

    expect(screen.getByText("Image analysis completed")).toBeInTheDocument()

    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "Workspace" }),
      ).getByRole("link", { name: "Overview" }),
    )

    expect(
      await screen.findByRole("img", { name: "dog.jpg. 2 objects detected." }),
    ).toBeInTheDocument()
    expect(screen.getByText("Latest image result")).toBeInTheDocument()
  })
})

describe("Image lab: analysis type in the address", () => {
  it("opens the type named in the address", async () => {
    signIn()
    renderApp("/image?mode=segment")

    await screen.findByRole("heading", { name: "Image lab" })

    expect(screen.getByRole("tab", { name: "Segment" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(
      screen.getByRole("button", { name: "Segment objects" }),
    ).toBeInTheDocument()
  })

  it("falls back to analyze for an unknown type", async () => {
    signIn()
    renderApp("/image?mode=banana")

    await screen.findByRole("heading", { name: "Image lab" })

    expect(screen.getByRole("tab", { name: "Analyze" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
  })

  it("writes the chosen type to the address and clears it for analyze", async () => {
    await openLab()

    expect(screen.getByTestId("location")).toHaveTextContent("/image")
    expect(screen.getByTestId("location")).not.toHaveTextContent("mode")

    selectMode("Read text")
    expect(screen.getByTestId("location")).toHaveTextContent("/image?mode=text")

    selectMode("Count")
    expect(screen.getByTestId("location")).toHaveTextContent("/image?mode=count")

    selectMode("Analyze")
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/image$/)
  })
})

describe("Image lab: analysis types", () => {
  it("keeps results per type when switching tabs", async () => {
    api.detectObjects.mockResolvedValue({
      detections: [{ label: "cat", confidence: 0.7, box: dogBox }],
    })

    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")
    await screen.findByText("2 objects detected.")

    selectMode("Detect")

    expect(screen.getByRole("tab", { name: "Detect" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(screen.queryByText("2 objects detected.")).not.toBeInTheDocument()

    clickRun("Detect objects")
    expect(await screen.findByText("1 object detected.")).toBeInTheDocument()
    expect(api.detectObjects).toHaveBeenCalledTimes(1)

    selectMode("Analyze")
    expect(screen.getByText("2 objects detected.")).toBeInTheDocument()
    expect(api.analyzeImage).toHaveBeenCalledTimes(1)
  })

  it("segments objects and draws their outlines", async () => {
    api.segmentImage.mockResolvedValue({
      segmentations: [
        {
          label: "dog",
          confidence: 0.92,
          box: dogBox,
          mask: [
            [100, 200],
            [400, 220],
            [380, 600],
          ],
        },
      ],
    })

    await openLab()

    chooseFile(makeImage())
    selectMode("Segment")
    clickRun("Segment objects")

    expect(await screen.findByText("1 object segmented.")).toBeInTheDocument()
    expect(screen.getByText("3 outline points")).toBeInTheDocument()

    finishImageLoad()

    expect(document.querySelector("polygon")).toHaveAttribute(
      "points",
      "100,200 400,220 380,600",
    )
  })

  it("reads text and copies it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })

    api.extractText.mockResolvedValue({
      results: [
        { text: "STOP", confidence: 0.95, box: dogBox },
        { text: "HERE", confidence: 0.9, box: ballBox },
      ],
    })

    await openLab()

    chooseFile(makeImage())
    selectMode("Read text")
    clickRun("Read text")

    expect(await screen.findByText("2 text regions found.")).toBeInTheDocument()
    expect(screen.getByText("STOP")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Copy all text" }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("STOP HERE"))
    expect(await screen.findByText("Text copied.")).toBeInTheDocument()
  })

  it("explains when copying is not possible", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    })

    api.extractText.mockResolvedValue({
      results: [{ text: "STOP", confidence: 0.95, box: dogBox }],
    })

    await openLab()

    chooseFile(makeImage())
    selectMode("Read text")
    clickRun("Read text")

    await screen.findByText("1 text region found.")

    fireEvent.click(screen.getByRole("button", { name: "Copy all text" }))

    expect(
      await screen.findByText("Couldn’t copy the text. Select it from the list instead."),
    ).toBeInTheDocument()
  })

  it("counts objects per class without drawing anything", async () => {
    api.countObjects.mockResolvedValue({
      total_objects: 3,
      counts: [
        { label: "dog", count: 2 },
        { label: "ball", count: 1 },
      ],
    })

    await openLab()

    chooseFile(makeImage())
    selectMode("Count")
    clickRun("Count objects")

    expect(await screen.findByText("3 objects counted.")).toBeInTheDocument()

    const counts = screen.getByRole("list", { name: "Objects per class" })

    expect(within(counts).getByText("dog")).toBeInTheDocument()
    expect(within(counts).getByText("2")).toBeInTheDocument()

    finishImageLoad()

    expect(screen.queryByTestId("overlay")).not.toBeInTheDocument()
  })
})

describe("Image lab: problems", () => {
  it("explains a failed analysis and allows another try", async () => {
    api.analyzeImage.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { detail: "Invalid or corrupted image file." },
      },
    })

    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")

    expect(
      await screen.findByText("Invalid or corrupted image file."),
    ).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("That didn’t work")

    clickRun("Analyze image")

    expect(await screen.findByText("2 objects detected.")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("explains an unreachable backend", async () => {
    api.analyzeImage.mockRejectedValue(new Error("Network Error"))

    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")

    expect(
      await screen.findByText("Can’t reach the API. Check that the backend is running."),
    ).toBeInTheDocument()
  })

  it("shows progress and lets the user cancel without an error", async () => {
    api.analyzeImage.mockImplementation(
      (file, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener("abort", () =>
            reject(new axios.CanceledError()),
          )
        }),
    )

    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")

    expect(await screen.findByRole("button", { name: "Working…" })).toBeDisabled()
    expect(screen.getByText("0:00")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(
      await screen.findByRole("button", { name: "Analyze image" }),
    ).toBeEnabled()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.queryByText("2 objects detected.")).not.toBeInTheDocument()
  })

  it("discards results when a different image is chosen", async () => {
    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")
    await screen.findByText("2 objects detected.")

    chooseFile(makeImage("cat.png", "image/png"))

    expect(await screen.findByRole("img", { name: "cat.png" })).toBeInTheDocument()
    expect(screen.queryByText("2 objects detected.")).not.toBeInTheDocument()
  })
})

describe("Image lab: annotated image", () => {
  it("downloads the annotated image", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {})

    api.detectAnnotated.mockResolvedValue(new Blob(["jpeg"]))

    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")
    await screen.findByText("2 objects detected.")

    fireEvent.click(
      screen.getByRole("button", { name: "Download annotated image" }),
    )

    expect(
      await screen.findByText("Annotated image downloaded."),
    ).toBeInTheDocument()

    expect(api.detectAnnotated).toHaveBeenCalledWith(expect.any(File))
    expect(click).toHaveBeenCalledTimes(1)
    expect(click.mock.contexts[0].download).toBe("dog-annotated.jpg")
  })

  it("explains when the annotated image can’t be created", async () => {
    api.detectAnnotated.mockRejectedValue({
      response: { status: 500, data: new Blob() },
    })

    await openLab()

    chooseFile(makeImage())
    clickRun("Analyze image")
    await screen.findByText("2 objects detected.")

    fireEvent.click(
      screen.getByRole("button", { name: "Download annotated image" }),
    )

    expect(
      await screen.findByText("Couldn’t create the annotated image. Try again."),
    ).toBeInTheDocument()
  })

  it("is only offered for analyze and detect", async () => {
    api.countObjects.mockResolvedValue({ total_objects: 1, counts: [{ label: "dog", count: 1 }] })

    await openLab()

    chooseFile(makeImage())
    selectMode("Count")
    clickRun("Count objects")
    await screen.findByText("1 object counted.")

    expect(
      screen.queryByRole("button", { name: "Download annotated image" }),
    ).not.toBeInTheDocument()
  })
})

describe("Image lab: accessibility", () => {
  it("has no axe violations after an analysis", async () => {
    signIn()

    const { container } = renderApp("/image")

    await screen.findByRole("heading", { name: "Image lab" })

    chooseFile(makeImage())
    clickRun("Analyze image")

    await screen.findByText("2 objects detected.")
    finishImageLoad()

    expect(await axe(container)).toHaveNoViolations()
  })
})

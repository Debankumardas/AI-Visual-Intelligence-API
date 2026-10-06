import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import ImageViewer from "./ImageViewer"

const box = (x1, y1, x2, y2) => ({ x1, y1, x2, y2 })

const detection = (overrides = {}) => ({
  id: "d0",
  kind: "box",
  label: "dog",
  confidence: 0.93,
  color: "#22d3ee",
  box: box(100, 200, 400, 600),
  ...overrides,
})

function loadImage(width = 1000, height = 800) {
  const image = screen.getByRole("img")

  Object.defineProperty(image, "naturalWidth", { value: width })
  Object.defineProperty(image, "naturalHeight", { value: height })

  fireEvent.load(image)

  return image
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("ImageViewer", () => {
  it("shows the image with its description", () => {
    render(<ImageViewer src="blob:dog" alt="dog.jpg. 1 object detected." />)

    expect(screen.getByRole("img")).toHaveAccessibleName(
      "dog.jpg. 1 object detected.",
    )
  })

  it("draws nothing until the image size is known", () => {
    render(<ImageViewer src="blob:dog" alt="dog" shapes={[detection()]} />)

    expect(screen.queryByTestId("overlay")).not.toBeInTheDocument()

    loadImage()

    expect(screen.getByTestId("overlay")).toBeInTheDocument()
  })

  it("reports the natural size once loaded", () => {
    const onSize = vi.fn()

    render(<ImageViewer src="blob:dog" alt="dog" onSize={onSize} />)

    loadImage(1000, 800)

    expect(onSize).toHaveBeenCalledWith({ width: 1000, height: 800 })
  })

  it("lines the overlay up with the image pixels", () => {
    render(<ImageViewer src="blob:dog" alt="dog" shapes={[detection()]} />)

    loadImage(1000, 800)

    expect(screen.getByTestId("overlay")).toHaveAttribute(
      "viewBox",
      "0 0 1000 800",
    )

    const rect = document.querySelector('[data-shape="d0"] rect')

    expect(rect).toHaveAttribute("x", "100")
    expect(rect).toHaveAttribute("y", "200")
    expect(rect).toHaveAttribute("width", "300")
    expect(rect).toHaveAttribute("height", "400")
  })

  it("labels each box with its class and confidence", () => {
    render(<ImageViewer src="blob:dog" alt="dog" shapes={[detection()]} />)

    loadImage()

    expect(screen.getByText("dog 93%")).toBeInTheDocument()
  })

  it("keeps the label inside the image at the top and right edges", () => {
    render(
      <ImageViewer
        src="blob:dog"
        alt="dog"
        shapes={[detection({ box: box(980, 0, 1000, 50) })]}
      />,
    )

    loadImage(1000, 800)

    const label = document.querySelectorAll('[data-shape="d0"] rect')[1]

    // No room above the box, so the label sits inside it.
    expect(Number(label.getAttribute("y"))).toBe(0)

    // Pushed left so it is not cut off by the right edge.
    expect(
      Number(label.getAttribute("x")) + Number(label.getAttribute("width")),
    ).toBeLessThanOrEqual(1000)
  })

  it("draws segments as polygons", () => {
    render(
      <ImageViewer
        src="blob:dog"
        alt="dog"
        shapes={[
          detection({
            id: "s0",
            kind: "polygon",
            polygon: [
              [10, 10],
              [200, 20],
              [150, 180],
            ],
          }),
        ]}
      />,
    )

    loadImage()

    expect(
      document.querySelector('[data-shape="s0"] polygon'),
    ).toHaveAttribute("points", "10,10 200,20 150,180")
  })

  it("labels an outline at its highest point, not at its bounding box", () => {
    render(
      <ImageViewer
        src="blob:dog"
        alt="dog"
        shapes={[
          detection({
            id: "s0",
            kind: "polygon",
            box: box(0, 0, 900, 700),
            polygon: [
              [300, 400],
              [450, 250],
              [600, 420],
            ],
          }),
        ]}
      />,
    )

    loadImage(1000, 800)

    const label = document.querySelectorAll('[data-shape="s0"] rect')[0]

    // 250 is the highest point; the label (20 px tall) sits just above it.
    expect(Number(label.getAttribute("y"))).toBe(230)
    expect(Number(label.getAttribute("x"))).toBe(450)
  })

  it("only shows recognised text for the active shape", () => {
    const text = detection({ id: "t0", label: "text", text: "STOP" })

    const { rerender } = render(
      <ImageViewer src="blob:dog" alt="dog" shapes={[text]} />,
    )

    loadImage()

    expect(screen.queryByText("STOP")).not.toBeInTheDocument()

    rerender(
      <ImageViewer
        src="blob:dog"
        alt="dog"
        shapes={[text]}
        activeId="t0"
      />,
    )

    expect(screen.getByText("STOP")).toBeInTheDocument()
  })

  it("emphasises the active shape and dims the others", () => {
    const shapes = [detection(), detection({ id: "d1", label: "cat" })]

    render(
      <ImageViewer
        src="blob:dog"
        alt="dog"
        shapes={shapes}
        activeId="d1"
      />,
    )

    loadImage()

    expect(document.querySelector('[data-shape="d1"]')).toHaveAttribute(
      "opacity",
      "1",
    )
    expect(document.querySelector('[data-shape="d0"]')).toHaveAttribute(
      "opacity",
      "0.4",
    )

    const activeStroke = Number(
      document.querySelector('[data-shape="d1"] rect').getAttribute(
        "stroke-width",
      ),
    )
    const idleStroke = Number(
      document.querySelector('[data-shape="d0"] rect').getAttribute(
        "stroke-width",
      ),
    )

    expect(activeStroke).toBeGreaterThan(idleStroke)
  })

  it("reports hovering over a shape", () => {
    const onActiveChange = vi.fn()

    render(
      <ImageViewer
        src="blob:dog"
        alt="dog"
        shapes={[detection()]}
        onActiveChange={onActiveChange}
      />,
    )

    loadImage()

    const group = document.querySelector('[data-shape="d0"]')

    fireEvent.pointerEnter(group)
    expect(onActiveChange).toHaveBeenLastCalledWith("d0")

    fireEvent.pointerLeave(group)
    expect(onActiveChange).toHaveBeenLastCalledWith(null)
  })

  it("keeps strokes a constant on-screen size when the image is scaled down", () => {
    let report

    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback) {
          report = callback
        }

        observe() {}

        disconnect() {}
      },
    )

    render(<ImageViewer src="blob:dog" alt="dog" shapes={[detection()]} />)

    loadImage(1000, 800)

    // The 1000 px wide image is shown 500 px wide: scale 2.
    act(() => report([{ contentRect: { width: 500 } }]))

    expect(
      document.querySelector('[data-shape="d0"] rect').getAttribute(
        "stroke-width",
      ),
    ).toBe("4")
  })

  it("keeps the overlay hidden from assistive technology", () => {
    render(<ImageViewer src="blob:dog" alt="dog" shapes={[detection()]} />)

    loadImage()

    expect(screen.getByTestId("overlay")).toHaveAttribute(
      "aria-hidden",
      "true",
    )
  })
})

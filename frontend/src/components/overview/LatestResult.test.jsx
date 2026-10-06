import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { WorkspaceContext } from "../../context/workspace-context"
import LatestResult from "./LatestResult"

function renderWith(lastImage) {
  return render(
    <MemoryRouter>
      <WorkspaceContext.Provider value={{ lastImage }}>
        <LatestResult />
      </WorkspaceContext.Provider>
    </MemoryRouter>,
  )
}

describe("LatestResult", () => {
  it("invites the user to analyze an image when there is none", () => {
    renderWith(null)

    expect(screen.getByText("No image analyzed yet")).toBeInTheDocument()
  })

  it("shows the latest image with its summary", () => {
    renderWith({
      name: "dog.jpg",
      previewUrl: "blob:dog",
      mode: "detect",
      result: {
        detections: [
          {
            label: "dog",
            confidence: 0.93,
            box: { x1: 1, y1: 2, x2: 30, y2: 40 },
          },
        ],
      },
    })

    expect(
      screen.getByRole("img", { name: "dog.jpg. 1 object detected." }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole("link", { name: "Open the image lab" }),
    ).toHaveAttribute("href", "/image")
  })

  it("draws the result once the image has loaded", () => {
    renderWith({
      name: "dog.jpg",
      previewUrl: "blob:dog",
      mode: "detect",
      result: {
        detections: [
          {
            label: "dog",
            confidence: 0.93,
            box: { x1: 1, y1: 2, x2: 30, y2: 40 },
          },
        ],
      },
    })

    const image = screen.getByRole("img")

    Object.defineProperty(image, "naturalWidth", { value: 100 })
    Object.defineProperty(image, "naturalHeight", { value: 80 })
    fireEvent.load(image)

    expect(screen.getByTestId("overlay")).toBeInTheDocument()
    expect(screen.getByText("dog 93%")).toBeInTheDocument()
  })
})

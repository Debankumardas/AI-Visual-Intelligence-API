import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import useWorkspace from "../hooks/useWorkspace"
import { AuthContext } from "./auth-context"
import WorkspaceProvider from "./WorkspaceProvider"

const image = (name) => new File(["x"], name, { type: "image/jpeg" })

function Probe() {
  const { lastImage, imageAnalysesCount, recordImageAnalysis } =
    useWorkspace()

  const record = (name, mode, result) => () =>
    recordImageAnalysis({ file: image(name), mode, result, size: null })

  return (
    <>
      <button type="button" onClick={record("dog.jpg", "detect", { detections: [{}] })}>
        detect dog
      </button>
      <button type="button" onClick={record("dog.jpg", "count", { total_objects: 3 })}>
        count dog
      </button>
      <button type="button" onClick={record("cat.jpg", "count", { total_objects: 1 })}>
        count cat
      </button>

      <p data-testid="last">
        {lastImage ? `${lastImage.name}:${lastImage.mode}` : "none"}
      </p>
      <p data-testid="count">{imageAnalysesCount}</p>
    </>
  )
}

function renderProbe() {
  return render(
    <AuthContext.Provider value={{ user: null, preferences: null }}>
      <WorkspaceProvider>
        <Probe />
      </WorkspaceProvider>
    </AuthContext.Provider>,
  )
}

const click = (name) => fireEvent.click(screen.getByRole("button", { name }))

describe("latest image result", () => {
  it("starts empty", () => {
    renderProbe()

    expect(screen.getByTestId("last")).toHaveTextContent("none")
  })

  it("is replaced by a newer result", () => {
    renderProbe()

    click("count dog")
    click("detect dog")

    expect(screen.getByTestId("last")).toHaveTextContent("dog.jpg:detect")
  })

  it("keeps a drawable result when a count of the same image follows", () => {
    renderProbe()

    click("detect dog")
    click("count dog")

    expect(screen.getByTestId("last")).toHaveTextContent("dog.jpg:detect")
  })

  it("still counts the analysis that was not shown", () => {
    renderProbe()

    click("detect dog")
    click("count dog")

    expect(screen.getByTestId("count")).toHaveTextContent("2")
  })

  it("shows a count of a different image", () => {
    renderProbe()

    click("detect dog")
    click("count cat")

    expect(screen.getByTestId("last")).toHaveTextContent("cat.jpg:count")
  })
})

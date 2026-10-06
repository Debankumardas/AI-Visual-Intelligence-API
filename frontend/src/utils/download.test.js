import { afterEach, describe, expect, it, vi } from "vitest"

import { derivedFilename, saveBlob } from "./download"

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe("derivedFilename", () => {
  it("replaces the extension", () => {
    expect(derivedFilename("dog.jpg", "annotated", ".jpg")).toBe(
      "dog-annotated.jpg",
    )
  })

  it("keeps dots inside the name", () => {
    expect(derivedFilename("my.dog.photo.PNG", "annotated", ".jpg")).toBe(
      "my.dog.photo-annotated.jpg",
    )
  })

  it("copes with a name without an extension", () => {
    expect(derivedFilename("dog", "annotated", ".mp4")).toBe(
      "dog-annotated.mp4",
    )
  })
})

describe("saveBlob", () => {
  it("clicks a temporary download link and releases the URL later", () => {
    vi.useFakeTimers()

    URL.createObjectURL = vi.fn(() => "blob:test")
    URL.revokeObjectURL = vi.fn()

    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function () {
        expect(this.download).toBe("out.jpg")
        expect(this.href).toBe("blob:test")
      })

    saveBlob(new Blob(["x"]), "out.jpg")

    expect(click).toHaveBeenCalledTimes(1)
    expect(document.querySelector("a[download]")).toBeNull()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test")
  })
})

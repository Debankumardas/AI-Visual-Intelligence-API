import { afterEach, describe, expect, it, vi } from "vitest"

import {
  clearWorkspaceStorage,
  loadVideoAnalytics,
  saveVideoAnalytics,
} from "./workspaceStorage"

afterEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe("workspaceStorage", () => {
  it("round-trips the latest video analytics", () => {
    saveVideoAnalytics({ total_detections: 5 })

    expect(loadVideoAnalytics()).toEqual({ total_detections: 5 })
  })

  it("clears the stored analytics", () => {
    saveVideoAnalytics({ total_detections: 5 })
    clearWorkspaceStorage()

    expect(loadVideoAnalytics()).toBeNull()
  })

  it("returns null for missing or corrupt data", () => {
    expect(loadVideoAnalytics()).toBeNull()

    sessionStorage.setItem("vision.videoAnalytics", "{not json")

    expect(loadVideoAnalytics()).toBeNull()
  })

  it("does not throw when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })

    expect(() => saveVideoAnalytics({ a: 1 })).not.toThrow()
    expect(loadVideoAnalytics()).toBeNull()
  })
})

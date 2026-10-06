import { describe, expect, it } from "vitest"

import {
  CLASS_COLORS,
  classColor,
  describeImageResult,
} from "./vision"

describe("classColor", () => {
  it("is stable for the same label", () => {
    expect(classColor("dog")).toBe(classColor("dog"))
  })

  it("always returns a palette colour", () => {
    for (const label of ["dog", "person", "car", "", "Ünïcode", "x".repeat(500)]) {
      expect(CLASS_COLORS).toContain(classColor(label))
    }
  })

  it("spreads different labels over several colours", () => {
    const labels = ["dog", "cat", "car", "person", "bus", "bike", "tree", "bird"]

    expect(new Set(labels.map(classColor)).size).toBeGreaterThan(3)
  })
})

describe("describeImageResult", () => {
  it("describes detections", () => {
    expect(describeImageResult("detect", { detections: [{}, {}] })).toEqual({
      count: 2,
      summary: "2 objects detected.",
    })

    expect(describeImageResult("analyze", { detections: [{}] }).summary).toBe(
      "1 object detected.",
    )
  })

  it("describes segmentation, text and counts", () => {
    expect(
      describeImageResult("segment", { segmentations: [{}] }).summary,
    ).toBe("1 object segmented.")

    expect(describeImageResult("text", { results: [{}, {}, {}] }).summary).toBe(
      "3 text regions found.",
    )

    expect(describeImageResult("count", { total_objects: 4 }).summary).toBe(
      "4 objects counted.",
    )
  })

  it("copes with missing results", () => {
    expect(describeImageResult("detect", undefined).count).toBe(0)
    expect(describeImageResult("text", {}).summary).toBe(
      "0 text regions found.",
    )
  })
})

import { describe, expect, it } from "vitest"

import {
  CLASS_COLORS,
  classColor,
  describeImageResult,
  formatBox,
  shapesFor,
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

describe("shapesFor", () => {
  const box = { x1: 10, y1: 20, x2: 110, y2: 220 }

  it("turns detections into coloured boxes", () => {
    const shapes = shapesFor("detect", {
      detections: [{ label: "dog", confidence: 0.93, box }],
    })

    expect(shapes).toEqual([
      {
        id: "detection-0",
        kind: "box",
        label: "dog",
        confidence: 0.93,
        color: classColor("dog"),
        box,
      },
    ])
  })

  it("uses the same shapes for the combined analysis", () => {
    expect(
      shapesFor("analyze", {
        detections: [{ label: "dog", confidence: 0.9, box }],
      }),
    ).toHaveLength(1)
  })

  it("turns segmentations into polygons", () => {
    const [shape] = shapesFor("segment", {
      segmentations: [
        {
          label: "dog",
          confidence: 0.92,
          box,
          mask: [
            [1, 2],
            [3, 4],
            [5, 6],
          ],
        },
      ],
    })

    expect(shape.kind).toBe("polygon")
    expect(shape.polygon).toHaveLength(3)
    expect(shape.color).toBe(classColor("dog"))
  })

  it("turns recognised text into boxes that carry the text", () => {
    const [shape] = shapesFor("text", {
      results: [{ text: "STOP", confidence: 0.88, box }],
    })

    expect(shape).toMatchObject({
      kind: "box",
      text: "STOP",
      id: "text-0",
    })
  })

  it("draws nothing for counts or missing results", () => {
    expect(shapesFor("count", { total_objects: 3 })).toEqual([])
    expect(shapesFor("detect", undefined)).toEqual([])
    expect(shapesFor("segment", {})).toEqual([])
  })
})

describe("formatBox", () => {
  it("rounds to whole pixels", () => {
    expect(formatBox({ x1: 129.83, y1: 105.69, x2: 1391.48, y2: 1122 })).toBe(
      "130, 106 to 1391, 1122",
    )
  })
})

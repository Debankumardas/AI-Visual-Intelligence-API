// One palette for the whole app, so a class has the same colour in the
// image overlay, the result list and the charts. Every colour has at
// least 6.7:1 contrast on the surface colour (see DESIGN.md).
export const CLASS_COLORS = [
  "#22d3ee",
  "#f59e0b",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#60a5fa",
  "#fb923c",
  "#a3e635",
]

/** A stable colour for a class label ("dog" is always the same). */
export function classColor(label) {
  let hash = 5381

  for (const character of String(label)) {
    hash = (hash * 33 + character.codePointAt(0)) >>> 0
  }

  return CLASS_COLORS[hash % CLASS_COLORS.length]
}

const plural = (count, singular, pluralForm) =>
  `${count} ${count === 1 ? singular : pluralForm}`

/**
 * Count and a one-line summary of an image result, per analysis mode:
 * analyze, detect, segment, text or count.
 */
export function describeImageResult(mode, result) {
  switch (mode) {
    case "segment": {
      const count = result?.segmentations?.length ?? 0

      return {
        count,
        summary: `${plural(count, "object", "objects")} segmented.`,
      }
    }

    case "text": {
      const count = result?.results?.length ?? 0

      return {
        count,
        summary: `${plural(count, "text region", "text regions")} found.`,
      }
    }

    case "count": {
      const count = result?.total_objects ?? 0

      return {
        count,
        summary: `${plural(count, "object", "objects")} counted.`,
      }
    }

    default: {
      const count = result?.detections?.length ?? 0

      return {
        count,
        summary: `${plural(count, "object", "objects")} detected.`,
      }
    }
  }
}

/**
 * The shapes to draw on the image for a result, in image pixels.
 * Counting has no positions, so it draws nothing.
 *
 * Each shape: { id, kind: "box" | "polygon", label, text?, confidence,
 * color, box: {x1,y1,x2,y2}, polygon?: [[x,y], ...] }
 */
export function shapesFor(mode, result) {
  if (!result) {
    return []
  }

  switch (mode) {
    case "segment":
      return (result.segmentations ?? []).map((item, index) => ({
        id: `segment-${index}`,
        kind: "polygon",
        label: item.label,
        confidence: item.confidence,
        color: classColor(item.label),
        box: item.box,
        polygon: item.mask,
      }))

    case "text":
      return (result.results ?? []).map((item, index) => ({
        id: `text-${index}`,
        kind: "box",
        label: "text",
        text: item.text,
        confidence: item.confidence,
        color: CLASS_COLORS[0],
        box: item.box,
      }))

    case "count":
      return []

    default:
      return (result.detections ?? []).map((item, index) => ({
        id: `detection-${index}`,
        kind: "box",
        label: item.label,
        confidence: item.confidence,
        color: classColor(item.label),
        box: item.box,
      }))
  }
}

/** { x1: 129.8, y1: 105.7, x2: 1391.5, y2: 1122 } -> "130, 106 to 1392, 1122" */
export function formatBox(box) {
  const round = (value) => Math.round(value)

  return `${round(box.x1)}, ${round(box.y1)} to ${round(box.x2)}, ${round(box.y2)}`
}

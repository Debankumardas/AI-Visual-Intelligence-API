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

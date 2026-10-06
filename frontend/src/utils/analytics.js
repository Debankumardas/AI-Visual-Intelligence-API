import { classColor } from "./vision"

// JSON object keys are always strings, so track ids arrive as "3".
const entries = (object) => Object.entries(object ?? {})

/** One row per detected class, busiest first. */
export function classRows(analytics) {
  const presence = analytics.class_presence_ratio ?? {}
  const activeFrames = analytics.active_frames_by_class ?? {}
  const firstFrame = analytics.first_detection_frame ?? {}
  const lastFrame = analytics.last_detection_frame ?? {}
  const tracks = analytics.unique_track_ids_by_class ?? {}

  return entries(analytics.class_detection_counts)
    .map(([label, count]) => ({
      label,
      count,
      color: classColor(label),
      presenceRatio: presence[label] ?? 0,
      activeFrames: activeFrames[label] ?? 0,
      firstFrame: firstFrame[label] ?? 0,
      lastFrame: lastFrame[label] ?? 0,
      tracks: tracks[label] ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

/** One row per track, longest-lived first. Frames are source frames. */
export function trackRows(analytics) {
  const observed = analytics.track_observed_frames ?? {}
  const persistence = analytics.track_persistence_ratio ?? {}
  const distance = analytics.track_distance_travelled ?? {}
  const averageSpeed = analytics.track_average_speed ?? {}
  const maxSpeed = analytics.track_max_speed ?? {}

  return entries(analytics.track_duration_frames)
    .map(([id, durationFrames]) => ({
      id: Number(id),
      durationFrames,
      observedFrames: observed[id] ?? 0,
      persistence: persistence[id] ?? 0,
      distance: distance[id] ?? 0,
      averageSpeed: averageSpeed[id] ?? 0,
      maxSpeed: maxSpeed[id] ?? 0,
    }))
    .sort((a, b) => b.durationFrames - a.durationFrames || a.id - b.id)
}

/**
 * Tracks as nodes, pairs that came close as edges. Keys look like
 * "3,7". `limit` keeps the busiest tracks so the graph stays legible.
 */
export function interactionGraph(analytics, limit = 14) {
  const durations = analytics.track_interaction_duration ?? {}

  const pairs = entries(analytics.track_interaction_episodes).map(
    ([pair, episodes]) => {
      const [a, b] = pair.split(",").map(Number)

      return { a, b, episodes, durationFrames: durations[pair] ?? 0 }
    },
  )

  const totals = new Map()

  for (const { a, b, episodes } of pairs) {
    for (const id of [a, b]) {
      const node = totals.get(id) ?? { id, episodes: 0, partners: 0 }

      node.episodes += episodes
      node.partners += 1
      totals.set(id, node)
    }
  }

  const allNodes = [...totals.values()].sort(
    (x, y) => y.episodes - x.episodes || x.id - y.id,
  )

  const nodes = allNodes.slice(0, limit)
  const shown = new Set(nodes.map((node) => node.id))

  return {
    nodes: nodes.sort((x, y) => x.id - y.id),
    edges: pairs.filter(({ a, b }) => shown.has(a) && shown.has(b)),
    pairs: pairs.sort(
      (x, y) => y.episodes - x.episodes || x.a - y.a || x.b - y.b,
    ),
    hiddenNodes: allNodes.length - nodes.length,
  }
}

/** Evenly spaced points on a circle, starting at the top. */
export function circularLayout(count, centerX, centerY, radius) {
  if (count === 1) {
    return [{ x: centerX, y: centerY }]
  }

  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * 2 * Math.PI - Math.PI / 2

    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  })
}

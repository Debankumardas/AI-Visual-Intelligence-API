import { describe, expect, it } from "vitest"

import {
  circularLayout,
  classRows,
  interactionGraph,
  trackRows,
} from "./analytics"
import { classColor } from "./vision"

describe("classRows", () => {
  const analytics = {
    class_detection_counts: { car: 10, person: 40, bus: 10 },
    class_presence_ratio: { person: 1, car: 0.25 },
    active_frames_by_class: { person: 58, car: 14 },
    first_detection_frame: { person: 0, car: 70 },
    last_detection_frame: { person: 399, car: 210 },
    unique_track_ids_by_class: { person: 3, car: 2 },
  }

  it("sorts by count, then name, and carries the class colour", () => {
    const rows = classRows(analytics)

    expect(rows.map((row) => row.label)).toEqual(["person", "bus", "car"])
    expect(rows[0].color).toBe(classColor("person"))
  })

  it("joins the per-class details", () => {
    const person = classRows(analytics)[0]

    expect(person).toMatchObject({
      count: 40,
      presenceRatio: 1,
      activeFrames: 58,
      firstFrame: 0,
      lastFrame: 399,
      tracks: 3,
    })
  })

  it("defaults missing details to zero", () => {
    expect(classRows(analytics)[1]).toMatchObject({
      label: "bus",
      presenceRatio: 0,
      tracks: 0,
    })
  })

  it("copes with no classes at all", () => {
    expect(classRows({})).toEqual([])
  })
})

describe("trackRows", () => {
  const analytics = {
    track_duration_frames: { 1: 400, 2: 120, 3: 400 },
    track_observed_frames: { 1: 58, 2: 17 },
    track_persistence_ratio: { 1: 1, 2: 0.9 },
    track_distance_travelled: { 1: 455.73 },
    track_average_speed: { 1: 1.142 },
    track_max_speed: { 1: 4.394 },
  }

  it("turns string ids into numbers and sorts by lifetime", () => {
    expect(trackRows(analytics).map((row) => row.id)).toEqual([1, 3, 2])
  })

  it("joins movement and persistence per track", () => {
    expect(trackRows(analytics)[0]).toEqual({
      id: 1,
      durationFrames: 400,
      observedFrames: 58,
      persistence: 1,
      distance: 455.73,
      averageSpeed: 1.142,
      maxSpeed: 4.394,
    })
  })

  it("fills in zeros for a track that never moved", () => {
    expect(trackRows(analytics)[1]).toMatchObject({
      id: 3,
      observedFrames: 0,
      distance: 0,
    })
  })

  it("copes with no tracks", () => {
    expect(trackRows({})).toEqual([])
  })
})

describe("interactionGraph", () => {
  const analytics = {
    track_interaction_episodes: { "1,2": 3, "2,4": 1, "1,4": 2 },
    track_interaction_duration: { "1,2": 30, "1,4": 12 },
  }

  it("builds nodes with their episode and partner totals", () => {
    const { nodes } = interactionGraph(analytics)

    expect(nodes).toEqual([
      { id: 1, episodes: 5, partners: 2 },
      { id: 2, episodes: 4, partners: 2 },
      { id: 4, episodes: 3, partners: 2 },
    ])
  })

  it("lists pairs busiest first with their durations", () => {
    expect(interactionGraph(analytics).pairs).toEqual([
      { a: 1, b: 2, episodes: 3, durationFrames: 30 },
      { a: 1, b: 4, episodes: 2, durationFrames: 12 },
      { a: 2, b: 4, episodes: 1, durationFrames: 0 },
    ])
  })

  it("keeps only the busiest tracks when there are too many", () => {
    const graph = interactionGraph(analytics, 2)

    expect(graph.nodes.map((node) => node.id)).toEqual([1, 2])
    expect(graph.edges).toEqual([
      { a: 1, b: 2, episodes: 3, durationFrames: 30 },
    ])
    expect(graph.hiddenNodes).toBe(1)
    expect(graph.pairs).toHaveLength(3)
  })

  it("is empty when no tracks interacted", () => {
    expect(interactionGraph({})).toEqual({
      nodes: [],
      edges: [],
      pairs: [],
      hiddenNodes: 0,
    })
  })
})

describe("circularLayout", () => {
  it("puts a single node in the centre", () => {
    expect(circularLayout(1, 100, 100, 50)).toEqual([{ x: 100, y: 100 }])
  })

  it("starts at the top and spaces nodes evenly", () => {
    const [top, right] = circularLayout(4, 100, 100, 50)

    expect(top.x).toBeCloseTo(100)
    expect(top.y).toBeCloseTo(50)
    expect(right.x).toBeCloseTo(150)
    expect(right.y).toBeCloseTo(100)
  })

  it("keeps every node on the circle", () => {
    for (const point of circularLayout(7, 0, 0, 80)) {
      expect(Math.hypot(point.x, point.y)).toBeCloseTo(80)
    }
  })
})

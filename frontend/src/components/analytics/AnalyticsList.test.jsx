import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import AnalyticsList from "./AnalyticsList"
import ClassBreakdownGrid from "./ClassBreakdownGrid"

describe("AnalyticsList", () => {
  it("renders entries and formats non-integer numbers", () => {
    render(
      <AnalyticsList
        title="Detections by Class"
        data={{ person: 3, car: 0.3333 }}
      />,
    )

    expect(screen.getByText("Detections by Class")).toBeInTheDocument()
    expect(screen.getByText("person")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("0.33")).toBeInTheDocument()
  })

  it("shows the default empty message", () => {
    render(<AnalyticsList title="Empty" data={{}} />)

    expect(
      screen.getByText("No analytics available."),
    ).toBeInTheDocument()
  })

  it("shows a custom empty message and tolerates missing data", () => {
    render(
      <AnalyticsList
        title="Empty"
        emptyMessage="Nothing here."
      />,
    )

    expect(screen.getByText("Nothing here.")).toBeInTheDocument()
  })
})

describe("ClassBreakdownGrid", () => {
  it("renders the four class breakdown lists", () => {
    render(
      <ClassBreakdownGrid
        analytics={{
          class_detection_counts: { person: 2 },
          active_frames_by_class: {},
          unique_track_ids_by_class: {},
          track_interaction_episode_counts: {},
        }}
      />,
    )

    expect(screen.getByText("Detections by Class")).toBeInTheDocument()
    expect(screen.getByText("Active Frames by Class")).toBeInTheDocument()
    expect(screen.getByText("Unique Tracks by Class")).toBeInTheDocument()
    expect(
      screen.getByText("No interaction episodes detected for this video."),
    ).toBeInTheDocument()
  })
})

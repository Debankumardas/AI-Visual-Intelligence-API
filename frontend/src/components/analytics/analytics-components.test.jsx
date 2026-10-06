import { act, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import ChartCard from "./ChartCard"
import DataTable from "./DataTable"
import InteractionNetwork from "./InteractionNetwork"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("DataTable", () => {
  const columns = [
    { key: "name", label: "Name" },
    {
      key: "value",
      label: "Value",
      numeric: true,
      format: (value) => `${value}%`,
    },
  ]

  it("is collapsed until opened and has a caption", () => {
    render(
      <DataTable
        caption="Sample data"
        columns={columns}
        rows={[{ name: "a", value: 5 }]}
      />,
    )

    expect(document.querySelector("details")).not.toHaveAttribute("open")
    expect(screen.getByText("View as table")).toBeInTheDocument()
    expect(screen.getByRole("table", { hidden: true })).toHaveAccessibleName(
      "Sample data",
    )
  })

  it("renders the header, formatted cells and numeric alignment", () => {
    render(
      <DataTable
        caption="Sample data"
        columns={columns}
        rows={[
          { name: "a", value: 5 },
          { name: "b", value: 7 },
        ]}
      />,
    )

    const table = screen.getByRole("table", { hidden: true })

    expect(
      within(table).getAllByRole("columnheader", { hidden: true }),
    ).toHaveLength(2)
    expect(within(table).getByText("7%")).toHaveClass("text-right")
    expect(within(table).getByText("b")).not.toHaveClass("text-right")
  })

  it("uses a custom summary label", () => {
    render(
      <DataTable
        label="Show pairs"
        caption="Pairs"
        columns={columns}
        rows={[]}
      />,
    )

    expect(screen.getByText("Show pairs")).toBeInTheDocument()
  })
})

describe("ChartCard", () => {
  it("renders no chart until it has a width", () => {
    const children = vi.fn(() => <p>chart</p>)

    render(
      <ChartCard id="c" title="T" height={100} summary="A chart.">
        {children}
      </ChartCard>,
    )

    expect(children).not.toHaveBeenCalled()
    expect(screen.getByRole("img", { name: "A chart." })).toHaveStyle({
      height: "100px",
    })
  })

  it("renders the chart at the measured width", () => {
    let report

    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback) {
          report = callback
        }

        observe() {}

        disconnect() {}
      },
    )

    const children = vi.fn((width) => <p>chart at {width}</p>)

    render(
      <ChartCard id="c" title="T" height={100} summary="A chart.">
        {children}
      </ChartCard>,
    )

    act(() => report([{ contentRect: { width: 420 } }]))

    expect(screen.getByText("chart at 420")).toBeInTheDocument()
  })

  it("names the card by its title", () => {
    render(
      <ChartCard id="c" title="Detections" height={50} summary="s">
        {() => null}
      </ChartCard>,
    )

    expect(
      screen.getByRole("region", { name: "Detections" }),
    ).toBeInTheDocument()
  })
})

describe("InteractionNetwork", () => {
  const analytics = {
    track_interaction_episodes: { "1,2": 3, "2,4": 1 },
    track_interaction_duration: { "1,2": 30 },
  }

  it("draws a node per track and a line per pair", () => {
    const { container } = render(<InteractionNetwork analytics={analytics} />)

    expect(container.querySelectorAll("circle")).toHaveLength(3)
    expect(container.querySelectorAll("line")).toHaveLength(2)
  })

  it("makes busier pairs thicker", () => {
    const { container } = render(<InteractionNetwork analytics={analytics} />)

    const [busy, quiet] = [...container.querySelectorAll("line")].map(
      (line) => Number(line.getAttribute("stroke-width")),
    )

    expect(busy).toBeGreaterThan(quiet)
  })

  it("describes nodes and pairs for hover and assistive technology", () => {
    const { container } = render(<InteractionNetwork analytics={analytics} />)

    const titles = [...container.querySelectorAll("title")].map(
      (title) => title.textContent,
    )

    expect(titles).toContain("Track 1 and track 2: 3 episodes")
    expect(titles).toContain("Track 2 and track 4: 1 episode")
    expect(titles).toContain("Track 2: 4 episodes with 2 partners")
  })

  it("explains when nothing interacted", () => {
    render(<InteractionNetwork analytics={{}} />)

    expect(
      screen.getByText("No interactions in this video"),
    ).toBeInTheDocument()
    expect(document.querySelector("svg[role='img']")).toBeNull()
  })

  it("notes when only the busiest tracks are drawn", () => {
    const episodes = {}

    for (let id = 1; id <= 16; id++) {
      episodes[`${id},${id + 1}`] = 1
    }

    render(
      <InteractionNetwork
        analytics={{ track_interaction_episodes: episodes }}
      />,
    )

    expect(screen.getByText(/The 14 busiest of 17 tracks/)).toBeInTheDocument()
  })
})

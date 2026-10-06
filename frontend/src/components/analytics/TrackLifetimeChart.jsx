import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatNumber, formatPercent } from "../../utils/format"
import { chartTheme } from "../../utils/chartTheme"
import ChartCard from "./ChartCard"
import ChartTooltip from "./ChartTooltip"
import DataTable from "./DataTable"

const ROW_HEIGHT = 30
const MAX_BARS = 12

/** How long each tracked object stayed in the video. */
function TrackLifetimeChart({ rows }) {
  const shown = rows.slice(0, MAX_BARS).map((row) => ({
    ...row,
    label: `Track ${row.id}`,
  }))

  const height = shown.length * ROW_HEIGHT + 40

  const description =
    rows.length > MAX_BARS
      ? `The ${MAX_BARS} longest-lived of ${rows.length} tracks. Lifetime is counted in video frames.`
      : "How many video frames each tracked object stayed in view."

  return (
    <ChartCard
      id="track-chart"
      title="Track lifetimes"
      description={description}
      height={height}
      summary={`Bar chart of how many frames each track lasted: ${shown
        .map((row) => `${row.label} ${row.durationFrames}`)
        .join(", ")}.`}
      table={
        <DataTable
          caption="Track lifetime, persistence and movement"
          columns={[
            { key: "id", label: "Track", numeric: true },
            {
              key: "durationFrames",
              label: "Lifetime (frames)",
              numeric: true,
            },
            { key: "observedFrames", label: "Frames seen", numeric: true },
            {
              key: "persistence",
              label: "Persistence",
              numeric: true,
              format: (value) => formatPercent(value, 0),
            },
            {
              key: "distance",
              label: "Distance (px)",
              numeric: true,
              format: (value) => formatNumber(value),
            },
            {
              key: "averageSpeed",
              label: "Avg speed (px/frame)",
              numeric: true,
              format: (value) => formatNumber(value),
            },
          ]}
          rows={rows}
        />
      }
    >
      {(width) => (
        <BarChart
          data={shown}
          layout="vertical"
          width={width}
          height={height}
          margin={{ top: 4, right: 48, bottom: 4, left: 0 }}
        >
          <CartesianGrid horizontal={false} stroke={chartTheme.grid} />

          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: chartTheme.text, fontSize: 12 }}
            stroke={chartTheme.grid}
          />

          <YAxis
            type="category"
            dataKey="label"
            width={72}
            tick={{ fill: chartTheme.label, fontSize: 13 }}
            stroke={chartTheme.grid}
          />

          <Tooltip
            cursor={{ fill: chartTheme.cursor }}
            content={
              <ChartTooltip
                title={(row) => row.label}
                lines={(row) => [
                  ["Lifetime", `${formatNumber(row.durationFrames)} frames`],
                  ["Frames seen", formatNumber(row.observedFrames)],
                  ["Persistence", formatPercent(row.persistence, 0)],
                  ["Distance", `${formatNumber(row.distance)} px`],
                ]}
              />
            }
          />

          <Bar
            dataKey="durationFrames"
            fill={chartTheme.accent}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="durationFrames"
              position="right"
              fill={chartTheme.label}
              fontSize={12}
            />
          </Bar>
        </BarChart>
      )}
    </ChartCard>
  )
}

export default TrackLifetimeChart

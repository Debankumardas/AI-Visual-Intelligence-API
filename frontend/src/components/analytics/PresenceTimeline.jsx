import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatNumber, formatPercent } from "../../utils/format"
import { chartTheme } from "../../utils/chartTheme"
import ChartCard from "./ChartCard"
import ChartTooltip from "./ChartTooltip"
import DataTable from "./DataTable"

const ROW_HEIGHT = 36

/** From the first to the last frame each class was seen. */
function PresenceTimeline({ rows, sourceFrameCount }) {
  const data = rows.map((row) => ({
    ...row,
    start: row.firstFrame,
    span: row.lastFrame - row.firstFrame + 1,
  }))

  const height = rows.length * ROW_HEIGHT + 40

  const summary = `Timeline of when each class appears: ${rows
    .map(
      (row) =>
        `${row.label} from frame ${row.firstFrame} to ${row.lastFrame}`,
    )
    .join(", ")}.`

  return (
    <ChartCard
      id="presence-chart"
      title="When each class appears"
      description="From the first to the last frame where a class was detected."
      height={height}
      summary={summary}
      table={
        <DataTable
          caption="First and last frame per class"
          columns={[
            { key: "label", label: "Class" },
            { key: "firstFrame", label: "First frame", numeric: true },
            { key: "lastFrame", label: "Last frame", numeric: true },
            {
              key: "presenceRatio",
              label: "Frames present",
              numeric: true,
              format: (value) => formatPercent(value, 0),
            },
          ]}
          rows={rows}
        />
      }
    >
      {(width) => (
        <BarChart
          data={data}
          layout="vertical"
          width={width}
          height={height}
          margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
        >
          <CartesianGrid horizontal={false} stroke={chartTheme.grid} />

          <XAxis
            type="number"
            domain={[0, Math.max(1, sourceFrameCount)]}
            allowDecimals={false}
            tick={{ fill: chartTheme.text, fontSize: 12 }}
            stroke={chartTheme.grid}
          />

          <YAxis
            type="category"
            dataKey="label"
            width={88}
            tick={{ fill: chartTheme.label, fontSize: 13 }}
            stroke={chartTheme.grid}
          />

          <Tooltip
            cursor={{ fill: chartTheme.cursor }}
            content={
              <ChartTooltip
                title={(row) => row.label}
                lines={(row) => [
                  ["Seen from frame", formatNumber(row.firstFrame)],
                  ["to frame", formatNumber(row.lastFrame)],
                  ["Frames present", formatPercent(row.presenceRatio, 0)],
                ]}
              />
            }
          />

          {/* An invisible bar pushes the visible one to its start. */}
          <Bar
            dataKey="start"
            stackId="range"
            fill="transparent"
            isAnimationActive={false}
          />

          <Bar
            dataKey="span"
            stackId="range"
            radius={4}
            minPointSize={4}
            isAnimationActive={false}
          >
            {data.map((row) => (
              <Cell key={row.label} fill={row.color} />
            ))}
          </Bar>
        </BarChart>
      )}
    </ChartCard>
  )
}

export default PresenceTimeline

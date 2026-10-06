import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

const ROW_HEIGHT = 36

function ClassBarChart({ rows }) {
  const height = rows.length * ROW_HEIGHT + 32

  const summary = `Bar chart of detections per class: ${rows
    .map((row) => `${row.label} ${row.count}`)
    .join(", ")}.`

  return (
    <ChartCard
      id="class-chart"
      title="Detections by class"
      description="How often each class was detected across the analyzed frames."
      height={height}
      summary={summary}
      table={
        <DataTable
          caption="Detections by class"
          columns={[
            { key: "label", label: "Class" },
            { key: "count", label: "Detections", numeric: true },
            {
              key: "presenceRatio",
              label: "Frames present",
              numeric: true,
              format: (value) => formatPercent(value, 0),
            },
            { key: "tracks", label: "Tracks", numeric: true },
          ]}
          rows={rows}
        />
      }
    >
      {(width) => (
        <BarChart
          data={rows}
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
                  ["Detections", formatNumber(row.count)],
                  ["Frames present", formatPercent(row.presenceRatio, 0)],
                  ["Tracks", formatNumber(row.tracks)],
                ]}
              />
            }
          />

          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            {rows.map((row) => (
              <Cell key={row.label} fill={row.color} />
            ))}

            <LabelList
              dataKey="count"
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

export default ClassBarChart

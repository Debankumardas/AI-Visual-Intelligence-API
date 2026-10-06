import { Network } from "lucide-react"

import { circularLayout, interactionGraph } from "../../utils/analytics"
import { formatNumber } from "../../utils/format"
import Card, { CardHeader } from "../ui/Card"
import EmptyState from "../ui/EmptyState"
import DataTable from "./DataTable"

const SIZE = { width: 480, height: 360 }
const RADIUS = 130
const EDGE_COLOR = "#9099a8"

const plural = (count, one, many) => (count === 1 ? one : many)

/**
 * Tracks that came close to one another, as a graph. A node is a
 * track, a line is a pair that interacted, and thicker lines mean
 * more separate episodes.
 */
function InteractionNetwork({ analytics }) {
  const graph = interactionGraph(analytics)

  if (graph.pairs.length === 0) {
    return (
      <Card aria-labelledby="network-heading">
        <CardHeader
          id="network-heading"
          title="Track interactions"
          description="Which tracked objects came close to each other."
        />

        <EmptyState
          icon={Network}
          title="No interactions in this video"
          description="No two tracked objects came within 50 pixels of each other."
        />
      </Card>
    )
  }

  const positions = new Map(
    circularLayout(
      graph.nodes.length,
      SIZE.width / 2,
      SIZE.height / 2,
      RADIUS,
    ).map((point, index) => [graph.nodes[index].id, point]),
  )

  const mostPartners = Math.max(
    1,
    ...graph.nodes.map((node) => node.partners),
  )

  const description =
    graph.hiddenNodes > 0
      ? `The ${graph.nodes.length} busiest of ${graph.nodes.length + graph.hiddenNodes} tracks. All pairs are in the table.`
      : "Nodes are tracks. Thicker lines mean more separate episodes of two tracks coming close."

  return (
    <Card aria-labelledby="network-heading">
      <CardHeader
        id="network-heading"
        title="Track interactions"
        description={description}
      />

      <svg
        viewBox={`0 0 ${SIZE.width} ${SIZE.height}`}
        role="img"
        aria-label={`Network of ${graph.nodes.length} tracks with ${graph.edges.length} interacting pairs. A table with the same data follows.`}
        className="mx-auto mt-4 block w-full max-w-xl"
      >
        {graph.edges.map((edge) => {
          const from = positions.get(edge.a)
          const to = positions.get(edge.b)

          return (
            <line
              key={`${edge.a}-${edge.b}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={EDGE_COLOR}
              strokeOpacity="0.7"
              strokeWidth={1.5 + Math.min(6, edge.episodes)}
              strokeLinecap="round"
            >
              <title>
                {`Track ${edge.a} and track ${edge.b}: ${edge.episodes} ${plural(edge.episodes, "episode", "episodes")}`}
              </title>
            </line>
          )
        })}

        {graph.nodes.map((node) => {
          const { x, y } = positions.get(node.id)
          const radius = 14 + (node.partners / mostPartners) * 8

          return (
            <g key={node.id}>
              <circle cx={x} cy={y} r={radius} fill="#22d3ee">
                <title>
                  {`Track ${node.id}: ${node.episodes} ${plural(node.episodes, "episode", "episodes")} with ${node.partners} ${plural(node.partners, "partner", "partners")}`}
                </title>
              </circle>

              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#04181c"
                fontSize="12"
                fontWeight="600"
              >
                {node.id}
              </text>
            </g>
          )
        })}
      </svg>

      <DataTable
        caption="Pairs of tracks that interacted"
        columns={[
          { key: "a", label: "Track", numeric: true },
          { key: "b", label: "Other track", numeric: true },
          { key: "episodes", label: "Episodes", numeric: true },
          {
            key: "durationFrames",
            label: "Time together (frames)",
            numeric: true,
            format: (value) => formatNumber(value),
          },
        ]}
        rows={graph.pairs.map((pair) => ({
          ...pair,
          key: `${pair.a}-${pair.b}`,
        }))}
      />
    </Card>
  )
}

export default InteractionNetwork

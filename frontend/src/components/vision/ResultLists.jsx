import { formatNumber, formatPercent } from "../../utils/format"
import { classColor, formatBox } from "../../utils/vision"
import ResultRow from "./ResultRow"

function List({ label, children }) {
  return (
    <ul aria-label={label} className="-mx-1 space-y-0.5">
      {children}
    </ul>
  )
}

/** Detections, segments and recognised text: one row per shape. */
export function ShapeList({ label, shapes, activeId, selectedId, onHover, onSelect }) {
  return (
    <List label={label}>
      {shapes.map((shape) => (
        <ResultRow
          key={shape.id}
          color={shape.color}
          title={shape.text ?? shape.label}
          value={formatPercent(shape.confidence)}
          fraction={shape.confidence}
          detail={
            shape.kind === "polygon"
              ? `${shape.polygon.length} outline points`
              : formatBox(shape.box)
          }
          active={activeId === shape.id}
          selected={selectedId === shape.id}
          onHover={(hovering) => onHover(hovering ? shape.id : null)}
          onSelect={() => onSelect(shape.id)}
        />
      ))}
    </List>
  )
}

/** Top classifications. Not tied to a place in the image. */
export function PredictionList({ predictions }) {
  return (
    <List label="Top predictions">
      {predictions.map((prediction) => (
        <ResultRow
          key={prediction.label}
          title={prediction.label}
          value={formatPercent(prediction.confidence)}
          fraction={prediction.confidence}
          dense
        />
      ))}
    </List>
  )
}

/** Objects per class. */
export function CountList({ counts }) {
  const largest = Math.max(1, ...counts.map((entry) => entry.count))

  return (
    <List label="Objects per class">
      {counts.map((entry) => (
        <ResultRow
          key={entry.label}
          color={classColor(entry.label)}
          title={entry.label}
          value={formatNumber(entry.count)}
          fraction={entry.count / largest}
        />
      ))}
    </List>
  )
}

import { formatMs } from "../../utils/format"
import { describeImageResult } from "../../utils/vision"
import MetricTile from "../ui/MetricTile"
import { CountList, PredictionList, ShapeList } from "./ResultLists"

const EMPTY_MESSAGES = {
  analyze: "No objects found. Try a clearer image, or another mode.",
  detect: "No objects found. Try a clearer image, or another mode.",
  segment: "No objects found. Try a clearer image, or another mode.",
  text: "No text found. Text needs to be sharp and well lit.",
  count: "Nothing to count in this image.",
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="mb-1.5 text-sm font-medium text-muted">{title}</h3>
      {children}
    </section>
  )
}

/** What the model found, as lists that match the shapes on the image. */
function ImageResults({
  mode,
  entry,
  shapes,
  activeId,
  selectedId,
  onHover,
  onSelect,
}) {
  const { result, elapsedMs } = entry
  const { count, summary } = describeImageResult(mode, result)

  const shapeLabels = {
    analyze: "Detected objects",
    detect: "Detected objects",
    segment: "Segmented objects",
    text: "Recognised text",
  }

  return (
    <div className="space-y-5">
      <h2 className="sr-only">Results</h2>

      <p className="text-sm font-medium text-fg">{summary}</p>

      {mode === "count" && result.counts?.length > 0 && (
        <Section title="Objects per class">
          <CountList counts={result.counts} />
        </Section>
      )}

      {mode !== "count" && shapes.length > 0 && (
        <Section title={shapeLabels[mode]}>
          <ShapeList
            label={shapeLabels[mode]}
            shapes={shapes}
            activeId={activeId}
            selectedId={selectedId}
            onHover={onHover}
            onSelect={onSelect}
          />
        </Section>
      )}

      {mode === "analyze" && result.predictions?.length > 0 && (
        <Section title="Top predictions">
          <PredictionList predictions={result.predictions} />
        </Section>
      )}

      {count === 0 && (
        <p className="text-sm text-muted">{EMPTY_MESSAGES[mode]}</p>
      )}

      <Section title="Timing">
        <div className="grid grid-cols-2 gap-2">
          {mode === "analyze" && (
            <>
              <MetricTile
                label="Classification"
                value={formatMs(result.classification_inference_time_ms)}
                mono
              />

              <MetricTile
                label="Detection"
                value={formatMs(result.detection_inference_time_ms)}
                mono
              />
            </>
          )}

          <MetricTile label="Round trip" value={formatMs(elapsedMs)} mono />
        </div>
      </Section>
    </div>
  )
}

export default ImageResults

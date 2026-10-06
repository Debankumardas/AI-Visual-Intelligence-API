import { useRef } from "react"

import useElementWidth from "../../hooks/useElementWidth"
import Card, { CardHeader } from "../ui/Card"

/**
 * A titled card holding a chart, sized to its container.
 *
 * `children` is called with the measured width and only renders once
 * there is one, so a chart never mounts at zero size. The chart is a
 * picture to assistive technology: `summary` describes it and `table`
 * (a DataTable) carries the same data.
 */
function ChartCard({
  id,
  title,
  description,
  height,
  summary,
  table,
  children,
}) {
  const containerRef = useRef(null)
  const width = useElementWidth(containerRef)

  return (
    <Card aria-labelledby={id}>
      <CardHeader id={id} title={title} description={description} />

      <div
        ref={containerRef}
        role="img"
        aria-label={summary}
        style={{ height }}
        className="mt-4 w-full"
      >
        {width > 0 && children(width)}
      </div>

      {table}
    </Card>
  )
}

export default ChartCard

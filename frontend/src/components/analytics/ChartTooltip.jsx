/**
 * Recharts tooltip content. `lines(row)` returns [label, value] pairs
 * for the hovered row.
 */
function ChartTooltip({ active, payload, title, lines }) {
  const row = payload?.[0]?.payload

  if (!active || !row) {
    return null
  }

  return (
    <div className="rounded-control border border-hairline bg-raised px-3 py-2 text-xs shadow-float">
      <p className="mb-1 font-medium text-fg">{title(row)}</p>

      <dl className="space-y-0.5">
        {lines(row).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-muted">{label}</dt>
            <dd className="tnum font-mono text-fg">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default ChartTooltip

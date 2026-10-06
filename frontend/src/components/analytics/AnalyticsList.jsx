function formatValue(value) {
  if (typeof value !== "number") {
    return value
  }

  return Number.isInteger(value) ? value : value.toFixed(2)
}

function AnalyticsList({
  title,
  data,
  emptyMessage = "No analytics available.",
}) {
  const entries = Object.entries(data || {})

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="font-semibold text-white">
        {title}
      </h3>

      {entries.length ? (
        <div className="mt-4 space-y-2">
          {entries.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg bg-slate-950 px-4 py-3"
            >
              <span className="text-sm text-slate-300">
                {label}
              </span>

              <span className="text-sm font-semibold text-white">
                {formatValue(value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          {emptyMessage}
        </p>
      )}
    </div>
  )
}

export default AnalyticsList

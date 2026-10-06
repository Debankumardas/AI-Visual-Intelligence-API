function MetricTile({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-950 px-4 py-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  )
}

export default MetricTile

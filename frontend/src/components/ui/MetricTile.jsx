function MetricTile({ label, value, mono = false }) {
  return (
    <div className="rounded-control bg-sunken px-4 py-3">
      <p className="text-xs text-muted">{label}</p>

      <p
        className={`tnum mt-1 text-lg font-semibold text-fg ${
          mono ? "font-mono text-base font-medium" : ""
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export default MetricTile

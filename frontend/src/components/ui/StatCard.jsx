function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div
      role="group"
      aria-label={title}
      className="rounded-panel border border-hairline bg-surface p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{title}</p>

        {Icon && (
          <Icon
            size={16}
            aria-hidden="true"
            className="shrink-0 text-faint"
          />
        )}
      </div>

      <p className="tnum mt-2 text-3xl font-semibold leading-none text-fg">
        {value}
      </p>

      {subtitle && (
        <p className="mt-2 text-xs text-muted">{subtitle}</p>
      )}
    </div>
  )
}

export default StatCard

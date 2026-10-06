function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-2 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="rounded-lg bg-slate-800 p-2.5">
          <Icon size={20} className="text-slate-300" />
        </div>
      </div>
    </div>
  )
}

export default StatCard

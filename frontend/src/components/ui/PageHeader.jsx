function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-semibold text-fg">
          {title}
        </h1>

        {description && (
          <p className="mt-1 max-w-[65ch] text-sm text-muted">
            {description}
          </p>
        )}
      </div>

      {actions}
    </div>
  )
}

export default PageHeader

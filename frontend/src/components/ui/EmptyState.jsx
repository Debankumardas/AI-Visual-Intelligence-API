function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <Icon
          size={32}
          aria-hidden="true"
          className="mb-4 text-faint"
        />
      )}

      <h2 className="text-base font-semibold text-fg">{title}</h2>

      {description && (
        <p className="mt-1.5 max-w-[48ch] text-sm text-muted">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export default EmptyState

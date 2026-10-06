import { useId } from "react"

import { cn } from "../../utils/cn"

function Switch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  const labelId = useId()
  const descriptionId = useId()

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-medium text-fg">
          {label}
        </p>

        {description && (
          <p id={descriptionId} className="mt-0.5 text-sm text-muted">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className={cn(
            "relative h-6 w-11 rounded-full border transition-colors duration-150",
            checked
              ? "border-accent bg-accent"
              : "border-control bg-sunken",
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 size-4.5 rounded-full transition-transform duration-150",
              checked
                ? "translate-x-5 bg-on-accent"
                : "translate-x-0 bg-muted",
            )}
          />
        </span>
      </button>
    </div>
  )
}

export default Switch

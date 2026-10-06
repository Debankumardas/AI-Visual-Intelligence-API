import { useId } from "react"

import { cn } from "../../utils/cn"

/** A labelled input with hint and inline error. */
function TextField({
  label,
  hint,
  error,
  endAdornment,
  className,
  ...inputProps
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const describedBy =
    [error && errorId, hint && hintId].filter(Boolean).join(" ") ||
    undefined

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-fg"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "block min-h-11 w-full rounded-control border bg-sunken px-3 text-base text-fg transition-colors duration-150 hover:border-fg/50 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:text-sm",
            error ? "border-danger" : "border-control",
            endAdornment && "pr-12",
          )}
          {...inputProps}
        />

        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-sm text-danger"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default TextField

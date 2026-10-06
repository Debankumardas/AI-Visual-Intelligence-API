import { Loader2 } from "lucide-react"

import { buttonStyles } from "./buttonStyles"

function Button({
  variant,
  size,
  loading = false,
  loadingLabel,
  disabled,
  className,
  children,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading && (
        <Loader2
          size={16}
          aria-hidden="true"
          className="animate-spin-slow"
        />
      )}

      {loading && loadingLabel ? loadingLabel : children}
    </button>
  )
}

export default Button

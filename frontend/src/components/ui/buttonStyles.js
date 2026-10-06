import { cn } from "../../utils/cn"

const base =
  "inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium transition-colors duration-150 select-none disabled:cursor-not-allowed disabled:opacity-50"

const variants = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary:
    "border border-control bg-surface text-fg hover:bg-raised",
  ghost: "text-muted hover:bg-raised hover:text-fg",
  danger:
    "border border-danger/50 text-danger hover:bg-danger/10",
}

// 44 px targets on touch, denser on pointer devices.
const sizes = {
  md: "min-h-11 px-4 sm:min-h-10",
  sm: "min-h-11 px-3 sm:min-h-8",
  icon: "size-11 sm:size-10",
}

export function buttonStyles({
  variant = "secondary",
  size = "md",
  className,
} = {}) {
  return cn(base, variants[variant], sizes[size], className)
}

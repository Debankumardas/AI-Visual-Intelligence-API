import { cn } from "../../utils/cn"

const tones = {
  neutral: "border-hairline bg-raised text-muted",
  accent: "border-accent/30 bg-accent/10 text-accent",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
}

function Badge({ tone = "neutral", icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  )
}

export default Badge

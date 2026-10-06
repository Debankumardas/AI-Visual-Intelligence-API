import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react"

import { cn } from "../../utils/cn"

const tones = {
  info: {
    icon: Info,
    style: "border-accent/30 bg-accent/5",
    iconStyle: "text-accent",
  },
  success: {
    icon: CheckCircle2,
    style: "border-success/30 bg-success/5",
    iconStyle: "text-success",
  },
  warning: {
    icon: AlertTriangle,
    style: "border-warning/30 bg-warning/5",
    iconStyle: "text-warning",
  },
  danger: {
    icon: XCircle,
    style: "border-danger/30 bg-danger/5",
    iconStyle: "text-danger",
  },
}

/** Errors and warnings interrupt (role=alert); the rest are polite. */
function Alert({ tone = "info", title, children, action, className }) {
  const { icon: Icon, style, iconStyle } = tones[tone]
  const urgent = tone === "danger" || tone === "warning"

  return (
    <div
      role={urgent ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-panel border px-4 py-3",
        style,
        className,
      )}
    >
      <Icon
        size={18}
        aria-hidden="true"
        className={cn("mt-0.5 shrink-0", iconStyle)}
      />

      <div className="min-w-0 flex-1">
        {title && (
          <p className="text-sm font-medium text-fg">{title}</p>
        )}

        {children && (
          <div className="mt-0.5 text-sm text-muted">{children}</div>
        )}
      </div>

      {action}
    </div>
  )
}

export default Alert

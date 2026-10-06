import { Loader2 } from "lucide-react"

function Spinner({ label = "Loading…", size = 20 }) {
  return (
    <span
      role="status"
      className="inline-flex items-center gap-2 text-sm text-muted"
    >
      <Loader2
        size={size}
        aria-hidden="true"
        className="animate-spin-slow"
      />
      {label}
    </span>
  )
}

export default Spinner

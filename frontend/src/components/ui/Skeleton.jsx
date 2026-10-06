import { cn } from "../../utils/cn"

/** Placeholder block; size it to match the content it stands in for. */
function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton rounded-control", className)}
    />
  )
}

export default Skeleton

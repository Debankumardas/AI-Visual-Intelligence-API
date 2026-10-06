import { cn } from "../../utils/cn"

/**
 * One result. With `onSelect` it is a button that highlights the
 * matching shape on the image; without, it is plain information.
 */
function ResultRow({
  color,
  title,
  value,
  fraction,
  detail,
  active = false,
  selected = false,
  onHover,
  onSelect,
}) {
  const body = (
    <>
      <span className="flex items-center gap-3">
        {color && (
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-sm"
            style={{ background: color }}
          />
        )}

        <span className="min-w-0 flex-1 truncate text-sm text-fg">
          {title}
        </span>

        <span className="tnum font-mono text-sm text-fg">{value}</span>
      </span>

      {typeof fraction === "number" && (
        <span
          aria-hidden="true"
          className="mt-2 block h-1 overflow-hidden rounded-full bg-sunken"
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${Math.max(0, Math.min(1, fraction)) * 100}%`,
              background: color ?? "var(--color-accent)",
            }}
          />
        </span>
      )}

      {detail && (
        <span className="mt-1.5 block font-mono text-xs text-muted">
          {detail}
        </span>
      )}
    </>
  )

  const surface = cn(
    "block w-full rounded-control px-3 py-2.5 text-left transition-colors duration-150",
    active && "bg-raised",
  )

  if (!onSelect) {
    return <li className={surface}>{body}</li>
  }

  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        onPointerEnter={() => onHover?.(true)}
        onPointerLeave={() => onHover?.(false)}
        onFocus={() => onHover?.(true)}
        onBlur={() => onHover?.(false)}
        className={cn(surface, !active && "hover:bg-raised/60")}
      >
        {body}
      </button>
    </li>
  )
}

export default ResultRow

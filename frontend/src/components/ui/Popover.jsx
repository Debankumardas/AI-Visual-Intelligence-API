import { useEffect, useId, useRef, useState } from "react"

import { cn } from "../../utils/cn"

/**
 * A button-triggered floating panel. Closes on Escape (returning
 * focus to the trigger) and on clicks outside.
 *
 * `trigger` receives the props to spread onto the trigger button.
 * `children` may be a function receiving { close }.
 */
function Popover({ trigger, children, align = "right", className }) {
  const [open, setOpen] = useState(false)

  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={rootRef} className="relative">
      {trigger({
        ref: triggerRef,
        "aria-expanded": open,
        "aria-controls": open ? panelId : undefined,
        "aria-haspopup": "true",
        onClick: () => setOpen((current) => !current),
      })}

      {open && (
        <div
          id={panelId}
          className={cn(
            "fade-in scroll-contain absolute top-full z-20 mt-2 max-w-[calc(100vw-2rem)] rounded-overlay border border-hairline bg-raised shadow-float",
            align === "right" ? "right-0" : "left-0",
            className,
          )}
        >
          {typeof children === "function"
            ? children({ close })
            : children}
        </div>
      )}
    </div>
  )
}

export default Popover

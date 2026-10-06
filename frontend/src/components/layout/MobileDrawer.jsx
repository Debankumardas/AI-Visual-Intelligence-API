import { X } from "lucide-react"
import { useEffect, useRef } from "react"

import IconButton from "../ui/IconButton"

const FOCUSABLE = "a[href], button:not([disabled])"

/**
 * Navigation drawer for small screens. Traps focus, closes on Escape
 * or a click on the backdrop, locks page scroll and restores focus to
 * whatever opened it.
 */
function MobileDrawer({ open, onClose, children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const opener = document.activeElement
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"
    panelRef.current?.querySelector(FOCUSABLE)?.focus()

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose()
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const focusable = panelRef.current?.querySelectorAll(FOCUSABLE)

      if (!focusable?.length) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      opener?.focus?.()
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-30 lg:hidden">
      <div
        className="fade-in absolute inset-0 bg-black/60"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="fade-in scroll-contain absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-hairline bg-surface shadow-float"
      >
        <div className="absolute right-2 top-2">
          <IconButton
            label="Close navigation"
            icon={X}
            onClick={onClose}
          />
        </div>

        {children}
      </div>
    </div>
  )
}

export default MobileDrawer

import { useRef } from "react"

import { cn } from "../../utils/cn"

/**
 * ARIA tabs with a roving tabindex.
 * Pair with <TabPanel id={id} value={value}>.
 */
function Tabs({ id, label, items, value, onChange, className }) {
  const tabRefs = useRef({})

  const focusTab = (itemId) => {
    onChange(itemId)
    tabRefs.current[itemId]?.focus()
  }

  const handleKeyDown = (event, index) => {
    const lastIndex = items.length - 1

    const targets = {
      ArrowRight: index === lastIndex ? 0 : index + 1,
      ArrowLeft: index === 0 ? lastIndex : index - 1,
      Home: 0,
      End: lastIndex,
    }

    if (event.key in targets) {
      event.preventDefault()
      focusTab(items[targets[event.key]].id)
    }
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "scroll-contain flex gap-1 overflow-x-auto border-b border-hairline",
        className,
      )}
    >
      {items.map((item, index) => {
        const selected = item.id === value
        const Icon = item.icon

        return (
          <button
            key={item.id}
            ref={(node) => {
              tabRefs.current[item.id] = node
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`${id}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "-mb-px inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors duration-150 sm:min-h-10",
              selected
                ? "border-accent text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            {Icon && <Icon size={16} aria-hidden="true" />}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ id, value, className, children }) {
  return (
    <div
      role="tabpanel"
      id={`${id}-panel`}
      aria-labelledby={`${id}-tab-${value}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  )
}

export default Tabs

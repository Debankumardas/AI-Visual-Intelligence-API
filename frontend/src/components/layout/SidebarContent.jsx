import { NavLink } from "react-router"

import { cn } from "../../utils/cn"
import {
  isEnabled,
  NAV_ITEMS,
  SETTINGS_ITEM,
} from "../../routes/navigation"
import Brand from "./Brand"

function NavItem({ item, onNavigate }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "relative flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors duration-150",
          isActive
            ? "bg-raised text-fg before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-accent"
            : "text-muted hover:bg-raised/60 hover:text-fg",
        )
      }
    >
      <Icon size={18} aria-hidden="true" />
      {item.label}
    </NavLink>
  )
}

/** Brand, workspace links and Settings. Used by the rail and drawer. */
function SidebarContent({ preferences, onNavigate }) {
  const items = NAV_ITEMS.filter((item) =>
    isEnabled(item.preferenceKey, preferences),
  )

  return (
    <>
      <div className="px-5 py-5">
        <Brand />
      </div>

      <nav
        aria-label="Workspace"
        className="flex-1 space-y-1 px-3 py-2"
      >
        {items.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-hairline p-3">
        <NavItem item={SETTINGS_ITEM} onNavigate={onNavigate} />
      </div>
    </>
  )
}

export default SidebarContent

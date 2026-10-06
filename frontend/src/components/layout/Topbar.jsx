import {
  Bell,
  CircleUserRound,
  LogOut,
  Menu,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react"

import { cn } from "../../utils/cn"
import { formatRelativeTime } from "../../utils/time"
import Badge from "../ui/Badge"
import IconButton from "../ui/IconButton"
import Popover from "../ui/Popover"

const NOTIFICATION_DOT_COLORS = {
  analysis: "bg-accent",
  system: "bg-warning",
}

function NotificationsPanel({
  notifications,
  unreadCount,
  onMarkAllRead,
}) {
  return (
    <div className="w-80">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <h2 className="text-sm font-semibold text-fg">
          Notifications
        </h2>

        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="min-h-8 rounded-control px-2 text-xs font-medium text-muted transition-colors duration-150 hover:text-fg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-muted"
        >
          Mark all as read
        </button>
      </div>

      {notifications.length ? (
        <ul className="scroll-contain max-h-96 divide-y divide-hairline overflow-y-auto">
          {notifications.map((notification) => (
            <li key={notification.id} className="px-4 py-3.5">
              <div className="flex gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    notification.read
                      ? "bg-faint"
                      : (NOTIFICATION_DOT_COLORS[notification.kind] ??
                          "bg-accent"),
                  )}
                />

                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm",
                      notification.read ? "text-muted" : "text-fg",
                    )}
                  >
                    {notification.title}
                  </p>

                  <p className="mt-0.5 break-words text-xs text-muted">
                    {notification.message}
                  </p>

                  <p className="mt-1.5 text-xs text-muted">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-muted">
          No notifications yet.
        </p>
      )}
    </div>
  )
}

function Topbar({
  user,
  onLogout,
  apiOnline = false,
  notifications = [],
  onMarkAllRead = () => {},
  onOpenSettings = () => {},
  onOpenMenu = () => {},
}) {
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-hairline bg-ink/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="lg:hidden">
        <IconButton
          label="Open navigation"
          icon={Menu}
          onClick={onOpenMenu}
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div aria-live="polite">
          <Badge
            tone={apiOnline ? "success" : "danger"}
            icon={apiOnline ? Wifi : WifiOff}
          >
            {apiOnline ? "API online" : "API offline"}
          </Badge>
        </div>

        <Popover
          trigger={(triggerProps) => (
            <button
              type="button"
              {...triggerProps}
              aria-label={
                unreadCount
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications"
              }
              title="Notifications"
              className="relative inline-flex size-11 items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-raised hover:text-fg sm:size-10"
            >
              <Bell size={18} aria-hidden="true" />

              {unreadCount > 0 && (
                <span
                  data-testid="unread-badge"
                  className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent ring-2 ring-ink"
                />
              )}
            </button>
          )}
        >
          <NotificationsPanel
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={onMarkAllRead}
          />
        </Popover>

        <Popover
          trigger={(triggerProps) => (
            <button
              type="button"
              {...triggerProps}
              aria-label="Open user menu"
              className="flex min-h-11 items-center gap-2 rounded-control px-1.5 transition-colors duration-150 hover:bg-raised sm:min-h-10"
            >
              <CircleUserRound
                size={26}
                aria-hidden="true"
                className="text-muted"
              />

              <span className="hidden max-w-36 truncate text-sm font-medium text-fg sm:block">
                {user?.name || "Account"}
              </span>
            </button>
          )}
        >
          {({ close }) => (
            <div className="w-64 p-2">
              <div className="border-b border-hairline px-3 pb-3 pt-2">
                <p className="truncate text-sm font-medium text-fg">
                  {user?.name || "User"}
                </p>

                <p className="mt-0.5 truncate text-xs text-muted">
                  {user?.email || "No email available"}
                </p>

                <Badge className="mt-2">
                  {user?.role || "User"}
                </Badge>
              </div>

              <button
                type="button"
                onClick={() => {
                  close()
                  onOpenSettings()
                }}
                className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-sm text-fg transition-colors duration-150 hover:bg-surface"
              >
                <Settings size={16} aria-hidden="true" />
                Preferences
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-sm text-danger transition-colors duration-150 hover:bg-danger/10"
              >
                <LogOut size={16} aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </Popover>
      </div>
    </header>
  )
}

export default Topbar

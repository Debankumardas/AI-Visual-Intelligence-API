import { useState } from "react"
import {
  Bell,
  CircleUserRound,
  LogOut,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react"
import { formatRelativeTime } from "../../utils/time"

const NOTIFICATION_DOT_COLORS = {
  analysis: "bg-emerald-400",
  system: "bg-amber-400",
}

function Topbar({
  activePage,
  user,
  onLogout,
  apiOnline = false,
  notifications = [],
  onMarkAllRead = () => {},
  onNavigate = () => {},
}) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950 px-8">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">
          {activePage}
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Monitor and analyze your computer vision workloads
        </p>
      </div>

      {/* Topbar Actions */}
      <div className="flex items-center gap-5">
        {/* API Status */}
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
            apiOnline
              ? "border-emerald-900 bg-emerald-950/40"
              : "border-red-900 bg-red-950/40"
          }`}
        >
          {apiOnline ? (
            <Wifi size={14} className="text-emerald-400" />
          ) : (
            <WifiOff size={14} className="text-red-400" />
          )}

          <span
            className={`text-xs font-medium ${
              apiOnline
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {apiOnline ? "API Online" : "API Offline"}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setNotificationsOpen((open) => !open)
            }
            className="relative text-slate-400 transition hover:text-white"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={19} />

            {unreadCount > 0 && (
              <span
                data-testid="unread-badge"
                className="absolute -right-1 -top-1 flex h-2.5 w-2.5 rounded-full bg-emerald-400"
              />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <h3 className="text-sm font-semibold text-white">
                  Notifications
                </h3>

                <button
                  type="button"
                  onClick={onMarkAllRead}
                  disabled={unreadCount === 0}
                  className="text-xs text-slate-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-slate-500"
                >
                  Mark all as read
                </button>
              </div>

              {notifications.length ? (
                <ul className="max-h-96 divide-y divide-slate-800 overflow-y-auto">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="px-4 py-4"
                    >
                      <div className="flex gap-3">
                        <span
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            notification.read
                              ? "bg-slate-600"
                              : NOTIFICATION_DOT_COLORS[
                                  notification.kind
                                ] ?? "bg-emerald-400"
                          }`}
                        />

                        <div className="min-w-0">
                          <p
                            className={`text-sm ${
                              notification.read
                                ? "text-slate-400"
                                : "text-slate-200"
                            }`}
                          >
                            {notification.title}
                          </p>

                          <p className="mt-1 break-words text-xs text-slate-500">
                            {notification.message}
                          </p>

                          <p className="mt-2 text-[11px] text-slate-600">
                            {formatRelativeTime(
                              notification.createdAt,
                            )}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  No notifications yet.
                </p>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setProfileOpen((open) => !open)
            }
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-900"
            aria-label="Open user menu"
          >
            <CircleUserRound
              size={28}
              className="text-slate-400"
            />

            <div className="hidden text-left sm:block">
              <p className="max-w-32 truncate text-sm font-medium text-white">
                {user?.name || "User"}
              </p>

              <p className="max-w-40 truncate text-xs text-slate-500">
                {user?.email || "Account"}
              </p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-xl">
              {/* User Information */}
              <div className="border-b border-slate-800 px-3 py-3">
                <p className="truncate text-sm font-medium text-white">
                  {user?.name || "User"}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {user?.email || "No email available"}
                </p>

                <p className="mt-2 inline-flex rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-400">
                  {user?.role || "User"}
                </p>
              </div>

              {/* Preferences */}
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  onNavigate("Settings")
                }}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <Settings size={16} />
                <span>Preferences</span>
              </button>

              {/* Sign Out */}
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-950/40 hover:text-red-300"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
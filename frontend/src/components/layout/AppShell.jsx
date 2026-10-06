import { Suspense, useCallback, useRef, useState } from "react"
import { Outlet, useNavigate } from "react-router"

import useAuth from "../../hooks/useAuth"
import useWorkspace from "../../hooks/useWorkspace"
import Spinner from "../ui/Spinner"
import MobileDrawer from "./MobileDrawer"
import Sidebar from "./Sidebar"
import SidebarContent from "./SidebarContent"
import Topbar from "./Topbar"

/** Navigation, top bar and the routed page. */
function AppShell() {
  const { user, preferences, logout } = useAuth()
  const { apiOnline, notifications, markAllRead } = useWorkspace()

  const navigate = useNavigate()
  const mainRef = useRef(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <a
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          mainRef.current?.focus()
        }}
        className="skip-link"
      >
        Skip to main content
      </a>

      <Sidebar preferences={preferences} />

      <MobileDrawer open={drawerOpen} onClose={closeDrawer}>
        <SidebarContent
          preferences={preferences}
          onNavigate={closeDrawer}
        />
      </MobileDrawer>

      <div className="flex min-w-0 flex-col">
        <Topbar
          user={user}
          onLogout={logout}
          apiOnline={apiOnline}
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onOpenSettings={() => navigate("/settings")}
          onOpenMenu={() => setDrawerOpen(true)}
        />

        <main
          id="main"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <Suspense
            fallback={
              <div className="flex justify-center py-24">
                <Spinner label="Loading…" size={24} />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default AppShell

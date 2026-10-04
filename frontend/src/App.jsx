import { useEffect, useState } from "react"

import Login from "./components/auth/Login"
import Sidebar from "./components/layout/Sidebar"
import Topbar from "./components/layout/Topbar"
import StatCard from "./components/ui/StatCard"
import ImageAnalysis from "./pages/ImageAnalysis"
import VideoAnalysis from "./pages/VideoAnalysis"
import Analytics from "./pages/Analytics"
import Settings from "./pages/Settings"

import {
  Activity,
  Camera,
  FileImage,
  Video,
} from "lucide-react"

import {
  getCurrentUser,
  getPreferences,
} from "./services/api"


function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("access_token"),
  )

  const [user, setUser] = useState(null)
  const [preferences, setPreferences] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [activePage, setActivePage] = useState(
    "Dashboard",
  )
  const [videoAnalytics, setVideoAnalytics] =
    useState(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setAuthLoading(false)
        return
      }

      try {
        const currentUser = await getCurrentUser(token)
        setUser(currentUser)

        const userPreferences = await getPreferences(token)
        setPreferences(userPreferences)
      } catch {
        localStorage.removeItem("access_token")
        setToken(null)
        setUser(null)
        setPreferences(null)
      } finally {
        setAuthLoading(false)
      }
    }

    restoreSession()
  }, [token])

  useEffect(() => {
    const handleSessionExpired = () => {
      setSessionExpired(true)
      setToken(null)
      setUser(null)
      setPreferences(null)
      setVideoAnalytics(null)
      setActivePage("Dashboard")
    }

    window.addEventListener("session-expired", handleSessionExpired)

    return () => {
      window.removeEventListener("session-expired", handleSessionExpired)
    }
  }, [])

  const handleLogin = (accessToken) => {
    localStorage.setItem("access_token", accessToken)
    setSessionExpired(false)
    setToken(accessToken)
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    setToken(null)
    setUser(null)
    setPreferences(null)
    setVideoAnalytics(null)
    setActivePage("Dashboard")
  }

  const renderPage = () => {
    if (activePage === "Image Analysis") {
      return <ImageAnalysis />
    }

    if (activePage === "Video Analysis") {
      return (
        <VideoAnalysis
          onAnalyticsComplete={setVideoAnalytics}
        />
      )
    }

    if (activePage === "Analytics") {
      return (
        <Analytics
          videoAnalytics={videoAnalytics}
        />
      )
    }

if (activePage === "Settings") {
  return (
    <Settings
      user={user}
      preferences={preferences}
      onPreferencesChange={setPreferences}
    />
  )
}

    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Images Analyzed"
          value={videoAnalytics ? "1" : "0"}
          subtitle="Total image analysis jobs"
          icon={FileImage}
        />

        <StatCard
          title="Videos Processed"
          value={videoAnalytics ? "1" : "0"}
          subtitle="Total video processing jobs"
          icon={Video}
        />

        <StatCard
          title="Objects Detected"
          value={
            videoAnalytics
              ? videoAnalytics.total_detections
              : "0"
          }
          subtitle="Total detected objects"
          icon={Camera}
        />

        <StatCard
          title="Active Tracks"
          value={
            videoAnalytics
              ? videoAnalytics.unique_track_ids
              : "0"
          }
          subtitle="Currently tracked objects"
          icon={Activity}
        />

        <div className="sm:col-span-2 xl:col-span-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white">
              Computer Vision Workspace
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Upload images or videos to begin analysis
              and explore detection and tracking analytics.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-white" />

          <p className="mt-4 text-sm text-slate-400">
            Restoring session...
          </p>
        </div>
      </div>
    )
  }

  if (!token || !user) {
    return (
      <div>
        {sessionExpired && (
          <div className="fixed left-1/2 top-6 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200 shadow-lg">
            Your session has expired. Please log in again.
          </div>
        )}

        <Login onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
<Sidebar
  activePage={activePage}
  onNavigate={setActivePage}
  preferences={preferences}
/>

      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar
          activePage={activePage}
          user={user}
          onLogout={handleLogout}
        />

        <section className="flex-1 overflow-auto p-8">
          {renderPage()}
        </section>
      </main>
    </div>
  )
}

export default App
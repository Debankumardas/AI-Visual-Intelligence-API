import { useCallback, useEffect, useState } from "react"

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

import useNotifications from "./hooks/useNotifications"

import {
  checkHealth,
  getCurrentUser,
  getPreferences,
} from "./services/api"

const HEALTH_POLL_INTERVAL_MS = 30000

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

  const [sessionExpired, setSessionExpired] =
    useState(false)

  const [apiOnline, setApiOnline] = useState(false)

  const [imageAnalysesCount, setImageAnalysesCount] =
    useState(0)

  const [videoAnalysesCount, setVideoAnalysesCount] =
    useState(0)

  const {
    notifications,
    addNotification,
    markAllRead,
    clearNotifications,
  } = useNotifications(preferences)

  const resetSessionData = useCallback(() => {
    setVideoAnalytics(null)
    setImageAnalysesCount(0)
    setVideoAnalysesCount(0)
    clearNotifications()
  }, [clearNotifications])

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setAuthLoading(false)
        return
      }

      try {
        const currentUser = await getCurrentUser(token)

        setUser(currentUser)
        setSessionExpired(false)

        const userPreferences =
          await getPreferences(token)

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
    localStorage.removeItem("access_token")

    setSessionExpired(true)
    setToken(null)
    setUser(null)
    setPreferences(null)
    resetSessionData()
    setActivePage("Dashboard")
  }

    window.addEventListener(
      "session-expired",
      handleSessionExpired,
    )

    return () => {
      window.removeEventListener(
        "session-expired",
        handleSessionExpired,
      )
    }
  }, [resetSessionData])

  useEffect(() => {
    if (!user) {
      return undefined
    }

    let cancelled = false
    let previouslyOnline = null

    const pollHealth = async () => {
      let online

      try {
        await checkHealth()
        online = true
      } catch {
        online = false
      }

      if (cancelled) {
        return
      }

      setApiOnline(online)

      if (previouslyOnline !== null && previouslyOnline !== online) {
        addNotification(
          online
            ? {
                kind: "system",
                title: "API connection restored",
                message: "The backend is reachable again.",
              }
            : {
                kind: "system",
                title: "API connection lost",
                message: "The backend is not responding.",
              },
        )
      }

      previouslyOnline = online
    }

    pollHealth()

    const intervalId = setInterval(
      pollHealth,
      HEALTH_POLL_INTERVAL_MS,
    )

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [user, addNotification])

  const handleImageAnalysisComplete = (result) => {
    setImageAnalysesCount((count) => count + 1)

    const objectCount = result?.detections?.length ?? 0

    addNotification({
      kind: "analysis",
      title: "Image analysis completed",
      message: `${objectCount} ${
        objectCount === 1 ? "object" : "objects"
      } detected.`,
    })
  }

  const handleVideoAnalysisComplete = (analytics) => {
    setVideoAnalytics(analytics)
    setVideoAnalysesCount((count) => count + 1)

    addNotification({
      kind: "analysis",
      title: "Video analysis completed",
      message: `${analytics.total_detections} detections, ${analytics.unique_track_ids} unique tracks.`,
    })
  }

  const handleLogin = (accessToken) => {
    localStorage.setItem(
      "access_token",
      accessToken,
    )

    setSessionExpired(false)
    setToken(accessToken)
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")

    setToken(null)
    setUser(null)
    setPreferences(null)
    resetSessionData()
    setActivePage("Dashboard")
  }

  const isPageEnabled = (
    page,
    currentPreferences = preferences,
  ) => {
    if (!currentPreferences) {
      return true
    }

    const preferenceMap = {
      Dashboard: "dashboard_enabled",
      "Image Analysis": "image_analysis_enabled",
      "Video Analysis": "video_analysis_enabled",
    }

    const preferenceKey = preferenceMap[page]

    if (!preferenceKey) {
      return true
    }

    return Boolean(
      currentPreferences[preferenceKey],
    )
  }

  const getSafePage = (
    page,
    currentPreferences = preferences,
  ) => {
    if (
      isPageEnabled(
        page,
        currentPreferences,
      )
    ) {
      return page
    }

    if (
      currentPreferences?.dashboard_enabled
    ) {
      return "Dashboard"
    }

    return "Analytics"
  }

  const handleNavigate = (page) => {
    const safePage = getSafePage(
      page,
      preferences,
    )

    setActivePage(safePage)
  }

  /*
   * activePage can temporarily contain a disabled page
   * while preferences are being restored or changed.
   *
   * Always derive the page that is actually allowed to render.
   */
  const currentPage = getSafePage(
    activePage,
    preferences,
  )

  const renderPage = () => {
    if (currentPage === "Image Analysis") {
      return (
        <ImageAnalysis
          onAnalysisComplete={
            handleImageAnalysisComplete
          }
        />
      )
    }

    if (currentPage === "Video Analysis") {
      return (
        <VideoAnalysis
          onAnalyticsComplete={
            handleVideoAnalysisComplete
          }
        />
      )
    }

    if (currentPage === "Analytics") {
      return (
        <Analytics
          videoAnalytics={videoAnalytics}
        />
      )
    }

    if (currentPage === "Settings") {
      return (
        <Settings
          user={user}
          preferences={preferences}
          onPreferencesChange={
            setPreferences
          }
        />
      )
    }

    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Images Analyzed"
          value={String(imageAnalysesCount)}
          subtitle="Image analyses this session"
          icon={FileImage}
        />

        <StatCard
          title="Videos Processed"
          value={String(videoAnalysesCount)}
          subtitle="Video analyses this session"
          icon={Video}
        />

        <StatCard
          title="Objects Detected"
          value={
            videoAnalytics
              ? videoAnalytics.total_detections
              : "0"
          }
          subtitle="From the latest video analysis"
          icon={Camera}
        />

        <StatCard
          title="Unique Tracks"
          value={
            videoAnalytics
              ? videoAnalytics.unique_track_ids
              : "0"
          }
          subtitle="From the latest video analysis"
          icon={Activity}
        />

        <div className="sm:col-span-2 xl:col-span-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white">
              Computer Vision Workspace
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Upload images or videos to
              begin analysis and explore
              detection and tracking analytics.
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
            Your session has expired.
            Please log in again.
          </div>
        )}

        <Login onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar
        activePage={currentPage}
        onNavigate={handleNavigate}
        preferences={preferences}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar
          activePage={currentPage}
          user={user}
          onLogout={handleLogout}
          apiOnline={apiOnline}
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onNavigate={handleNavigate}
        />

        <section className="flex-1 overflow-auto p-8">
          {renderPage()}
        </section>
      </main>
    </div>
  )
}

export default App
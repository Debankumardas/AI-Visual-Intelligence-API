import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import useAuth from "../hooks/useAuth"
import useNotifications from "../hooks/useNotifications"
import { checkHealth } from "../services/api"
import { describeImageResult } from "../utils/vision"
import {
  loadVideoAnalytics,
  saveVideoAnalytics,
} from "../utils/workspaceStorage"
import { WorkspaceContext } from "./workspace-context"

const HEALTH_POLL_INTERVAL_MS = 30000

function createPreviewUrl(file) {
  return typeof URL.createObjectURL === "function"
    ? URL.createObjectURL(file)
    : null
}

/**
 * Everything the signed-in user has done this session: results,
 * counters, notifications and the backend connection state.
 *
 * Mount it with a key per user so signing out discards it all.
 */
function WorkspaceProvider({ children }) {
  const { user, preferences } = useAuth()

  const [apiOnline, setApiOnline] = useState(false)
  const [imageAnalysesCount, setImageAnalysesCount] = useState(0)
  const [videoAnalysesCount, setVideoAnalysesCount] = useState(0)
  const [lastImage, setLastImage] = useState(null)
  const [videoAnalytics, setVideoAnalytics] = useState(
    loadVideoAnalytics,
  )

  const { notifications, addNotification, markAllRead } =
    useNotifications(preferences)

  // The preview URL is owned here so the latest result can be shown
  // on other pages. Release it when it is replaced or on unmount.
  const lastImageUrl = useRef(null)

  useEffect(
    () => () => {
      if (lastImageUrl.current) {
        URL.revokeObjectURL(lastImageUrl.current)
      }
    },
    [],
  )

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

  const recordImageAnalysis = useCallback(
    ({ file, mode, result, size }) => {
      setImageAnalysesCount((count) => count + 1)

      if (lastImageUrl.current) {
        URL.revokeObjectURL(lastImageUrl.current)
      }

      const previewUrl = file ? createPreviewUrl(file) : null

      lastImageUrl.current = previewUrl

      setLastImage({
        name: file?.name ?? "image",
        previewUrl,
        size,
        mode,
        result,
      })

      addNotification({
        kind: "analysis",
        title: "Image analysis completed",
        message: describeImageResult(mode, result).summary,
      })
    },
    [addNotification],
  )

  const recordVideoAnalysis = useCallback(
    (analytics) => {
      setVideoAnalytics(analytics)
      saveVideoAnalytics(analytics)
      setVideoAnalysesCount((count) => count + 1)

      addNotification({
        kind: "analysis",
        title: "Video analysis completed",
        message: `${analytics.total_detections} detections, ${analytics.unique_track_ids} unique tracks.`,
      })
    },
    [addNotification],
  )

  const value = useMemo(
    () => ({
      apiOnline,
      notifications,
      markAllRead,
      imageAnalysesCount,
      videoAnalysesCount,
      lastImage,
      videoAnalytics,
      recordImageAnalysis,
      recordVideoAnalysis,
    }),
    [
      apiOnline,
      notifications,
      markAllRead,
      imageAnalysesCount,
      videoAnalysesCount,
      lastImage,
      videoAnalytics,
      recordImageAnalysis,
      recordVideoAnalysis,
    ],
  )

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export default WorkspaceProvider

import { useCallback, useEffect, useRef, useState } from "react"

const MAX_NOTIFICATIONS = 20

// Which user preference gates each kind of notification.
const PREFERENCE_BY_KIND = {
  analysis: "analysis_completed_notifications",
  system: "system_notifications",
}

export function isNotificationEnabled(kind, preferences) {
  // Preferences are still loading: don't drop notifications.
  if (!preferences) {
    return true
  }

  const preferenceKey = PREFERENCE_BY_KIND[kind]

  return preferenceKey
    ? Boolean(preferences[preferenceKey])
    : true
}

/**
 * In-memory notification list for the current session.
 *
 * `addNotification` ignores notifications the user switched off in
 * their preferences.
 */
function useNotifications(preferences) {
  const [notifications, setNotifications] = useState([])

  const preferencesRef = useRef(preferences)
  const nextId = useRef(1)

  useEffect(() => {
    preferencesRef.current = preferences
  }, [preferences])

  const addNotification = useCallback(
    ({ kind, title, message }) => {
      if (!isNotificationEnabled(kind, preferencesRef.current)) {
        return
      }

      const notification = {
        id: nextId.current++,
        kind,
        title,
        message,
        createdAt: Date.now(),
        read: false,
      }

      setNotifications((current) =>
        [notification, ...current].slice(0, MAX_NOTIFICATIONS),
      )
    },
    [],
  )

  const markAllRead = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    )
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length

  return {
    notifications,
    unreadCount,
    addNotification,
    markAllRead,
    clearNotifications,
  }
}

export default useNotifications

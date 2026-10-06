// The latest video analysis survives a page reload for the length of
// the browser session. Storage can be unavailable (private windows,
// blocked site data), so every access is guarded.
const VIDEO_ANALYTICS_KEY = "vision.videoAnalytics"

export function loadVideoAnalytics() {
  try {
    const raw = sessionStorage.getItem(VIDEO_ANALYTICS_KEY)

    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveVideoAnalytics(analytics) {
  try {
    if (analytics) {
      sessionStorage.setItem(
        VIDEO_ANALYTICS_KEY,
        JSON.stringify(analytics),
      )
    } else {
      sessionStorage.removeItem(VIDEO_ANALYTICS_KEY)
    }
  } catch {
    // Persistence is a convenience; ignore failures.
  }
}

export function clearWorkspaceStorage() {
  saveVideoAnalytics(null)
}

/**
 * Short relative time such as "Just now" or "5 min ago".
 */
export function formatRelativeTime(timestamp, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000))

  if (seconds < 60) {
    return "Just now"
  }

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) {
    return `${minutes} min ago`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours} h ago`
  }

  return `${Math.floor(hours / 24)} d ago`
}

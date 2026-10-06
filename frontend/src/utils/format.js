const integer = new Intl.NumberFormat("en")

const decimal = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
})

export function formatNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "–"
  }

  return Number.isInteger(value)
    ? integer.format(value)
    : decimal.format(value)
}

/** 0.9289 -> "92.9%" */
export function formatPercent(fraction, digits = 1) {
  if (typeof fraction !== "number" || Number.isNaN(fraction)) {
    return "–"
  }

  return `${(fraction * 100).toFixed(digits)}%`
}

export function formatMs(milliseconds) {
  if (typeof milliseconds !== "number" || Number.isNaN(milliseconds)) {
    return "–"
  }

  return milliseconds >= 1000
    ? `${decimal.format(milliseconds / 1000)} s`
    : `${decimal.format(milliseconds)} ms`
}

export function formatBytes(bytes) {
  if (typeof bytes !== "number" || bytes < 0) {
    return "–"
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${decimal.format(bytes / 1024)} KB`
  }

  return `${decimal.format(bytes / 1024 / 1024)} MB`
}

/** 75 -> "1:15" */
export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)

  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`
}

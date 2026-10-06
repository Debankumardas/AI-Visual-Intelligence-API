/**
 * A user-facing message for a failed analysis request. The backend
 * explains most problems in `detail`; blob responses carry no parsed
 * detail, so fall back on the status code.
 */
export function describeRequestError(error, fallback) {
  if (!error.response) {
    return "Can’t reach the API. Check that the backend is running."
  }

  const { status, data } = error.response

  if (typeof data?.detail === "string") {
    return data.detail
  }

  if (status === 413) {
    return "That file is too large."
  }

  if (status === 401) {
    return "Your session has expired. Sign in again."
  }

  return fallback
}

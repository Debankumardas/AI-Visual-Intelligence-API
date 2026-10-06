/** A user-facing message for a failed sign-in or sign-up request. */
export function describeAuthError(error, fallback) {
  if (!error.response) {
    return "Unable to connect to the API. Make sure the backend is running."
  }

  if (error.response.status === 401) {
    return "Invalid email or password."
  }

  const detail = error.response.data?.detail

  return typeof detail === "string" ? detail : fallback
}

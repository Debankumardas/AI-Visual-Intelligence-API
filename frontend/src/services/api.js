import axios from "axios"

// Use `??` so an explicit "/" (same-origin, behind Nginx) is respected.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000"

export const VIDEO_REQUEST_TIMEOUT_MS = 300000

/**
 * Human-readable backend location. A relative base URL means requests
 * go to the same origin and are forwarded by the reverse proxy.
 */
export const describeApiBaseUrl = (
  baseUrl = API_BASE_URL,
  origin = window.location.origin,
) => {
  if (/^https?:\/\//i.test(baseUrl)) {
    return { url: baseUrl, proxied: false }
  }

  const path = baseUrl.replace(/\/+$/, "")

  return { url: `${origin}${path}`, proxied: true }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
if (
  error.response?.status === 401 &&
  localStorage.getItem("access_token")
) {
  localStorage.removeItem("access_token")
  window.dispatchEvent(new Event("session-expired"))
}

    return Promise.reject(error)
  },
)

// ─────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────

export const checkHealth = async () => {
  const response = await api.get("/health")
  return response.data
}

// ─────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────

export const loginUser = async (email, password) => {
  const formData = new URLSearchParams()

  formData.append("username", email)
  formData.append("password", password)

  const response = await api.post(
    "/api/v1/auth/login",
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  )

  return response.data
}

export const getCurrentUser = async (token) => {
  const response = await api.get(
    "/api/v1/auth/me",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  return response.data
}

export const getPreferences = async (token) => {
  const response = await api.get(
    "/api/v1/auth/preferences",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  return response.data
}

export const updatePreferences = async (token, preferences) => {
  const response = await api.patch(
    "/api/v1/auth/preferences",
    preferences,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  return response.data
}

// ─────────────────────────────────────────────
// Image Analysis
// ─────────────────────────────────────────────

export const analyzeImage = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post(
    "/api/v1/analyze",
    formData,
  )

  return response.data
}

export const detectObjects = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post(
    "/api/v1/detect",
    formData,
  )

  return response.data
}

export const countObjects = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post(
    "/api/v1/detect/count",
    formData,
  )

  return response.data
}

export const trackObjects = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post(
    "/api/v1/detect/track",
    formData,
  )

  return response.data
}

export const classifyImage = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post(
    "/api/v1/predict",
    formData,
  )

  return response.data
}

// ─────────────────────────────────────────────
// Video Analysis
// ─────────────────────────────────────────────

export const analyzeVideo = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post(
    "/api/v1/video/analyze",
    formData,
    {
      timeout: VIDEO_REQUEST_TIMEOUT_MS,
    },
  )

  return response.data
}

export const getVideoMetadata = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post(
    "/api/v1/video/metadata",
    formData,
    {
      timeout: 60000,
    },
  )

  return response.data
}

export default api
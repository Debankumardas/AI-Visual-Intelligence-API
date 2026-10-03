import axios from "axios"

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 30000,
})

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
      timeout: 180000,
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
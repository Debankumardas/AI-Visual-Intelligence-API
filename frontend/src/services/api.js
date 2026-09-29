import axios from "axios"

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 30000,
})

export const checkHealth = async () => {
  const response = await api.get("/health")
  return response.data
}

export const analyzeImage = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post("/api/v1/analyze", formData)

  return response.data
}

export const detectObjects = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post("/api/v1/detect", formData)

  return response.data
}

export const countObjects = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post("/api/v1/detect/count", formData)

  return response.data
}

export const trackObjects = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post("/api/v1/detect/track", formData)

  return response.data
}

export const classifyImage = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post("/api/v1/predict", formData)

  return response.data
}

export const analyzeVideo = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post("/api/v1/video/analyze", formData)

  return response.data
}

export const getVideoMetadata = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post(
    "/api/v1/video/metadata",
    formData,
  )

  return response.data
}

export default api

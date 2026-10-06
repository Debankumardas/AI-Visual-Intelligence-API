import { vi } from "vitest"

export const mockUser = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  role: "Analyst",
  is_active: true,
}

export const defaultPreferences = {
  dashboard_enabled: true,
  image_analysis_enabled: true,
  video_analysis_enabled: true,
  analysis_completed_notifications: true,
  system_notifications: true,
}

export const readyModels = {
  status: "ready",
  models: {
    object_detection: "ready",
    image_classification: "ready",
  },
}

/**
 * The API module with the network calls replaced. Real helpers such as
 * describeApiBaseUrl are kept. Use inside a vi.mock factory.
 */
export async function mockApiModule(importOriginal) {
  return {
    ...(await importOriginal()),
    analyzeImage: vi.fn(),
    checkHealth: vi.fn(),
    countObjects: vi.fn(),
    detectAnnotated: vi.fn(),
    detectObjects: vi.fn(),
    extractText: vi.fn(),
    segmentImage: vi.fn(),
    getCurrentUser: vi.fn(),
    getPreferences: vi.fn(),
    getReadiness: vi.fn(),
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    updatePreferences: vi.fn(),
  }
}

/** Give every mocked API call a sensible default answer. */
export function primeApi(api, { preferences = defaultPreferences } = {}) {
  api.checkHealth.mockResolvedValue({ status: "healthy" })
  api.getCurrentUser.mockResolvedValue(mockUser)
  api.getPreferences.mockResolvedValue(preferences)
  api.getReadiness.mockResolvedValue(readyModels)
  api.loginUser.mockResolvedValue({ access_token: "test-access-token" })
  api.registerUser.mockResolvedValue(mockUser)
  api.updatePreferences.mockImplementation(async (token, changes) => ({
    ...preferences,
    ...changes,
  }))
}

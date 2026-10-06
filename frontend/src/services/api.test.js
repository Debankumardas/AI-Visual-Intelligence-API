import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("API base URL", () => {
  it("defaults to same-origin requests when no env value is set", async () => {
    vi.stubEnv("VITE_API_BASE_URL", undefined)

    const { default: api, API_BASE_URL } = await import("./api")

    expect(API_BASE_URL).toBe("/")
    expect(api.defaults.baseURL).toBe("/")
  })

  it("uses VITE_API_BASE_URL for the axios client", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:9000")

    const { default: api, API_BASE_URL } = await import("./api")

    expect(API_BASE_URL).toBe("http://127.0.0.1:9000")
    expect(api.defaults.baseURL).toBe("http://127.0.0.1:9000")
  })
})

describe("describeApiBaseUrl", () => {
  it("returns absolute URLs unchanged", async () => {
    const { describeApiBaseUrl } = await import("./api")

    expect(
      describeApiBaseUrl("http://127.0.0.1:8000", "http://localhost"),
    ).toEqual({
      url: "http://127.0.0.1:8000",
      proxied: false,
    })
  })

  it("resolves relative URLs against the page origin", async () => {
    const { describeApiBaseUrl } = await import("./api")

    expect(describeApiBaseUrl("/", "http://localhost")).toEqual({
      url: "http://localhost",
      proxied: true,
    })
  })
})

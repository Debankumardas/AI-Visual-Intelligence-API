import { describe, expect, it } from "vitest"

import { describeRequestError } from "./requestErrors"

describe("describeRequestError", () => {
  const fallback = "The analysis failed. Try again."

  it("explains a missing connection", () => {
    expect(describeRequestError(new Error("Network Error"), fallback)).toBe(
      "Can’t reach the API. Check that the backend is running.",
    )
  })

  it("prefers the server’s explanation", () => {
    expect(
      describeRequestError(
        {
          response: {
            status: 400,
            data: { detail: "Unsupported image format. Use JPEG, PNG, or WebP." },
          },
        },
        fallback,
      ),
    ).toBe("Unsupported image format. Use JPEG, PNG, or WebP.")
  })

  it("maps status codes when there is no detail", () => {
    expect(describeRequestError({ response: { status: 413 } }, fallback)).toBe(
      "That file is too large.",
    )

    expect(describeRequestError({ response: { status: 401 } }, fallback)).toBe(
      "Your session has expired. Sign in again.",
    )
  })

  it("falls back for anything else", () => {
    expect(
      describeRequestError({ response: { status: 500, data: new Blob() } }, fallback),
    ).toBe(fallback)
  })
})

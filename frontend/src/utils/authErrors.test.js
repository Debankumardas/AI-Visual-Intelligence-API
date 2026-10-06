import { describe, expect, it } from "vitest"

import { describeAuthError } from "./authErrors"

describe("describeAuthError", () => {
  const fallback = "Something went wrong."

  it("explains a missing connection", () => {
    expect(describeAuthError(new Error("Network Error"), fallback)).toBe(
      "Unable to connect to the API. Make sure the backend is running.",
    )
  })

  it("maps 401 to a credentials message", () => {
    expect(
      describeAuthError({ response: { status: 401 } }, fallback),
    ).toBe("Invalid email or password.")
  })

  it("uses the server’s detail when it is text", () => {
    expect(
      describeAuthError(
        { response: { status: 403, data: { detail: "This account is inactive." } } },
        fallback,
      ),
    ).toBe("This account is inactive.")
  })

  it("falls back when detail is missing or structured", () => {
    expect(
      describeAuthError({ response: { status: 422, data: { detail: [{}] } } }, fallback),
    ).toBe(fallback)

    expect(describeAuthError({ response: { status: 500 } }, fallback)).toBe(
      fallback,
    )
  })
})

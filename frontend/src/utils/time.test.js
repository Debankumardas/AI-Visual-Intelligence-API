import { describe, expect, it } from "vitest"

import { formatRelativeTime } from "./time"

describe("formatRelativeTime", () => {
  const now = 1_000_000_000_000

  it.each([
    [0, "Just now"],
    [59_000, "Just now"],
    [60_000, "1 min ago"],
    [59 * 60_000, "59 min ago"],
    [60 * 60_000, "1 h ago"],
    [23 * 3_600_000, "23 h ago"],
    [48 * 3_600_000, "2 d ago"],
  ])("formats %i ms ago as %s", (elapsed, expected) => {
    expect(formatRelativeTime(now - elapsed, now)).toBe(expected)
  })

  it("never returns a negative time for future timestamps", () => {
    expect(formatRelativeTime(now + 5_000, now)).toBe("Just now")
  })
})

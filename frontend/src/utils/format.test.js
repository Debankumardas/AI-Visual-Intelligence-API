import { describe, expect, it } from "vitest"

import {
  formatBytes,
  formatClock,
  formatMs,
  formatNumber,
  formatPercent,
  formatSeconds,
} from "./format"

describe("formatNumber", () => {
  it("groups integers and trims decimals", () => {
    expect(formatNumber(12345)).toBe("12,345")
    expect(formatNumber(0.33333)).toBe("0.33")
  })

  it("shows a dash for missing values", () => {
    expect(formatNumber(undefined)).toBe("–")
    expect(formatNumber(Number.NaN)).toBe("–")
  })
})

describe("formatPercent", () => {
  it("formats a fraction", () => {
    expect(formatPercent(0.9289)).toBe("92.9%")
    expect(formatPercent(1, 0)).toBe("100%")
  })

  it("shows a dash for missing values", () => {
    expect(formatPercent(null)).toBe("–")
  })
})

describe("formatMs", () => {
  it("switches to seconds from 1000 ms", () => {
    expect(formatMs(584.62)).toBe("584.62\u00a0ms")
    expect(formatMs(34362)).toBe("34.36\u00a0s")
  })
})

describe("formatBytes", () => {
  it("picks a sensible unit", () => {
    expect(formatBytes(512)).toBe("512\u00a0B")
    expect(formatBytes(2048)).toBe("2\u00a0KB")
    expect(formatBytes(5 * 1024 * 1024)).toBe("5\u00a0MB")
  })

  it("rejects negative sizes", () => {
    expect(formatBytes(-1)).toBe("–")
  })
})

describe("formatClock", () => {
  it("formats minutes and padded seconds", () => {
    expect(formatClock(0)).toBe("0:00")
    expect(formatClock(75.9)).toBe("1:15")
  })
})

describe("formatSeconds", () => {
  it("shows short durations in seconds", () => {
    expect(formatSeconds(13.33)).toBe("13.3\u00a0s")
    expect(formatSeconds(0)).toBe("0\u00a0s")
  })

  it("switches to minutes from one minute", () => {
    expect(formatSeconds(60)).toBe("1\u00a0min 0\u00a0s")
    expect(formatSeconds(125)).toBe("2\u00a0min 5\u00a0s")
  })

  it("shows a dash for missing values", () => {
    expect(formatSeconds(undefined)).toBe("–")
  })
})

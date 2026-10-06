import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import useNotifications, {
  isNotificationEnabled,
} from "./useNotifications"

const allEnabled = {
  analysis_completed_notifications: true,
  system_notifications: true,
}

const analysisNotification = {
  kind: "analysis",
  title: "Image analysis completed",
  message: "dog.jpg",
}

const systemNotification = {
  kind: "system",
  title: "API connection lost",
  message: "The backend is unreachable.",
}

describe("isNotificationEnabled", () => {
  it("allows everything while preferences are loading", () => {
    expect(isNotificationEnabled("analysis", null)).toBe(true)
    expect(isNotificationEnabled("system", null)).toBe(true)
  })

  it("follows the matching preference", () => {
    const preferences = {
      analysis_completed_notifications: false,
      system_notifications: true,
    }

    expect(isNotificationEnabled("analysis", preferences)).toBe(false)
    expect(isNotificationEnabled("system", preferences)).toBe(true)
  })
})

describe("useNotifications", () => {
  it("adds notifications newest first as unread", () => {
    const { result } = renderHook(() => useNotifications(allEnabled))

    act(() => {
      result.current.addNotification(analysisNotification)
      result.current.addNotification(systemNotification)
    })

    expect(result.current.notifications.map((n) => n.title)).toEqual([
      "API connection lost",
      "Image analysis completed",
    ])
    expect(result.current.unreadCount).toBe(2)
  })

  it("respects the analysis notification preference", () => {
    const { result } = renderHook(() =>
      useNotifications({
        ...allEnabled,
        analysis_completed_notifications: false,
      }),
    )

    act(() => {
      result.current.addNotification(analysisNotification)
      result.current.addNotification(systemNotification)
    })

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].kind).toBe("system")
  })

  it("uses the latest preferences", () => {
    const { result, rerender } = renderHook(
      ({ preferences }) => useNotifications(preferences),
      { initialProps: { preferences: allEnabled } },
    )

    rerender({
      preferences: { ...allEnabled, system_notifications: false },
    })

    act(() => {
      result.current.addNotification(systemNotification)
    })

    expect(result.current.notifications).toHaveLength(0)
  })

  it("marks all as read and clears", () => {
    const { result } = renderHook(() => useNotifications(allEnabled))

    act(() => {
      result.current.addNotification(analysisNotification)
    })

    act(() => {
      result.current.markAllRead()
    })

    expect(result.current.unreadCount).toBe(0)
    expect(result.current.notifications).toHaveLength(1)

    act(() => {
      result.current.clearNotifications()
    })

    expect(result.current.notifications).toHaveLength(0)
  })

  it("keeps only the 20 most recent notifications", () => {
    const { result } = renderHook(() => useNotifications(allEnabled))

    act(() => {
      for (let index = 0; index < 25; index++) {
        result.current.addNotification({
          ...analysisNotification,
          message: `file-${index}`,
        })
      }
    })

    expect(result.current.notifications).toHaveLength(20)
    expect(result.current.notifications[0].message).toBe("file-24")
  })
})

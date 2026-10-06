import {
  BarChart3,
  FileImage,
  Film,
  LayoutDashboard,
  Settings,
} from "lucide-react"

// The sidebar, the route guards and the page titles all read this list.
export const NAV_ITEMS = [
  {
    path: "/",
    label: "Overview",
    icon: LayoutDashboard,
    preferenceKey: "dashboard_enabled",
    end: true,
  },
  {
    path: "/image",
    label: "Image lab",
    icon: FileImage,
    preferenceKey: "image_analysis_enabled",
  },
  {
    path: "/video",
    label: "Video lab",
    icon: Film,
    preferenceKey: "video_analysis_enabled",
  },
  {
    path: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    preferenceKey: null,
  },
]

export const SETTINGS_ITEM = {
  path: "/settings",
  label: "Settings",
  icon: Settings,
  preferenceKey: null,
}

/** Preferences are still loading (null) or the page is switched on. */
export function isEnabled(preferenceKey, preferences) {
  if (!preferenceKey || !preferences) {
    return true
  }

  return Boolean(preferences[preferenceKey])
}

/** Where to send someone whose current page was switched off. */
export function fallbackPath(preferences) {
  return isEnabled("dashboard_enabled", preferences)
    ? "/"
    : "/analytics"
}

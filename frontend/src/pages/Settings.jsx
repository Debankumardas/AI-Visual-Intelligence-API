import { useState } from "react"
import {
  Bell,
  Database,
  Settings as SettingsIcon,
  UserRound,
  Wifi,
} from "lucide-react"
import {
  describeApiBaseUrl,
  updatePreferences,
} from "../services/api"

function Settings({
  user,
  preferences: savedPreferences,
  onPreferencesChange,
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const token = localStorage.getItem("access_token")

  const togglePreference = async (backendKey) => {
    if (!savedPreferences || !token || saving) {
      return
    }

    const newValue = !savedPreferences[backendKey]

    const previousPreferences = savedPreferences

    // Update the UI immediately
    onPreferencesChange({
      ...savedPreferences,
      [backendKey]: newValue,
    })

    setSaving(true)
    setError("")

    try {
      const updatedPreferences = await updatePreferences(
        token,
        {
          [backendKey]: newValue,
        },
      )

      // Use the backend response as the final source of truth
      onPreferencesChange(updatedPreferences)
    } catch {
      // Roll back the UI if the API request fails
      onPreferencesChange(previousPreferences)

      setError("Unable to save your preference.")
    } finally {
      setSaving(false)
    }
  }

  const loading = !savedPreferences

  const backendUrl = describeApiBaseUrl()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">
          Settings
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Manage your platform preferences and account configuration.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {/* Saving Status */}
      {saving && (
        <div
          role="status"
          className="text-xs text-slate-500"
        >
          Saving preference...
        </div>
      )}

      {/* General Settings */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <SectionHeader
          icon={SettingsIcon}
          title="General"
          description="General interface preferences."
        />

        <div className="mt-5 space-y-4">
          <SettingRow
            title="Interface"
            description="Configure the appearance of the platform."
            value="Dark"
          />

          <SettingRow
            title="Dashboard"
            description="Show analytics and system information on the dashboard."
            enabled={savedPreferences?.dashboard_enabled ?? false}
            disabled={loading || saving}
            onToggle={() =>
              togglePreference("dashboard_enabled")
            }
          />
        </div>
      </section>

      {/* Analysis Settings */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <SectionHeader
          icon={Database}
          title="Analysis"
          description="Configure analysis-related preferences."
        />

        <div className="mt-5 space-y-4">
          <SettingRow
            title="Image Analysis"
            description="Enable image classification and object detection."
            enabled={
              savedPreferences?.image_analysis_enabled ?? false
            }
            disabled={loading || saving}
            onToggle={() =>
              togglePreference("image_analysis_enabled")
            }
          />

          <SettingRow
            title="Video Analysis"
            description="Enable video detection and object tracking."
            enabled={
              savedPreferences?.video_analysis_enabled ?? false
            }
            disabled={loading || saving}
            onToggle={() =>
              togglePreference("video_analysis_enabled")
            }
          />
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <SectionHeader
          icon={Bell}
          title="Notifications"
          description="Control system and analysis notifications."
        />

        <div className="mt-5 space-y-4">
          <SettingRow
            title="Analysis Completed"
            description="Show a notification when an analysis finishes."
            enabled={
              savedPreferences?.analysis_completed_notifications ??
              false
            }
            disabled={loading || saving}
            onToggle={() =>
              togglePreference(
                "analysis_completed_notifications",
              )
            }
          />

          <SettingRow
            title="System Notifications"
            description="Show system and API status notifications."
            enabled={
              savedPreferences?.system_notifications ?? false
            }
            disabled={loading || saving}
            onToggle={() =>
              togglePreference("system_notifications")
            }
          />
        </div>
      </section>

      {/* API */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <SectionHeader
          icon={Wifi}
          title="API"
          description="Backend connection information."
        />

        <div className="mt-5 rounded-lg bg-slate-950 px-4 py-4">
          <p className="text-sm font-medium text-white">
            Backend URL
          </p>

          <p className="mt-1 break-all text-sm text-slate-400">
            {backendUrl.url}
          </p>

          {backendUrl.proxied && (
            <p className="mt-1 text-xs text-slate-500">
              Proxied to the backend by the dev server
            </p>
          )}
        </div>
      </section>

      {/* Account */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <SectionHeader
          icon={UserRound}
          title="Account"
          description="Authenticated account information."
        />

        <div className="mt-5 space-y-4">
          <div className="rounded-lg bg-slate-950 px-4 py-4">
            <p className="text-sm font-medium text-white">
              {user?.name || "User"}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {user?.email || "No email available"}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Role: {user?.role || "User"}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-slate-800 p-2">
        <Icon className="h-5 w-5 text-slate-300" />
      </div>

      <div>
        <h3 className="text-base font-semibold text-white">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          {description}
        </p>
      </div>
    </div>
  )
}

function SettingRow({
  title,
  description,
  enabled,
  onToggle,
  value,
  disabled = false,
}) {
  const interactive = typeof onToggle === "function"

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-950 px-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      {interactive ? (
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-pressed={enabled}
          aria-label={`Toggle ${title}`}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            enabled ? "bg-white" : "bg-slate-700"
          } ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full transition ${
              enabled
                ? "left-6 bg-slate-900"
                : "left-1 bg-slate-300"
            }`}
          />
        </button>
      ) : (
        <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
          {value}
        </span>
      )}
    </div>
  )
}

export default Settings
import { useState } from "react"

import Alert from "../components/ui/Alert"
import Card, { CardHeader } from "../components/ui/Card"
import PageHeader from "../components/ui/PageHeader"
import Skeleton from "../components/ui/Skeleton"
import Switch from "../components/ui/Switch"
import useAuth from "../hooks/useAuth"
import useDocumentTitle from "../hooks/useDocumentTitle"
import { describeApiBaseUrl, updatePreferences } from "../services/api"

const SECTIONS = [
  {
    title: "Pages",
    description: "Choose which pages appear in the navigation.",
    items: [
      {
        key: "dashboard_enabled",
        label: "Overview",
        description: "Session totals, model status and your latest result.",
      },
      {
        key: "image_analysis_enabled",
        label: "Image lab",
        description:
          "Classify, detect, segment, read text in and count objects in images.",
      },
      {
        key: "video_analysis_enabled",
        label: "Video lab",
        description: "Detect and track objects across a video.",
      },
    ],
  },
  {
    title: "Notifications",
    description: "Choose which events add a notification.",
    items: [
      {
        key: "analysis_completed_notifications",
        label: "Analysis completed",
        description: "When an image or video analysis finishes.",
      },
      {
        key: "system_notifications",
        label: "System status",
        description: "When the connection to the API drops or returns.",
      },
    ],
  },
]

function Settings() {
  useDocumentTitle("Settings")

  const { token, user, preferences, setPreferences } = useAuth()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const backendUrl = describeApiBaseUrl()

  const togglePreference = async (key) => {
    if (!preferences || !token || saving) {
      return
    }

    const previous = preferences

    // Update the screen straight away, then roll back if saving fails.
    setPreferences({ ...preferences, [key]: !preferences[key] })

    setSaving(true)
    setError("")

    try {
      const saved = await updatePreferences(token, {
        [key]: !previous[key],
      })

      setPreferences(saved)
    } catch {
      setPreferences(previous)
      setError("Unable to save your preference.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage what you see and which notifications you get."
      />

      {error && (
        <Alert tone="danger" title="Couldn’t save that change">
          Check your connection and try again. Your previous setting
          was restored.
        </Alert>
      )}

      <div aria-live="polite" className="text-xs text-muted">
        {saving ? "Saving preference…" : ""}
      </div>

      {SECTIONS.map((section) => (
        <Card key={section.title} aria-labelledby={`${section.title}-heading`}>
          <CardHeader
            id={`${section.title}-heading`}
            title={section.title}
            description={section.description}
          />

          <div className="mt-2 divide-y divide-hairline">
            {preferences
              ? section.items.map((item) => (
                  <Switch
                    key={item.key}
                    label={item.label}
                    description={item.description}
                    checked={Boolean(preferences[item.key])}
                    onChange={() => togglePreference(item.key)}
                    disabled={saving}
                  />
                ))
              : section.items.map((item) => (
                  <div key={item.key} className="py-3">
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
          </div>
        </Card>
      ))}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card aria-labelledby="account-heading">
          <CardHeader
            id="account-heading"
            title="Account"
            description="The account you’re signed in with."
          />

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Name</dt>
              <dd className="mt-0.5 font-medium text-fg">
                {user?.name || "–"}
              </dd>
            </div>

            <div>
              <dt className="text-muted">Email</dt>
              <dd className="mt-0.5 break-all font-medium text-fg">
                {user?.email || "–"}
              </dd>
            </div>

            <div>
              <dt className="text-muted">Role</dt>
              <dd className="mt-0.5 font-medium text-fg">
                {user?.role || "–"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card aria-labelledby="backend-heading">
          <CardHeader
            id="backend-heading"
            title="Backend"
            description="Where this app sends its requests."
          />

          <p className="mt-4 break-all font-mono text-sm text-fg">
            {backendUrl.url}
          </p>

          {backendUrl.proxied && (
            <p className="mt-1 text-xs text-muted">
              Proxied to the backend by the dev server.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Settings

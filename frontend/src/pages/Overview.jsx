import { Activity, Camera, FileImage, Film } from "lucide-react"
import { Link } from "react-router"

import ModelStatus from "../components/overview/ModelStatus"
import { buttonStyles } from "../components/ui/buttonStyles"
import Card, { CardHeader } from "../components/ui/Card"
import PageHeader from "../components/ui/PageHeader"
import StatCard from "../components/ui/StatCard"
import useAuth from "../hooks/useAuth"
import useDocumentTitle from "../hooks/useDocumentTitle"
import useWorkspace from "../hooks/useWorkspace"
import { isEnabled } from "../routes/navigation"
import { formatNumber } from "../utils/format"

function Overview() {
  useDocumentTitle("Overview")

  const { user, preferences } = useAuth()
  const {
    imageAnalysesCount,
    videoAnalysesCount,
    videoAnalytics,
  } = useWorkspace()

  const firstName = user?.name?.split(" ")[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Overview"}
        description="Your session at a glance. Totals reset when you sign out."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Images analyzed"
          value={formatNumber(imageAnalysesCount)}
          subtitle="This session"
          icon={FileImage}
        />

        <StatCard
          title="Videos analyzed"
          value={formatNumber(videoAnalysesCount)}
          subtitle="This session"
          icon={Film}
        />

        <StatCard
          title="Objects detected"
          value={formatNumber(videoAnalytics?.total_detections ?? 0)}
          subtitle="Latest video analysis"
          icon={Camera}
        />

        <StatCard
          title="Unique tracks"
          value={formatNumber(videoAnalytics?.unique_track_ids ?? 0)}
          subtitle="Latest video analysis"
          icon={Activity}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card aria-labelledby="start-heading">
          <CardHeader
            id="start-heading"
            title="Start an analysis"
            description="Upload a file and see what the models find."
          />

          <div className="mt-4 flex flex-wrap gap-3">
            {isEnabled("image_analysis_enabled", preferences) && (
              <Link
                to="/image"
                className={buttonStyles({ variant: "primary" })}
              >
                <FileImage size={16} aria-hidden="true" />
                Analyze an image
              </Link>
            )}

            {isEnabled("video_analysis_enabled", preferences) && (
              <Link to="/video" className={buttonStyles()}>
                <Film size={16} aria-hidden="true" />
                Analyze a video
              </Link>
            )}
          </div>
        </Card>

        <ModelStatus />
      </div>
    </div>
  )
}

export default Overview

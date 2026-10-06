import { BarChart3 } from "lucide-react"
import { Link } from "react-router"

import ClassBarChart from "../components/analytics/ClassBarChart"
import InteractionNetwork from "../components/analytics/InteractionNetwork"
import PresenceTimeline from "../components/analytics/PresenceTimeline"
import TrackLifetimeChart from "../components/analytics/TrackLifetimeChart"
import { buttonStyles } from "../components/ui/buttonStyles"
import Card, { CardHeader } from "../components/ui/Card"
import EmptyState from "../components/ui/EmptyState"
import MetricTile from "../components/ui/MetricTile"
import PageHeader from "../components/ui/PageHeader"
import useAuth from "../hooks/useAuth"
import useDocumentTitle from "../hooks/useDocumentTitle"
import useWorkspace from "../hooks/useWorkspace"
import { isEnabled } from "../routes/navigation"
import { classRows, trackRows } from "../utils/analytics"
import {
  formatMs,
  formatNumber,
  formatSeconds,
} from "../utils/format"

function describeAnalysis(analytics) {
  const parts = []

  if (analytics.filename) {
    parts.push(`Latest video analysis: ${analytics.filename}.`)
  }

  if (analytics.source_frame_count) {
    const sampling =
      analytics.frame_stride > 1
        ? `1 in ${analytics.frame_stride} frames`
        : "every frame"

    parts.push(
      `Analyzed ${formatNumber(analytics.frames_processed)} of ${formatNumber(analytics.source_frame_count)} frames (${sampling}).`,
    )
  }

  return parts.join(" ") || "From your latest video analysis."
}

function Analytics() {
  useDocumentTitle("Analytics")

  const { preferences } = useAuth()
  const { videoAnalytics: analytics } = useWorkspace()

  if (!analytics) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Detections, tracks and interactions from your latest video analysis."
        />

        <Card padded={false}>
          <EmptyState
            icon={BarChart3}
            title="No analytics yet"
            description="Analyze a video and its detections, tracks and interactions will appear here."
            action={
              isEnabled("video_analysis_enabled", preferences) && (
                <Link
                  to="/video"
                  className={buttonStyles({ variant: "primary" })}
                >
                  Analyze a video
                </Link>
              )
            }
          />
        </Card>
      </div>
    )
  }

  const classes = classRows(analytics)
  const tracks = trackRows(analytics)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description={describeAnalysis(analytics)}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricTile
          label="Detections"
          value={formatNumber(analytics.total_detections)}
        />

        <MetricTile
          label="Unique tracks"
          value={formatNumber(analytics.unique_track_ids)}
        />

        <MetricTile
          label="Frames analyzed"
          value={formatNumber(analytics.frames_processed)}
        />

        <MetricTile
          label="Processing time"
          value={formatSeconds(analytics.processing_time_seconds)}
          mono
        />

        <MetricTile
          label="Speed"
          value={`${formatNumber(analytics.effective_fps)} fps`}
          mono
        />
      </div>

      {classes.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ClassBarChart rows={classes} />

          <PresenceTimeline
            rows={classes}
            sourceFrameCount={analytics.source_frame_count ?? 0}
          />
        </div>
      ) : (
        <Card padded={false}>
          <EmptyState
            title="Nothing was detected"
            description="No objects were found in the analyzed frames. Try a video with clearer, larger subjects."
          />
        </Card>
      )}

      {tracks.length > 0 && <TrackLifetimeChart rows={tracks} />}

      <InteractionNetwork analytics={analytics} />

      <Card aria-labelledby="performance-heading">
        <CardHeader
          id="performance-heading"
          title="Inference time per frame"
          description="How long the model took on each analyzed frame."
        />

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile
            label="Fastest"
            value={formatMs(analytics.min_inference_time_ms)}
            mono
          />

          <MetricTile
            label="Average"
            value={formatMs(analytics.average_inference_time_ms)}
            mono
          />

          <MetricTile
            label="Slowest"
            value={formatMs(analytics.max_inference_time_ms)}
            mono
          />

          <MetricTile
            label="Total"
            value={formatMs(analytics.total_inference_time_ms)}
            mono
          />
        </div>
      </Card>
    </div>
  )
}

export default Analytics

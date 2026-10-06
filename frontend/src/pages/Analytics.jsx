import {
  Activity,
  BarChart3,
  Gauge,
  Timer,
  TrendingUp,
} from "lucide-react"

import ClassBreakdownGrid from "../components/analytics/ClassBreakdownGrid"
import InteractionNetwork from "../components/analytics/InteractionNetwork"
import MetricTile from "../components/ui/MetricTile"
import StatCard from "../components/ui/StatCard"

function Analytics({ videoAnalytics }) {
  if (!videoAnalytics) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Analytics
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Explore detection, tracking, and performance analytics.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <BarChart3
            size={40}
            className="mx-auto text-slate-600"
          />

          <h3 className="mt-4 text-lg font-semibold text-white">
            No Analytics Available
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Analyze a video first to populate the analytics
            dashboard with real detection and tracking data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          Analytics
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Detection, tracking, and processing performance from
          your latest video analysis.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Processing Time"
          value={`${videoAnalytics.processing_time_seconds.toFixed(2)} s`}
          icon={Timer}
        />

        <StatCard
          title="Effective FPS"
          value={videoAnalytics.effective_fps.toFixed(2)}
          icon={Gauge}
        />

        <StatCard
          title="Average Inference"
          value={`${videoAnalytics.average_inference_time_ms.toFixed(2)} ms`}
          icon={Activity}
        />

        <StatCard
          title="Total Detections"
          value={videoAnalytics.total_detections}
          icon={TrendingUp}
        />
      </div>

      <ClassBreakdownGrid analytics={videoAnalytics} />

      <InteractionNetwork
        interactions={videoAnalytics.track_interaction_episodes}
      />

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-3">
          <BarChart3 size={20} className="text-slate-300" />

          <h3 className="text-lg font-semibold text-white">
            Inference Performance
          </h3>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <MetricTile
            label="Minimum Inference"
            value={`${videoAnalytics.min_inference_time_ms.toFixed(2)} ms`}
          />

          <MetricTile
            label="Average Inference"
            value={`${videoAnalytics.average_inference_time_ms.toFixed(2)} ms`}
          />

          <MetricTile
            label="Maximum Inference"
            value={`${videoAnalytics.max_inference_time_ms.toFixed(2)} ms`}
          />
        </div>
      </div>
    </div>
  )
}

export default Analytics

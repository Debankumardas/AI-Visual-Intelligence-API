import {
  Activity,
  BarChart3,
  Gauge,
  Timer,
  TrendingUp,
} from "lucide-react"

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
        <AnalyticsCard
          title="Processing Time"
          value={`${videoAnalytics.processing_time_seconds.toFixed(2)} s`}
          icon={Timer}
        />

        <AnalyticsCard
          title="Effective FPS"
          value={videoAnalytics.effective_fps.toFixed(2)}
          icon={Gauge}
        />

        <AnalyticsCard
          title="Average Inference"
          value={`${videoAnalytics.average_inference_time_ms.toFixed(2)} ms`}
          icon={Activity}
        />

        <AnalyticsCard
          title="Total Detections"
          value={videoAnalytics.total_detections}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsList
          title="Detections by Class"
          data={videoAnalytics.class_detection_counts}
        />

        <AnalyticsList
          title="Active Frames by Class"
          data={videoAnalytics.active_frames_by_class}
        />

        <AnalyticsList
          title="Unique Tracks by Class"
          data={videoAnalytics.unique_track_ids_by_class}
        />

        <AnalyticsList
          title="Track Interaction Episodes"
          data={videoAnalytics.track_interaction_episode_counts}
          emptyMessage="No interaction episodes detected for this video."
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-3">
          <BarChart3 size={20} className="text-slate-300" />

          <h3 className="text-lg font-semibold text-white">
            Inference Performance
          </h3>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Metric
            label="Minimum Inference"
            value={`${videoAnalytics.min_inference_time_ms.toFixed(2)} ms`}
          />

          <Metric
            label="Average Inference"
            value={`${videoAnalytics.average_inference_time_ms.toFixed(2)} ms`}
          />

          <Metric
            label="Maximum Inference"
            value={`${videoAnalytics.max_inference_time_ms.toFixed(2)} ms`}
          />
        </div>
      </div>
    </div>
  )
}

function AnalyticsCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-slate-800 p-2.5">
          <Icon size={20} className="text-slate-300" />
        </div>
      </div>
    </div>
  )
}

function AnalyticsList({
  title,
  data,
  emptyMessage = "No analytics available.",
}) {
  const entries = Object.entries(data || {})

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="font-semibold text-white">
        {title}
      </h3>

      {entries.length ? (
        <div className="mt-4 space-y-2">
          {entries.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg bg-slate-950 px-4 py-3"
            >
              <span className="text-sm text-slate-300">
                {label}
              </span>

              <span className="text-sm font-semibold text-white">
                {typeof value === "number"
                  ? Number.isInteger(value)
                    ? value
                    : value.toFixed(2)
                  : value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          {emptyMessage}
        </p>
      )}
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-950 px-4 py-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  )
}

export default Analytics
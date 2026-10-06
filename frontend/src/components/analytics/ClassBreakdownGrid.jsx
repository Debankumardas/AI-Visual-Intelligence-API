import AnalyticsList from "./AnalyticsList"

function ClassBreakdownGrid({ analytics }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AnalyticsList
        title="Detections by Class"
        data={analytics.class_detection_counts}
      />

      <AnalyticsList
        title="Active Frames by Class"
        data={analytics.active_frames_by_class}
      />

      <AnalyticsList
        title="Unique Tracks by Class"
        data={analytics.unique_track_ids_by_class}
      />

      <AnalyticsList
        title="Track Interaction Episodes"
        data={analytics.track_interaction_episode_counts}
        emptyMessage="No interaction episodes detected for this video."
      />
    </div>
  )
}

export default ClassBreakdownGrid

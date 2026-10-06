import { useState } from "react"
import {
  BarChart3,
  Film,
  Loader2,
  Upload,
} from "lucide-react"

import {
  analyzeVideo,
  getVideoMetadata,
} from "../services/api"

function VideoAnalysis({ onAnalyticsComplete }) {
  const [file, setFile] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    setFile(selectedFile)
    setMetadata(null)
    setResult(null)
    setError("")
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a video first.")
      return
    }

    setLoading(true)
    setError("")
    setMetadata(null)
    setResult(null)

    try {
      // Step 1: Get video metadata first
      const videoMetadata = await getVideoMetadata(file)

      setMetadata(videoMetadata.metadata)

      // Step 2: Run the heavier video analysis
      const analytics = await analyzeVideo(file)

      setResult(analytics)
      onAnalyticsComplete(analytics)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Video analysis failed. Please check that the API is running.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          Video Analysis
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Upload a video to analyze frames, detections, tracking,
          and performance metrics.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2.5">
            <Upload size={20} className="text-slate-300" />
          </div>

          <div>
            <h3 className="font-semibold text-white">
              Upload Video
            </h3>

            <p className="text-xs text-slate-500">
              Select a supported video file for analysis
            </p>
          </div>
        </div>

        <label className="mt-6 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-6 text-center transition hover:border-slate-500 hover:bg-slate-950">
          <Film size={38} className="text-slate-500" />

          <p className="mt-4 text-sm font-medium text-slate-300">
            Click to select a video
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Select a video supported by the backend
          </p>

          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {file && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-4">
            <p className="truncate text-sm text-slate-300">
              {file.name}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Analyzing Video...
            </>
          ) : (
            "Analyze Video"
          )}
        </button>

        {error && (
          <div className="mt-4 rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      {metadata && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <Film size={20} className="text-slate-300" />

            <h3 className="text-lg font-semibold text-white">
              Video Metadata
            </h3>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric
              label="Frames"
              value={metadata.frame_count}
            />

            <Metric
              label="FPS"
              value={metadata.fps.toFixed(2)}
            />

            <Metric
              label="Resolution"
              value={`${metadata.width} × ${metadata.height}`}
            />

            <Metric
              label="Duration"
              value={`${metadata.duration.toFixed(2)} s`}
            />
          </div>
        </div>
      )}

      {result && (
        <>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-slate-300" />

              <h3 className="text-lg font-semibold text-white">
                Processing Analytics
              </h3>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Frames Analysed"
                value={
                  result.source_frame_count
                    ? `${result.frames_processed} of ${result.source_frame_count}`
                    : result.frames_processed
                }
              />

              <Metric
                label="Sampling"
                value={
                  result.frame_stride > 1
                    ? `Every ${result.frame_stride} frames`
                    : "Every frame"
                }
              />

              <Metric
                label="Effective FPS"
                value={result.effective_fps.toFixed(2)}
              />

              <Metric
                label="Total Detections"
                value={result.total_detections}
              />

              <Metric
                label="Unique Tracks"
                value={result.unique_track_ids}
              />

              <Metric
                label="Processing Time"
                value={`${result.processing_time_seconds.toFixed(2)} s`}
              />

              <Metric
                label="Avg Inference"
                value={`${result.average_inference_time_ms.toFixed(2)} ms`}
              />

              <Metric
                label="Min Inference"
                value={`${result.min_inference_time_ms.toFixed(2)} ms`}
              />

              <Metric
                label="Max Inference"
                value={`${result.max_inference_time_ms.toFixed(2)} ms`}
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AnalyticsList
              title="Detections by Class"
              data={result.class_detection_counts}
            />

            <AnalyticsList
              title="Active Frames by Class"
              data={result.active_frames_by_class}
            />

            <AnalyticsList
              title="Unique Tracks by Class"
              data={result.unique_track_ids_by_class}
            />

            <AnalyticsList
              title="Track Interaction Episodes"
              data={result.track_interaction_episode_counts}
            />
          </div>
        </>
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

function AnalyticsList({ title, data }) {
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
          No analytics available.
        </p>
      )}
    </div>
  )
}

export default VideoAnalysis
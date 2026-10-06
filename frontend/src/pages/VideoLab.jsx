import axios from "axios"
import { Clapperboard, Download, FileVideo, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router"

import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import { buttonStyles } from "../components/ui/buttonStyles"
import Card, { CardHeader } from "../components/ui/Card"
import Dropzone from "../components/ui/Dropzone"
import ElapsedTimer from "../components/ui/ElapsedTimer"
import MetricTile from "../components/ui/MetricTile"
import PageHeader from "../components/ui/PageHeader"
import useDocumentTitle from "../hooks/useDocumentTitle"
import useWorkspace from "../hooks/useWorkspace"
import {
  analyzeVideo,
  annotateVideo,
  getVideoMetadata,
} from "../services/api"
import { derivedFilename, saveBlob } from "../utils/download"
import {
  formatMs,
  formatNumber,
  formatSeconds,
} from "../utils/format"
import { describeRequestError } from "../utils/requestErrors"

const VIDEO_TYPES = [
  "video/mp4",
  "video/avi",
  "video/quicktime",
  "video/x-msvideo",
]

const MAX_VIDEO_BYTES = 50 * 1024 * 1024

const PHASE_TEXT = {
  metadata: "Reading the video details…",
  analysis: "Detecting and tracking objects…",
  annotate: "Drawing tracked objects on the video…",
}

// An empty caption file: the video is the user's own upload, so
// there is no transcript to offer.
const NO_CAPTIONS = "data:text/vtt;charset=utf-8,WEBVTT"

function describeSampling(result) {
  return result.frame_stride > 1
    ? `1 in ${result.frame_stride} frames`
    : "Every frame"
}

function VideoLab() {
  useDocumentTitle("Video lab")

  const { recordVideoAnalysis } = useWorkspace()

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewFailed, setPreviewFailed] = useState(false)

  const [metadata, setMetadata] = useState(null)
  const [result, setResult] = useState(null)

  // "" when idle, otherwise which step is running.
  const [phase, setPhase] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [announcement, setAnnouncement] = useState("")

  const previewRef = useRef(null)
  const controllerRef = useRef(null)

  useEffect(
    () => () => {
      controllerRef.current?.abort()

      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    },
    [],
  )

  const busy = phase !== ""

  const handleFile = (chosen) => {
    controllerRef.current?.abort()

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
    }

    const url =
      typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(chosen)
        : null

    previewRef.current = url

    setFile(chosen)
    setPreviewUrl(url)
    setPreviewFailed(false)
    setMetadata(null)
    setResult(null)
    setPhase("")
    setError("")
    setNotice("")
    setAnnouncement("")
  }

  const startRequest = (firstPhase) => {
    const controller = new AbortController()

    controllerRef.current = controller

    setPhase(firstPhase)
    setError("")
    setNotice("")
    setAnnouncement(PHASE_TEXT[firstPhase])

    return controller
  }

  const finishRequest = (controller) => {
    if (controllerRef.current === controller) {
      setPhase("")
    }
  }

  const handleAnalyze = async () => {
    const controller = startRequest("metadata")
    const { signal } = controller

    setMetadata(null)
    setResult(null)

    try {
      const details = await getVideoMetadata(file, { signal })

      setMetadata(details.metadata)
      setPhase("analysis")
      setAnnouncement(PHASE_TEXT.analysis)

      const analytics = await analyzeVideo(file, { signal })

      setResult(analytics)
      recordVideoAnalysis(analytics)

      setAnnouncement(
        `Analysis complete. ${analytics.total_detections} detections, ${analytics.unique_track_ids} unique tracks.`,
      )
    } catch (requestError) {
      setAnnouncement("")

      if (!axios.isCancel(requestError)) {
        setError(
          describeRequestError(
            requestError,
            "The video couldn’t be analyzed. Try again.",
          ),
        )
      }
    } finally {
      finishRequest(controller)
    }
  }

  const handleAnnotate = async () => {
    const controller = startRequest("annotate")

    try {
      const blob = await annotateVideo(file, {
        signal: controller.signal,
      })

      saveBlob(blob, derivedFilename(file.name, "annotated", ".mp4"))
      setNotice(
        "Annotated video downloaded. It is an MPEG-4 (mp4v) file, which some browsers can’t play. Open it in a media player such as VLC.",
      )
      setAnnouncement("Annotated video downloaded.")
    } catch (requestError) {
      setAnnouncement("")

      if (!axios.isCancel(requestError)) {
        setError(
          describeRequestError(
            requestError,
            "Couldn’t create the annotated video. Try again.",
          ),
        )
      }
    } finally {
      finishRequest(controller)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Video lab"
        description="Upload a video to detect and track the objects in it. Long videos are sampled evenly so the analysis finishes in reasonable time."
      />

      {error && (
        <Alert tone="danger" title="That didn’t work">
          {error}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-3">
          <Dropzone
            acceptTypes={VIDEO_TYPES}
            acceptLabel="MP4, AVI or MOV"
            maxBytes={MAX_VIDEO_BYTES}
            file={file}
            onFile={handleFile}
            onReject={setError}
            title="Drop a video here or choose a file"
            icon={FileVideo}
            compact={Boolean(file)}
            disabled={busy}
          />

          {previewUrl && !previewFailed && (
            <div className="rounded-panel border border-hairline bg-sunken p-3">
              <video
                key={previewUrl}
                src={previewUrl}
                controls
                playsInline
                preload="metadata"
                onError={() => setPreviewFailed(true)}
                className="mx-auto block max-h-[50vh] max-w-full rounded-control"
              >
                <track
                  kind="captions"
                  src={NO_CAPTIONS}
                  srcLang="en"
                  label="No captions available"
                />
              </video>
            </div>
          )}

          {previewFailed && (
            <Alert tone="info" title="No preview">
              This browser can’t play this video format. You can still
              analyze it.
            </Alert>
          )}
        </div>

        <Card className="min-w-0 space-y-5 lg:sticky lg:top-20 lg:self-start">
          <p className="text-sm text-muted">
            The video is read first, then every sampled frame goes
            through the detector and tracker.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              onClick={handleAnalyze}
              disabled={!file || busy}
              loading={busy && phase !== "annotate"}
              loadingLabel="Analyzing…"
            >
              Analyze video
            </Button>

            {busy && (
              <>
                <Button onClick={() => controllerRef.current?.abort()}>
                  <X size={16} aria-hidden="true" />
                  Cancel
                </Button>

                <ElapsedTimer running className="text-sm text-muted" />
              </>
            )}
          </div>

          {busy && (
            <p className="text-sm text-muted">
              {PHASE_TEXT[phase]} This can take a minute or more on a
              CPU. Cancelling stops waiting, but the server may
              finish the job in the background.
            </p>
          )}

          {!file && (
            <p className="text-sm text-muted">
              Choose a video to begin.
            </p>
          )}

          {metadata && (
            <section>
              <h2 className="mb-1.5 text-sm font-medium text-muted">
                Video details
              </h2>

              <div className="grid grid-cols-2 gap-2">
                <MetricTile
                  label="Resolution"
                  value={`${metadata.width} × ${metadata.height}`}
                />

                <MetricTile
                  label="Frame rate"
                  value={`${formatNumber(metadata.fps)} fps`}
                />

                <MetricTile
                  label="Duration"
                  value={formatSeconds(metadata.duration)}
                />

                <MetricTile
                  label="Frames"
                  value={formatNumber(metadata.frame_count)}
                />
              </div>
            </section>
          )}

          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>
        </Card>
      </div>

      {notice && (
        <Alert tone="success" title="Done">
          {notice}
        </Alert>
      )}

      {result && (
        <Card aria-labelledby="video-results-heading" className="space-y-5">
          <CardHeader
            id="video-results-heading"
            title="Analysis results"
            description={`Analyzed ${formatNumber(result.frames_processed)} of ${formatNumber(result.source_frame_count)} frames (${describeSampling(result).toLowerCase()}).`}
            actions={
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleAnnotate}
                  disabled={busy}
                  loading={phase === "annotate"}
                  loadingLabel="Preparing…"
                >
                  <Download size={16} aria-hidden="true" />
                  Download annotated video
                </Button>

                <Link
                  to="/analytics"
                  className={buttonStyles({ variant: "primary" })}
                >
                  <Clapperboard size={16} aria-hidden="true" />
                  Open analytics
                </Link>
              </div>
            }
          />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile
              label="Detections"
              value={formatNumber(result.total_detections)}
            />

            <MetricTile
              label="Unique tracks"
              value={formatNumber(result.unique_track_ids)}
            />

            <MetricTile
              label="Frames analyzed"
              value={formatNumber(result.frames_processed)}
            />

            <MetricTile
              label="Sampling"
              value={describeSampling(result)}
            />

            <MetricTile
              label="Processing time"
              value={formatSeconds(result.processing_time_seconds)}
              mono
            />

            <MetricTile
              label="Speed"
              value={`${formatNumber(result.effective_fps)} fps`}
              mono
            />

            <MetricTile
              label="Average per frame"
              value={formatMs(result.average_inference_time_ms)}
              mono
            />

            <MetricTile
              label="Slowest frame"
              value={formatMs(result.max_inference_time_ms)}
              mono
            />
          </div>
        </Card>
      )}
    </div>
  )
}

export default VideoLab

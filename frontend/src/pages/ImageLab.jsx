import {
  Copy,
  Download,
  Hash,
  ImagePlus,
  Scan,
  ScanSearch,
  ScanText,
  Shapes,
  X,
} from "lucide-react"
import axios from "axios"
import { useEffect, useRef, useState } from "react"

import ImageResults from "../components/vision/ImageResults"
import ImageViewer from "../components/vision/ImageViewer"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import Dropzone from "../components/ui/Dropzone"
import ElapsedTimer from "../components/ui/ElapsedTimer"
import PageHeader from "../components/ui/PageHeader"
import Tabs, { TabPanel } from "../components/ui/Tabs"
import useDocumentTitle from "../hooks/useDocumentTitle"
import useWorkspace from "../hooks/useWorkspace"
import {
  analyzeImage,
  countObjects,
  detectAnnotated,
  detectObjects,
  extractText,
  segmentImage,
} from "../services/api"
import { derivedFilename, saveBlob } from "../utils/download"
import { describeRequestError } from "../utils/requestErrors"
import { describeImageResult, shapesFor } from "../utils/vision"

const MODES = [
  {
    id: "analyze",
    label: "Analyze",
    icon: ScanSearch,
    run: analyzeImage,
    action: "Analyze image",
    description: "Classify the whole image and detect the objects in it.",
  },
  {
    id: "detect",
    label: "Detect",
    icon: Scan,
    run: detectObjects,
    action: "Detect objects",
    description: "Find objects and draw a box around each one.",
  },
  {
    id: "segment",
    label: "Segment",
    icon: Shapes,
    run: segmentImage,
    action: "Segment objects",
    description: "Outline the exact shape of each object.",
  },
  {
    id: "text",
    label: "Read text",
    icon: ScanText,
    run: extractText,
    action: "Read text",
    description: "Find the words in the image and read them.",
  },
  {
    id: "count",
    label: "Count",
    icon: Hash,
    run: countObjects,
    action: "Count objects",
    description: "Count how many of each kind of object there is.",
  },
]

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function ImageLab() {
  useDocumentTitle("Image lab")

  const { recordImageAnalysis } = useWorkspace()

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [imageSize, setImageSize] = useState(null)

  const [mode, setMode] = useState("analyze")
  const [results, setResults] = useState({})

  const [running, setRunning] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState("")

  // Visible confirmations ("Text copied.") and what screen readers
  // are told when an analysis finishes.
  const [notice, setNotice] = useState("")
  const [announcement, setAnnouncement] = useState("")

  const [hoverId, setHoverId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const previewRef = useRef(null)
  const controllerRef = useRef(null)

  // Release the preview and any running request when leaving the page.
  useEffect(
    () => () => {
      controllerRef.current?.abort()

      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    },
    [],
  )

  const activeMode = MODES.find((candidate) => candidate.id === mode)
  const entry = results[mode]
  const shapes = entry ? shapesFor(mode, entry.result) : []
  const activeId = hoverId ?? selectedId

  const clearSelection = () => {
    setHoverId(null)
    setSelectedId(null)
  }

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
    setImageSize(null)
    setResults({})
    setRunning(false)
    setError("")
    setNotice("")
    setAnnouncement("")
    clearSelection()
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setNotice("")
    setAnnouncement("")
    clearSelection()
  }

  const handleRun = async () => {
    const controller = new AbortController()

    controllerRef.current = controller

    setRunning(true)
    setError("")
    setNotice("")
    setAnnouncement("Analyzing…")
    clearSelection()

    const startedAt = performance.now()

    try {
      const result = await activeMode.run(file, {
        signal: controller.signal,
      })

      setResults((current) => ({
        ...current,
        [mode]: {
          result,
          elapsedMs: Math.round(performance.now() - startedAt),
          runId: Date.now(),
        },
      }))

      recordImageAnalysis({ file, mode, result, size: imageSize })
      setAnnouncement(
        `Analysis complete. ${describeImageResult(mode, result).summary}`,
      )
    } catch (requestError) {
      setAnnouncement("")

      if (!axios.isCancel(requestError)) {
        setError(
          describeRequestError(
            requestError,
            "The analysis failed. Try again.",
          ),
        )
      }
    } finally {
      if (controllerRef.current === controller) {
        setRunning(false)
      }
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    setError("")
    setNotice("")

    try {
      const blob = await detectAnnotated(file)

      saveBlob(blob, derivedFilename(file.name, "annotated", ".jpg"))
      setNotice("Annotated image downloaded.")
    } catch (requestError) {
      setError(
        describeRequestError(
          requestError,
          "Couldn't create the annotated image. Try again.",
        ),
      )
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyText = async () => {
    const text = shapes.map((shape) => shape.text).join(" ")

    try {
      await navigator.clipboard.writeText(text)
      setNotice("Text copied.")
    } catch {
      setError("Couldn't copy the text. Select it from the list instead.")
    }
  }

  const selectShape = (id) =>
    setSelectedId((current) => (current === id ? null : id))

  const canDownload =
    entry && (mode === "analyze" || mode === "detect")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Image lab"
        description="Upload an image and see what the models find in it. Results are drawn on the image and listed beside it."
      />

      {error && (
        <Alert tone="danger" title="That didn't work">
          {error}
        </Alert>
      )}

      <Tabs
        id="image-mode"
        label="Analysis type"
        items={MODES}
        value={mode}
        onChange={handleModeChange}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-3">
          {previewUrl && (
            <ImageViewer
              key={previewUrl}
              src={previewUrl}
              alt={
                entry
                  ? `${file.name}. ${describeImageResult(mode, entry.result).summary}`
                  : file.name
              }
              shapes={shapes}
              activeId={activeId}
              onActiveChange={setHoverId}
              onSize={setImageSize}
              animateKey={entry?.runId}
            />
          )}

          <Dropzone
            acceptTypes={IMAGE_TYPES}
            acceptLabel="JPEG, PNG or WebP"
            maxBytes={MAX_IMAGE_BYTES}
            file={file}
            onFile={handleFile}
            onReject={setError}
            title="Drop an image here or choose a file"
            icon={ImagePlus}
            compact={Boolean(file)}
          />
        </div>

        <TabPanel
          id="image-mode"
          value={mode}
          className="min-w-0 outline-none lg:sticky lg:top-20 lg:self-start"
        >
          <Card className="space-y-5">
            <p className="text-sm text-muted">
              {activeMode.description}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                onClick={handleRun}
                disabled={!file}
                loading={running}
                loadingLabel="Working…"
              >
                {activeMode.action}
              </Button>

              {running && (
                <>
                  <Button onClick={() => controllerRef.current?.abort()}>
                    <X size={16} aria-hidden="true" />
                    Cancel
                  </Button>

                  <ElapsedTimer
                    running
                    className="text-sm text-muted"
                  />
                </>
              )}
            </div>

            {!file && (
              <p className="text-sm text-muted">
                Choose an image to begin.
              </p>
            )}

            {entry && (
              <ImageResults
                mode={mode}
                entry={entry}
                shapes={shapes}
                activeId={activeId}
                selectedId={selectedId}
                onHover={setHoverId}
                onSelect={selectShape}
              />
            )}

            {entry && (canDownload || mode === "text") && (
              <div className="flex flex-wrap gap-2 border-t border-hairline pt-4">
                {canDownload && (
                  <Button
                    onClick={handleDownload}
                    loading={downloading}
                    loadingLabel="Preparing…"
                  >
                    <Download size={16} aria-hidden="true" />
                    Download annotated image
                  </Button>
                )}

                {mode === "text" && shapes.length > 0 && (
                  <Button onClick={handleCopyText}>
                    <Copy size={16} aria-hidden="true" />
                    Copy all text
                  </Button>
                )}
              </div>
            )}

            <p className="sr-only" aria-live="polite">
              {announcement}
            </p>

            <p
              aria-live="polite"
              className="min-h-5 text-xs text-muted"
            >
              {notice}
            </p>
          </Card>
        </TabPanel>
      </div>
    </div>
  )
}

export default ImageLab

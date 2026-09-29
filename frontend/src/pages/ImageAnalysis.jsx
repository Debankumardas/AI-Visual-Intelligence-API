import { useState } from "react"
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react"
import { analyzeImage } from "../services/api"

function ImageAnalysis() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setResult(null)
    setError("")
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select an image first.")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const data = await analyzeImage(file)
      setResult(data)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Image analysis failed. Please check that the API is running.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          Image Analysis
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Upload an image to run classification and object detection.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-800 p-2.5">
              <Upload size={20} className="text-slate-300" />
            </div>

            <div>
              <h3 className="font-semibold text-white">
                Upload Image
              </h3>

              <p className="text-xs text-slate-500">
                Select an image for AI analysis
              </p>
            </div>
          </div>

          <label className="mt-6 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-6 text-center transition hover:border-slate-500 hover:bg-slate-950">
            <ImageIcon size={34} className="text-slate-500" />

            <p className="mt-4 text-sm font-medium text-slate-300">
              Click to select an image
            </p>

            <p className="mt-1 text-xs text-slate-500">
              JPG, JPEG, PNG or other supported image formats
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3">
              <p className="truncate text-sm text-slate-300">
                {file.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
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
                Analyzing...
              </>
            ) : (
              "Analyze Image"
            )}
          </button>

          {error && (
            <div className="mt-4 rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="font-semibold text-white">
            Image Preview
          </h3>

          <div className="mt-4 flex min-h-72 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            {preview ? (
              <img
                src={preview}
                alt="Selected preview"
                className="max-h-96 max-w-full object-contain"
              />
            ) : (
              <div className="text-center">
                <ImageIcon
                  size={42}
                  className="mx-auto text-slate-700"
                />

                <p className="mt-3 text-sm text-slate-500">
                  No image selected
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">
            Analysis Results
          </h3>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-slate-300">
                Top Predictions
              </h4>

              <div className="mt-3 space-y-2">
                {result.predictions?.map((prediction, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-slate-950 px-4 py-3"
                  >
                    <span className="text-sm text-slate-300">
                      {prediction.label}
                    </span>

                    <span className="text-sm font-semibold text-white">
                      {(
                        prediction.confidence * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-300">
                Detected Objects
              </h4>

              <div className="mt-3 space-y-2">
                {result.detections?.length ? (
                  result.detections.map((detection, index) => (
                    <div
                      key={index}
                      className="rounded-lg bg-slate-950 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">
                          {detection.label}
                        </span>

                        <span className="text-sm font-semibold text-white">
                          {(
                            detection.confidence * 100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-slate-950 px-4 py-3 text-sm text-slate-500">
                    No objects detected.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-950 px-4 py-3">
              <p className="text-xs text-slate-500">
                Classification Time
              </p>

              <p className="mt-1 text-sm font-semibold text-white">
                {result.classification_inference_time_ms} ms
              </p>
            </div>

            <div className="rounded-lg bg-slate-950 px-4 py-3">
              <p className="text-xs text-slate-500">
                Detection Time
              </p>

              <p className="mt-1 text-sm font-semibold text-white">
                {result.detection_inference_time_ms} ms
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageAnalysis

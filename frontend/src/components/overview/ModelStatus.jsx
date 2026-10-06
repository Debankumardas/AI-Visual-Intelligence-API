import { RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

import { getReadiness } from "../../services/api"
import Alert from "../ui/Alert"
import Badge from "../ui/Badge"
import Button from "../ui/Button"
import Card, { CardHeader } from "../ui/Card"
import Skeleton from "../ui/Skeleton"

const MODELS = [
  { key: "object_detection", label: "Object detection and tracking" },
  { key: "image_classification", label: "Image classification" },
]

/** Whether the backend has its models loaded and is ready for work. */
function ModelStatus() {
  const [state, setState] = useState({ status: "loading" })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    getReadiness()
      .then((data) => {
        if (!cancelled) {
          setState({ status: "loaded", data })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: "error" })
        }
      })

    // Ignore a response that arrives after a newer check started.
    return () => {
      cancelled = true
    }
  }, [attempt])

  const checkAgain = () => {
    setState({ status: "loading" })
    setAttempt((count) => count + 1)
  }

  return (
    <Card aria-labelledby="model-status-heading">
      <CardHeader
        id="model-status-heading"
        title="Models"
        description="Loaded when the backend starts."
        actions={
          <Button
            size="sm"
            onClick={checkAgain}
            disabled={state.status === "loading"}
          >
            <RefreshCw size={14} aria-hidden="true" />
            Check again
          </Button>
        }
      />

      <div className="mt-4 space-y-3">
        {state.status === "loading" && (
          <>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </>
        )}

        {state.status === "error" && (
          <Alert tone="danger" title="Can't reach the backend">
            Start the API, then check again.
          </Alert>
        )}

        {state.status === "loaded" && (
          <>
            <ul className="space-y-2">
              {MODELS.map((model) => {
                const ready = state.data.models?.[model.key] === "ready"

                return (
                  <li
                    key={model.key}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-fg">{model.label}</span>

                    <Badge tone={ready ? "success" : "warning"}>
                      {ready ? "Ready" : "Not ready"}
                    </Badge>
                  </li>
                )
              })}
            </ul>

            {Object.entries(state.data.errors ?? {}).map(
              ([model, message]) => (
                <Alert key={model} tone="danger">
                  {message}
                </Alert>
              ),
            )}
          </>
        )}
      </div>
    </Card>
  )
}

export default ModelStatus

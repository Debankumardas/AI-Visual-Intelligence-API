import { ImagePlus } from "lucide-react"
import { Link } from "react-router"

import useWorkspace from "../../hooks/useWorkspace"
import { describeImageResult, shapesFor } from "../../utils/vision"
import { buttonStyles } from "../ui/buttonStyles"
import Card, { CardHeader } from "../ui/Card"
import EmptyState from "../ui/EmptyState"
import ImageViewer from "../vision/ImageViewer"

/** The most recent image result, drawn on the image it came from. */
function LatestResult({ showLink = true }) {
  const { lastImage } = useWorkspace()

  if (!lastImage?.previewUrl) {
    return (
      <Card padded={false}>
        <EmptyState
          icon={ImagePlus}
          title="No image analyzed yet"
          description="Your latest image result will appear here, drawn on the image."
        />
      </Card>
    )
  }

  const { summary } = describeImageResult(
    lastImage.mode,
    lastImage.result,
  )

  return (
    <Card aria-labelledby="latest-result-heading" className="space-y-4">
      <CardHeader
        id="latest-result-heading"
        title="Latest image result"
        description={`${lastImage.name}. ${summary}`}
        actions={
          showLink && (
            <Link to="/image" className={buttonStyles({ size: "sm" })}>
              Open the image lab
            </Link>
          )
        }
      />

      <ImageViewer
        key={lastImage.previewUrl}
        src={lastImage.previewUrl}
        alt={`${lastImage.name}. ${summary}`}
        shapes={shapesFor(lastImage.mode, lastImage.result)}
      />
    </Card>
  )
}

export default LatestResult

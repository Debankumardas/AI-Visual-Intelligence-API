import { useRef, useState } from "react"

import useElementWidth from "../../hooks/useElementWidth"
import { cn } from "../../utils/cn"
import { formatPercent } from "../../utils/format"

const LABEL_TEXT_COLOR = "#04181c"

function labelFor(shape) {
  if (shape.kind === "box" && shape.text) {
    return shape.text
  }

  return `${shape.label} ${formatPercent(shape.confidence, 0)}`
}

function Shape({ shape, index, scale, imageSize, active, dimmed, onActiveChange }) {
  const strokeWidth = (active ? 3.5 : 2) * scale
  const opacity = dimmed ? 0.4 : 1

  // Recognised text would clutter the image, so it only shows on focus.
  const showLabel = shape.text ? active : true
  const text = labelFor(shape)

  const fontSize = 13 * scale
  const labelHeight = 20 * scale
  const labelWidth = text.length * fontSize * 0.58 + 12 * scale

  // Boxes are labelled at their top-left corner; outlines at their
  // highest point, so the label touches the shape it names.
  const [anchorX, anchorY] =
    shape.kind === "polygon" && shape.polygon.length > 0
      ? shape.polygon.reduce((top, point) =>
          point[1] < top[1] ? point : top,
        )
      : [shape.box.x1, shape.box.y1]

  const x = Math.max(
    0,
    Math.min(anchorX, imageSize.width - labelWidth),
  )

  // Sit above the anchor, or just inside when there is no room above.
  const y =
    anchorY - labelHeight >= 0 ? anchorY - labelHeight : anchorY

  const common = {
    className: "lock-on",
    pathLength: 1,
    style: { "--i": Math.min(index, 8) },
    stroke: shape.color,
    strokeWidth,
    strokeLinejoin: "round",
    fill: active ? shape.color : "transparent",
    fillOpacity: active ? 0.18 : 1,
    pointerEvents: "all",
  }

  return (
    <g
      data-shape={shape.id}
      opacity={opacity}
      onPointerEnter={() => onActiveChange?.(shape.id)}
      onPointerLeave={() => onActiveChange?.(null)}
    >
      {shape.kind === "polygon" ? (
        <polygon
          {...common}
          fillOpacity={active ? 0.35 : 0.2}
          fill={shape.color}
          points={shape.polygon.map(([px, py]) => `${px},${py}`).join(" ")}
        />
      ) : (
        <rect
          {...common}
          x={shape.box.x1}
          y={shape.box.y1}
          width={shape.box.x2 - shape.box.x1}
          height={shape.box.y2 - shape.box.y1}
        />
      )}

      {showLabel && (
        <>
          <rect
            x={x}
            y={y}
            width={labelWidth}
            height={labelHeight}
            fill={shape.color}
          />

          <text
            x={x + 6 * scale}
            y={y + labelHeight * 0.72}
            fill={LABEL_TEXT_COLOR}
            fontSize={fontSize}
            fontWeight="600"
          >
            {text}
          </text>
        </>
      )}
    </g>
  )
}

function Corners() {
  const corner = "absolute size-4 border-accent"

  return (
    <>
      <span aria-hidden="true" className={cn(corner, "left-1 top-1 border-l-2 border-t-2")} />
      <span aria-hidden="true" className={cn(corner, "right-1 top-1 border-r-2 border-t-2")} />
      <span aria-hidden="true" className={cn(corner, "bottom-1 left-1 border-b-2 border-l-2")} />
      <span aria-hidden="true" className={cn(corner, "bottom-1 right-1 border-b-2 border-r-2")} />
    </>
  )
}

/**
 * An image with its results drawn on top, in a viewfinder frame.
 *
 * Shapes are in image pixels (see shapesFor). The overlay uses the
 * image's own coordinate system, so it lines up at any display size;
 * strokes and labels are rescaled to stay a constant on-screen size.
 *
 * Mount with `key={src}` so a new image starts with a fresh size.
 * The overlay is decorative (aria-hidden); the same results are in
 * the lists beside it.
 */
function ImageViewer({
  src,
  alt,
  shapes = [],
  activeId = null,
  onActiveChange,
  onSize,
  animateKey,
  className,
}) {
  const imageRef = useRef(null)
  const [size, setSize] = useState(null)
  const displayWidth = useElementWidth(imageRef)

  const handleLoad = (event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget

    if (naturalWidth && naturalHeight) {
      const naturalSize = { width: naturalWidth, height: naturalHeight }

      setSize(naturalSize)
      onSize?.(naturalSize)
    }
  }

  const scale = size && displayWidth ? size.width / displayWidth : 1

  return (
    <div
      className={cn(
        "relative rounded-panel border border-hairline bg-sunken p-3",
        className,
      )}
    >
      <Corners />

      <div className="relative mx-auto w-fit max-w-full">
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          width={size?.width}
          height={size?.height}
          onLoad={handleLoad}
          className="block max-h-[70vh] max-w-full rounded-control"
        />

        {size && shapes.length > 0 && (
          <svg
            key={animateKey}
            data-testid="overlay"
            viewBox={`0 0 ${size.width} ${size.height}`}
            aria-hidden="true"
            className="absolute inset-0 size-full"
          >
            {shapes.map((shape, index) => (
              <Shape
                key={shape.id}
                shape={shape}
                index={index}
                scale={scale}
                imageSize={size}
                active={activeId === shape.id}
                dimmed={activeId !== null && activeId !== shape.id}
                onActiveChange={onActiveChange}
              />
            ))}
          </svg>
        )}
      </div>
    </div>
  )
}

export default ImageViewer

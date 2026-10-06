import { useRef, useState } from "react"

import { cn } from "../../utils/cn"
import { formatBytes } from "../../utils/format"

/**
 * A file picker that also accepts dropped files. The whole area is a
 * real button, so it works with a keyboard.
 */
function Dropzone({
  acceptTypes,
  acceptLabel,
  maxBytes,
  file,
  onFile,
  onReject,
  disabled = false,
  title,
  icon: Icon,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const validate = (candidate) => {
    if (!acceptTypes.includes(candidate.type)) {
      return `${candidate.name} isn't supported. Use ${acceptLabel}.`
    }

    if (candidate.size > maxBytes) {
      return `${candidate.name} is ${formatBytes(candidate.size)}. The limit is ${formatBytes(maxBytes)}.`
    }

    return null
  }

  const handleFile = (candidate) => {
    if (!candidate) {
      return
    }

    const problem = validate(candidate)

    if (problem) {
      onReject?.(problem)
      return
    }

    onFile(candidate)
  }

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setDragging(false)
        }
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)

        if (!disabled) {
          handleFile(event.dataTransfer.files?.[0])
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={acceptTypes.join(",")}
        onChange={(event) => {
          handleFile(event.target.files?.[0])
          // Allow choosing the same file again.
          event.target.value = ""
        }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-panel border border-dashed px-6 py-8 text-center transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
          dragging
            ? "border-accent bg-accent/5"
            : "border-control bg-sunken hover:border-fg/50",
        )}
      >
        {Icon && (
          <Icon
            size={28}
            aria-hidden="true"
            className={dragging ? "text-accent" : "text-muted"}
          />
        )}

        {file ? (
          <>
            <span className="max-w-full truncate text-sm font-medium text-fg">
              {file.name}
            </span>

            <span className="tnum text-xs text-muted">
              {formatBytes(file.size)}. Choose a different file to replace it.
            </span>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-fg">{title}</span>

            <span className="text-xs text-muted">
              {acceptLabel}, up to {formatBytes(maxBytes)}
            </span>
          </>
        )}
      </button>
    </div>
  )
}

export default Dropzone

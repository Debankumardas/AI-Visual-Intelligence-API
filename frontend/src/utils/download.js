/** Offer a blob to the user as a file download. */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.hidden = true

  document.body.append(link)
  link.click()
  link.remove()

  // Give the browser a moment to start the download first.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** "dog.photo.JPG" + "annotated", ".jpg" -> "dog.photo-annotated.jpg" */
export function derivedFilename(originalName, suffix, extension) {
  const base = originalName.replace(/\.[^.]+$/, "") || "image"

  return `${base}-${suffix}${extension}`
}

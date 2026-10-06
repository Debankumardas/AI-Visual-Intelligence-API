import { useEffect, useState } from "react"

/**
 * The rendered width of an element, kept up to date as it resizes.
 * Returns 0 until measured (and where ResizeObserver doesn't exist).
 */
function useElementWidth(ref) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current

    if (!element || typeof ResizeObserver === "undefined") {
      return undefined
    }

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [ref])

  return width
}

export default useElementWidth

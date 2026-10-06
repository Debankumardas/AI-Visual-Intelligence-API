import { useEffect } from "react"

const APP_NAME = "AI Visual Intelligence"

/** Keep the browser tab title in step with the current page. */
function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} – ${APP_NAME}` : APP_NAME
  }, [title])
}

export default useDocumentTitle

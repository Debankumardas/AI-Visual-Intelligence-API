import { Compass } from "lucide-react"
import { Link } from "react-router"

import { buttonStyles } from "../components/ui/buttonStyles"
import EmptyState from "../components/ui/EmptyState"
import useAuth from "../hooks/useAuth"
import useDocumentTitle from "../hooks/useDocumentTitle"
import { fallbackPath } from "../routes/navigation"

function NotFound() {
  useDocumentTitle("Page not found")

  const { preferences } = useAuth()

  return (
    <EmptyState
      icon={Compass}
      titleAs="h1"
      title="Page not found"
      description="This address doesn’t match a page. It may have moved, or the link may be mistyped."
      action={
        <Link
          to={fallbackPath(preferences)}
          className={buttonStyles({ variant: "primary" })}
        >
          Go to the start page
        </Link>
      }
    />
  )
}

export default NotFound

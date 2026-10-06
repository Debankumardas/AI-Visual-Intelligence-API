import { useContext } from "react"

import { WorkspaceContext } from "../context/workspace-context"

function useWorkspace() {
  const value = useContext(WorkspaceContext)

  if (!value) {
    throw new Error(
      "useWorkspace must be used inside <WorkspaceProvider>",
    )
  }

  return value
}

export default useWorkspace

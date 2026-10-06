import { Route, Routes } from "react-router"

import AppShell from "./components/layout/AppShell"
import AuthProvider from "./context/AuthProvider"
import WorkspaceProvider from "./context/WorkspaceProvider"
import useAuth from "./hooks/useAuth"
import useWorkspace from "./hooks/useWorkspace"
import Analytics from "./pages/Analytics"
import ImageLab from "./pages/ImageLab"
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import Overview from "./pages/Overview"
import Register from "./pages/Register"
import Settings from "./pages/Settings"
import VideoAnalysis from "./pages/VideoAnalysis"
import {
  PublicOnly,
  RequireAuth,
  RequirePage,
} from "./routes/guards"

// Remounting per user discards one user's results when another signs in.
function Workspace({ children }) {
  const { user } = useAuth()

  return (
    <WorkspaceProvider key={user?.id ?? "signed-out"}>
      {children}
    </WorkspaceProvider>
  )
}

function VideoRoute() {
  const { recordVideoAnalysis } = useWorkspace()

  return <VideoAnalysis onAnalyticsComplete={recordVideoAnalysis} />
}

function AnalyticsRoute() {
  const { videoAnalytics } = useWorkspace()

  return <Analytics videoAnalytics={videoAnalytics} />
}

function App() {
  return (
    <AuthProvider>
      <Workspace>
        <Routes>
          <Route element={<PublicOnly />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route
                index
                element={
                  <RequirePage preferenceKey="dashboard_enabled">
                    <Overview />
                  </RequirePage>
                }
              />

              <Route
                path="image"
                element={
                  <RequirePage preferenceKey="image_analysis_enabled">
                    <ImageLab />
                  </RequirePage>
                }
              />

              <Route
                path="video"
                element={
                  <RequirePage preferenceKey="video_analysis_enabled">
                    <VideoRoute />
                  </RequirePage>
                }
              />

              <Route path="analytics" element={<AnalyticsRoute />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </Workspace>
    </AuthProvider>
  )
}

export default App

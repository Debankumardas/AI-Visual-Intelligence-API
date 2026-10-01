import { useState } from "react"

import Sidebar from "./components/layout/Sidebar"
import Topbar from "./components/layout/Topbar"
import StatCard from "./components/ui/StatCard"
import ImageAnalysis from "./pages/ImageAnalysis"
import VideoAnalysis from "./pages/VideoAnalysis"

import {
  Activity,
  Camera,
  FileImage,
  Video,
} from "lucide-react"

function App() {
  const [activePage, setActivePage] = useState("Dashboard")

  const renderPage = () => {
    if (activePage === "Image Analysis") {
      return <ImageAnalysis />
    }

    if (activePage === "Video Analysis") {
      return <VideoAnalysis />
    }

    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Images Analyzed"
          value="0"
          subtitle="Total image analysis jobs"
          icon={FileImage}
        />

        <StatCard
          title="Videos Processed"
          value="0"
          subtitle="Total video processing jobs"
          icon={Video}
        />

        <StatCard
          title="Objects Detected"
          value="0"
          subtitle="Total detected objects"
          icon={Camera}
        />

        <StatCard
          title="Active Tracks"
          value="0"
          subtitle="Currently tracked objects"
          icon={Activity}
        />

        <div className="sm:col-span-2 xl:col-span-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white">
              Computer Vision Workspace
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Upload images or videos to begin analysis and explore
              detection and tracking analytics.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <section className="flex-1 overflow-auto p-8">
          {renderPage()}
        </section>
      </main>
    </div>
  )
}

export default App

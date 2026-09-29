import {
  BarChart3,
  FileImage,
  LayoutDashboard,
  Settings,
  Video,
} from "lucide-react"

const navigationItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Image Analysis",
    icon: FileImage,
  },
  {
    label: "Video Analysis",
    icon: Video,
  },
  {
    label: "Analytics",
    icon: BarChart3,
  },
]

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-6 py-5">
        <h1 className="text-lg font-bold tracking-tight">
          AI Visual Intelligence
        </h1>

        <p className="mt-1 text-xs text-slate-400">
          Vision Analytics Platform
        </p>
      </div>

      <nav className="flex-1 px-3 py-5">
        <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Workspace
        </p>

        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.label

            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.label)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

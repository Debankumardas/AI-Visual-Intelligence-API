import { useEffect, useState } from "react"
import { Bell, CircleUserRound, Wifi, WifiOff } from "lucide-react"
import { checkHealth } from "../../services/api"

function Topbar() {
  const [apiOnline, setApiOnline] = useState(false)

  useEffect(() => {
    const checkApi = async () => {
      try {
        await checkHealth()
        setApiOnline(true)
      } catch {
        setApiOnline(false)
      }
    }

    checkApi()
  }, [])

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950 px-8">
      <div>
        <h2 className="text-xl font-semibold text-white">
          Dashboard
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Monitor and analyze your computer vision workloads
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
            apiOnline
              ? "border-emerald-900 bg-emerald-950/40"
              : "border-red-900 bg-red-950/40"
          }`}
        >
          {apiOnline ? (
            <Wifi size={14} className="text-emerald-400" />
          ) : (
            <WifiOff size={14} className="text-red-400" />
          )}

          <span
            className={`text-xs font-medium ${
              apiOnline ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {apiOnline ? "API Online" : "API Offline"}
          </span>
        </div>

        <button className="text-slate-400 transition hover:text-white">
          <Bell size={19} />
        </button>

        <div className="flex items-center gap-2">
          <CircleUserRound size={28} className="text-slate-400" />

          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">
              Vision User
            </p>

            <p className="text-xs text-slate-500">
              Analyst
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar

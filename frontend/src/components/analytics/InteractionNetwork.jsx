import { Network } from "lucide-react"

function InteractionNetwork({ interactions }) {
  const entries = Object.entries(interactions || {})

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-slate-800 p-2">
          <Network size={20} className="text-slate-300" />
        </div>

        <div>
          <h3 className="font-semibold text-white">
            Track Interaction Network
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Interaction episodes between tracked objects.
          </p>
        </div>
      </div>

      {entries.length ? (
        <div className="mt-5 space-y-2">
          {entries.map(([pair, episodes]) => {
            const [trackA, trackB] = pair.split(",")

            return (
              <div
                key={pair}
                className="flex items-center justify-between rounded-lg bg-slate-950 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white">
                    Track {trackA}
                  </span>

                  <span className="text-slate-600">
                    ↔
                  </span>

                  <span className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white">
                    Track {trackB}
                  </span>
                </div>

                <span className="text-sm font-semibold text-white">
                  {episodes} {episodes === 1 ? "episode" : "episodes"}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-500">
          No interaction episodes detected for this video.
        </p>
      )}
    </div>
  )
}

export default InteractionNetwork
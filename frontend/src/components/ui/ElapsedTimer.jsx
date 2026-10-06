import { useEffect, useState } from "react"

import { formatClock } from "../../utils/format"

/** Counts up while `running`, e.g. during a long analysis. */
function ElapsedTimer({ running, className }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!running) {
      return undefined
    }

    const startedAt = Date.now()

    const tick = () =>
      setSeconds((Date.now() - startedAt) / 1000)

    tick()

    const intervalId = setInterval(tick, 250)

    return () => {
      clearInterval(intervalId)
      setSeconds(0)
    }
  }, [running])

  return (
    <span className={`tnum font-mono ${className ?? ""}`}>
      {formatClock(seconds)}
    </span>
  )
}

export default ElapsedTimer

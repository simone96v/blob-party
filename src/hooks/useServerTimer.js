// Countdown derivato da question_started_at (timestamp server).
// NON usa setInterval: ricalcola ogni frame via requestAnimationFrame.
// Restituisce timeLeft in secondi (intero) e isExpired.
// `duration` è configurabile (default 15s).

import { useState, useEffect, useRef } from 'react'

const DEFAULT_DURATION = 15

export const useServerTimer = (questionStartedAt, duration = DEFAULT_DURATION) => {
  const [timeLeft, setTimeLeft] = useState(duration)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!questionStartedAt) {
      setTimeLeft(duration)
      return
    }

    const startMs = new Date(questionStartedAt).getTime()

    const tick = () => {
      const elapsed = (Date.now() - startMs) / 1000
      const remaining = Math.max(0, duration - elapsed)
      setTimeLeft(Math.ceil(remaining))

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    tick()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [questionStartedAt, duration])

  return {
    timeLeft,
    isExpired: timeLeft <= 0,
    total: duration,
  }
}

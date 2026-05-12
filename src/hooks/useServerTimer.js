// Countdown derivato da question_started_at (timestamp server).
// NON usa setInterval: ricalcola ogni frame via requestAnimationFrame.
// Restituisce timeLeft in secondi (intero) e isExpired.

import { useState, useEffect, useRef } from 'react'

const QUESTION_DURATION = 15 // secondi

export const useServerTimer = (questionStartedAt) => {
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!questionStartedAt) {
      setTimeLeft(QUESTION_DURATION)
      return
    }

    const startMs = new Date(questionStartedAt).getTime()

    const tick = () => {
      const elapsed = (Date.now() - startMs) / 1000
      const remaining = Math.max(0, QUESTION_DURATION - elapsed)
      setTimeLeft(Math.ceil(remaining))

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    tick()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [questionStartedAt])

  return {
    timeLeft,
    isExpired: timeLeft <= 0,
    total: QUESTION_DURATION,
  }
}

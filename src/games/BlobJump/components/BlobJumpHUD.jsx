import { useState, useEffect, useRef } from 'react'

const BlobJumpHUD = ({ score, duration = 60, running = true, onTimerEnd }) => {
  const [timeLeft, setTimeLeft] = useState(duration)
  const startRef = useRef(null)
  const endedRef = useRef(false)

  useEffect(() => {
    if (!running) return
    startRef.current = Date.now()
    endedRef.current = false

    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const remaining = Math.max(0, duration - elapsed)
      setTimeLeft(Math.ceil(remaining))
      if (remaining <= 0 && !endedRef.current) {
        endedRef.current = true
        onTimerEnd?.()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    let raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, duration, onTimerEnd])

  const urgent = timeLeft <= 10

  return (
    <div style={styles.hud}>
      <div style={styles.score}>
        <span style={styles.scoreValue}>{score}</span>
        <span style={styles.scoreUnit}>m</span>
      </div>
      <div style={{ ...styles.timer, color: urgent ? '#F43F5E' : '#fff' }}>
        {timeLeft}s
      </div>
    </div>
  )
}

const styles = {
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '12px 16px',
    pointerEvents: 'none',
    zIndex: 10,
  },
  score: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 2,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 900,
    color: '#fff',
    textShadow: '0 2px 8px rgba(0,0,0,0.4)',
    letterSpacing: '-0.02em',
  },
  scoreUnit: {
    fontSize: 16,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.7)',
    textShadow: '0 2px 6px rgba(0,0,0,0.3)',
  },
  timer: {
    fontSize: 22,
    fontWeight: 800,
    textShadow: '0 2px 8px rgba(0,0,0,0.4)',
    letterSpacing: '-0.01em',
  },
}

export default BlobJumpHUD

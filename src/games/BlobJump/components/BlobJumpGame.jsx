import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/physics'
import { GameEngine } from '../engine/GameEngine'

const BlobJumpGame = forwardRef(({ seed, blobColor, onScoreUpdate, onDeath, onTimeUp, duration = 60, forceStop = false }, ref) => {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)

  // Expose engine to parent for external input control
  useImperativeHandle(ref, () => ({
    getEngine: () => engineRef.current,
  }), [])
  const timerRef = useRef(null)
  const stoppedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    stoppedRef.current = false
    const dpr = window.devicePixelRatio || 1
    canvas.width = GAME_WIDTH * dpr
    canvas.height = GAME_HEIGHT * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const engine = new GameEngine(canvas, seed, blobColor, onScoreUpdate, onDeath)
    engineRef.current = engine
    engine.start()

    // Client-side timer fallback (server timer is authoritative)
    // duration <= 0 means endless mode — no timer
    if (duration > 0) {
      const startTime = Date.now()
      const tick = () => {
        if (engine.isDead || stoppedRef.current) return
        const elapsed = (Date.now() - startTime) / 1000
        if (elapsed >= duration + 2) { // +2s grace for server timer
          engine.stop()
          stoppedRef.current = true
          onTimeUp?.(engine.score)
          return
        }
        timerRef.current = requestAnimationFrame(tick)
      }
      timerRef.current = requestAnimationFrame(tick)
    }

    return () => {
      engine.stop()
      stoppedRef.current = true
      if (timerRef.current) cancelAnimationFrame(timerRef.current)
    }
  }, [seed]) // eslint-disable-line react-hooks/exhaustive-deps

  // External force stop (server timer expired)
  useEffect(() => {
    if (forceStop && engineRef.current && !stoppedRef.current) {
      engineRef.current.stop()
      stoppedRef.current = true
    }
  }, [forceStop])

  // Responsive canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const pw = parent.clientWidth
      const ph = parent.clientHeight
      const scale = Math.min(pw / GAME_WIDTH, ph / GAME_HEIGHT)
      canvas.style.width = `${GAME_WIDTH * scale}px`
      canvas.style.height = `${GAME_HEIGHT * scale}px`
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    />
  )
})

BlobJumpGame.displayName = 'BlobJumpGame'
export default BlobJumpGame

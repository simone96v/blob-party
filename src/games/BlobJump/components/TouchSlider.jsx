import { useRef, useCallback, useEffect, useState } from 'react'

/**
 * TouchSlider — a horizontal joystick-style slider for mobile controls.
 *
 * A track with a draggable thumb. Dragging left/right maps to a normalized
 * direction in [-1, +1]. The thumb springs back to center on release.
 *
 * Props:
 *   onChange(direction: number) — called continuously during drag with [-1, +1]
 *   onRelease()                — called when touch ends
 *   accentColor                — color for the thumb and active track
 *   disabled                   — disable interaction
 */
const TouchSlider = ({ onChange, onRelease, accentColor = '#8B5CF6', disabled = false }) => {
  const trackRef = useRef(null)
  const [thumbX, setThumbX] = useState(0) // normalized [-1, +1]
  const [active, setActive] = useState(false)
  const activeRef = useRef(false)

  const calcDirection = useCallback((clientX) => {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const halfW = rect.width / 2 - 22 // 22 = thumb radius, keep within track
    const offset = (clientX - center) / halfW
    return Math.max(-1, Math.min(1, offset))
  }, [])

  const handleStart = useCallback((e) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    activeRef.current = true
    setActive(true)
    const x = e.touches ? e.touches[0].clientX : e.clientX
    const dir = calcDirection(x)
    setThumbX(dir)
    onChange?.(dir)
  }, [disabled, calcDirection, onChange])

  const handleMove = useCallback((e) => {
    if (!activeRef.current || disabled) return
    e.preventDefault()
    e.stopPropagation()
    const x = e.touches ? e.touches[0].clientX : e.clientX
    const dir = calcDirection(x)
    setThumbX(dir)
    onChange?.(dir)
  }, [disabled, calcDirection, onChange])

  const handleEnd = useCallback((e) => {
    if (!activeRef.current) return
    e.preventDefault()
    activeRef.current = false
    setActive(false)
    setThumbX(0)
    onRelease?.()
  }, [onRelease])

  // Global move/end listeners so dragging outside the track still works
  useEffect(() => {
    const onMove = (e) => handleMove(e)
    const onEnd = (e) => handleEnd(e)

    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    // Mouse fallback for testing on desktop
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)

    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
    }
  }, [handleMove, handleEnd])

  // Thumb position as percentage from center
  const thumbPct = (thumbX + 1) / 2 * 100 // 0% = full left, 50% = center, 100% = full right

  const isActive = active || thumbX !== 0

  return (
    <div
      ref={trackRef}
      onTouchStart={handleStart}
      onMouseDown={handleStart}
      style={{
        ...S.track,
        opacity: disabled ? 0.4 : 1,
        borderColor: isActive ? accentColor + '60' : 'rgba(255,255,255,0.12)',
      }}
    >
      {/* Center line indicator */}
      <div style={S.centerLine} />

      {/* Direction indicators */}
      <div style={{ ...S.arrow, left: 12 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 3L5 7L9 11" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ ...S.arrow, right: 12 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 3L9 7L5 11" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Active track fill */}
      <div style={{
        ...S.activeFill,
        left: thumbX < 0 ? `${thumbPct}%` : '50%',
        width: `${Math.abs(thumbX) * 50}%`,
        background: `linear-gradient(90deg, ${accentColor}20, ${accentColor}40)`,
      }} />

      {/* Thumb */}
      <div
        style={{
          ...S.thumb,
          left: `${thumbPct}%`,
          background: isActive
            ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
            : 'rgba(255,255,255,0.25)',
          boxShadow: isActive
            ? `0 0 12px ${accentColor}60, 0 2px 8px rgba(0,0,0,0.3)`
            : '0 2px 6px rgba(0,0,0,0.2)',
          transform: `translateX(-50%) scale(${isActive ? 1.1 : 1})`,
        }}
      >
        {/* Grip lines on thumb */}
        <div style={S.gripLines}>
          <div style={S.gripLine} />
          <div style={S.gripLine} />
          <div style={S.gripLine} />
        </div>
      </div>
    </div>
  )
}

const S = {
  track: {
    position: 'relative',
    width: '100%',
    height: 44,
    borderRadius: 22,
    background: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    overflow: 'hidden',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'border-color 0.15s ease',
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    top: '30%',
    bottom: '30%',
    width: 2,
    borderRadius: 1,
    background: 'rgba(255,255,255,0.15)',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
  },
  activeFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 22,
    pointerEvents: 'none',
    transition: 'none',
  },
  thumb: {
    position: 'absolute',
    width: 38,
    height: 32,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease',
    pointerEvents: 'none',
    zIndex: 2,
  },
  gripLines: {
    display: 'flex',
    gap: 3,
    alignItems: 'center',
  },
  gripLine: {
    width: 2,
    height: 14,
    borderRadius: 1,
    background: 'rgba(255,255,255,0.5)',
  },
}

export default TouchSlider

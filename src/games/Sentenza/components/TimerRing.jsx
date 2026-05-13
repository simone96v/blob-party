import { motion } from 'framer-motion'

const R = 18
const CIRC = 2 * Math.PI * R

const TimerRing = ({ timeLeft, total }) => {
  const fraction = total > 0 ? timeLeft / total : 0
  const urgent = timeLeft <= 5

  return (
    <div style={S.wrap}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={R} fill="none" stroke="var(--surface2)" strokeWidth="3" />
        <motion.circle
          cx="22" cy="22" r={R}
          fill="none"
          stroke={urgent ? 'var(--danger)' : '#6366F1'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          animate={{ strokeDashoffset: CIRC * (1 - fraction) }}
          transition={{ duration: 0.3 }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <motion.span
        style={{ ...S.text, color: urgent ? 'var(--danger)' : 'var(--text)' }}
        animate={urgent ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={urgent ? { repeat: Infinity, duration: 0.8 } : {}}
      >
        {timeLeft}
      </motion.span>
    </div>
  )
}

const S = {
  wrap: {
    position: 'relative',
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    position: 'absolute',
    fontSize: 'clamp(13px, 1.6dvh, 16px)',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
}

export default TimerRing

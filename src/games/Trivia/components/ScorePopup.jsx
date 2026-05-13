// Feedback punteggio post-reveal: numero grosso animato + label "Cervellone! / Boh!".
// Mostra anche lo streak attivo se >= 2.

import { motion } from 'framer-motion'

const ScorePopup = ({ points, isCorrect, didAnswer, currentStreak }) => {
  const color =
    points > 0 ? 'var(--success)' :
    points < 0 ? 'var(--danger)' : 'var(--muted)'

  const label = !didAnswer
    ? 'Fantasma 👻'
    : isCorrect
      ? (points >= 18 ? 'Cervellone! 🧠⚡' : 'Genio! ✨')
      : 'Che figura 💀'

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 20 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        gap: 2,
        padding: 'clamp(4px, 0.8dvh, 8px) 0',
      }}
    >
      <span style={{
        color,
        fontSize: 'clamp(24px, 4dvh, 36px)',
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>
        {points > 0 ? `+${points}` : points}
      </span>
      <span style={{
        margin: 0,
        color: 'var(--muted)',
        fontSize: 'clamp(13px, 1.6dvh, 16px)',
        fontWeight: 700,
      }}>
        {label}
      </span>
      {isCorrect && currentStreak >= 2 && (
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          style={{
            marginTop: 2,
            fontSize: 'clamp(11px, 1.3dvh, 13px)',
            fontWeight: 800,
            color: 'var(--warning)',
            background: 'rgba(245, 158, 11, 0.12)',
            padding: '2px 10px',
            borderRadius: 999,
          }}
        >
          🔥 streak x{currentStreak}
        </motion.span>
      )}
    </motion.div>
  )
}

export default ScorePopup

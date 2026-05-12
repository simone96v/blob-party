// Pulsante "Pronto" — toggle per segnalare che il giocatore è pronto.
// Chiama toggle_ready RPC e mostra stato corrente.

import { useState } from 'react'
import { motion } from 'framer-motion'

const ReadyButton = ({ isReady, onToggle, disabled = false, label = 'Pronto' }) => {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading || disabled) return
    setLoading(true)
    try {
      await onToggle()
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.button
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400 }}
      onClick={handleClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        height: 'clamp(48px, 7dvh, 64px)',
        borderRadius: 'var(--radius-sm)',
        border: isReady ? '2px solid var(--success)' : '2px solid var(--border)',
        background: isReady ? 'var(--success)' : 'var(--surface)',
        color: isReady ? 'white' : 'var(--muted)',
        fontSize: 'clamp(16px, 2.5dvh, 20px)',
        fontWeight: 700,
        cursor: disabled || loading ? 'default' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'background 0.2s, border-color 0.2s, color 0.2s',
      }}
    >
      {loading ? '...' : isReady ? `${label} ✓` : label}
    </motion.button>
  )
}

export default ReadyButton

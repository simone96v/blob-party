import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PromptCard from './PromptCard'
import AnswerCard from './AnswerCard'
import Button from '../../../components/ui/Button'
import TimerRing from './TimerRing'
import { haptic } from '../../../utils/haptic'

const SentenzaSelection = ({
  prompt,
  answers,
  timeLeft,
  total,
  onSubmit,
}) => {
  const [selectedId, setSelectedId] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!selectedId || submitted) return
    haptic.medium()
    setSubmitted(true)
    onSubmit?.(selectedId)
  }

  if (submitted) {
    return (
      <div style={S.container}>
        <PromptCard text={prompt} compact />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={S.waitingBox}
        >
          <motion.span
            style={{ fontSize: 40 }}
            animate={{ rotate: [0, -15, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            ⚖️
          </motion.span>
          <p style={S.waitingTitle}>Prova presentata!</p>
          <p style={S.waitingSub}>In attesa del verdetto...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={S.container}>
      <div style={S.topRow}>
        <div style={{ flex: 1 }}>
          <PromptCard text={prompt} compact />
        </div>
        <TimerRing timeLeft={timeLeft} total={total} />
      </div>

      <div style={S.grid}>
        {answers.map((a, i) => (
          <AnswerCard
            key={a.id}
            index={i}
            text={a.text}
            selected={selectedId === a.id}
            onClick={() => setSelectedId(a.id)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <Button variant="primary" width="full" onClick={handleSubmit}>
              Presenta la prova ⚖️
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const S = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(10px, 1.5dvh, 16px)',
    flex: 1,
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(6px, 1dvh, 10px)',
  },
  waitingBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'var(--surface)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    padding: 24,
  },
  waitingTitle: {
    fontSize: 'clamp(18px, 2.4dvh, 22px)',
    fontWeight: 800,
    color: 'var(--text)',
    margin: 0,
  },
  waitingSub: {
    fontSize: 'clamp(13px, 1.7dvh, 15px)',
    fontWeight: 600,
    color: 'var(--muted)',
    margin: 0,
  },
}

export default SentenzaSelection

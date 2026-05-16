// Fase question di Emoji Quiz: header + HUD + emoji card + 2x2 grid risposte + confirm.
// Layout identico a Trivia/QuestionPhase per coerenza visiva nell'app.

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AppHeader from '../../../components/AppHeader'
import GameHUD from '../../../components/GameHUD'
import IconButton from '../../../components/ui/IconButton'
import RoundBadge from '../../../components/ui/RoundBadge'
import AnswerTile from '../../Trivia/components/AnswerTile'
import EmojiQuizCard from './EmojiQuizCard'
import { haptic } from '../../../utils/haptic'
import { accentBtnStyle } from '../../../theme/gameColors'
import { usePlayerAccent } from '../../../hooks/usePlayerAccent'

const spring = { type: 'spring', stiffness: 400, damping: 22 }

const EmojiQuizQuestionPhase = ({
  puzzle,
  roundIdx,
  totalRounds,
  timeLeft,
  timerDuration,
  players,
  localPlayerId,
  localAnswer,
  submitted,
  isExpired,
  isHost,
  eqScores,
  onAnswer,
  onExit,
}) => {
  const C = usePlayerAccent()
  const [selected, setSelected] = useState(null)

  // Reset selezione quando cambia il puzzle.
  useEffect(() => { setSelected(null) }, [puzzle?.id])

  // Players con score aggiornato per il HUD.
  const playersForHud = (players ?? []).map((p) => ({ ...p, score: eqScores?.[p.id] ?? 0 }))

  const handleSelect = (i) => {
    if (submitted || isExpired) return
    setSelected(i)
  }

  const handleConfirm = () => {
    if (selected === null || submitted) return
    haptic.heavy()
    onAnswer(selected)
  }

  return (
    <div style={containerStyle}>
      <AppHeader
        leading={isHost && <IconButton ariaLabel="Esci" onClick={onExit}>←</IconButton>}
        actions={<RoundBadge n={roundIdx + 1} total={totalRounds} accentColor={C.accent} />}
      />
      <GameHUD
        questionNumber={roundIdx + 1}
        totalQuestions={totalRounds}
        timeLeft={timeLeft}
        total={timerDuration}
        players={playersForHud}
        localPlayerId={localPlayerId}
        phase="question"
        accentColor={C.accent}
      />

      <div style={bodyStyle}>
        <EmojiQuizCard puzzle={puzzle} />

        <div style={gridStyle}>
          {puzzle?.answers?.map((ans, i) => (
            <AnswerTile
              key={i}
              index={i}
              text={ans}
              mode="answer"
              isMine={submitted ? i === localAnswer : i === selected}
              isLocked={submitted}
              disabled={submitted || isExpired}
              onClick={() => handleSelect(i)}
            />
          ))}
        </div>

        <div style={footerStyle}>
          <AnimatePresence mode="wait">
            {!submitted && !isExpired && selected !== null && (
              <motion.button
                key="confirm"
                type="button"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={spring}
                whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(0,0,0,0.25)' }}
                whileTap={{ y: 1, scale: 0.97 }}
                onClick={handleConfirm}
                style={{ ...confirmBtnStyle, ...accentBtnStyle(C.accent) }}
              >
                Conferma
              </motion.button>
            )}
            {submitted && (
              <motion.p
                key="answered"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ ...statusTextStyle, color: 'var(--success)' }}
              >
                Bloccata! 🔒
              </motion.p>
            )}
            {!submitted && isExpired && (
              <motion.p
                key="expired"
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                style={{ ...statusTextStyle, color: 'var(--danger)' }}
              >
                Tempo scaduto! 🐌
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

const containerStyle = {
  display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative',
}
const bodyStyle = {
  display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center',
  padding: 'clamp(10px, 1.8dvh, 18px) clamp(14px, 3vw, 22px)',
  gap: 'clamp(8px, 1.2dvh, 12px)',
  overflow: 'hidden',
}
const gridStyle = {
  display: 'grid', gridTemplateColumns: '1fr 1fr',
  gap: 'clamp(8px, 1.2dvh, 12px)',
  flexShrink: 0,
}
const footerStyle = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  minHeight: 'clamp(40px, 6dvh, 52px)',
  flexShrink: 0,
}
const confirmBtnStyle = {
  width: '100%', height: 'clamp(44px, 6dvh, 52px)',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  background: 'var(--accent)',
  color: 'var(--bg)',
  fontSize: 'clamp(15px, 2dvh, 18px)',
  fontWeight: 800,
  letterSpacing: '0.01em',
  cursor: 'pointer',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
  transition: 'opacity 0.15s',
}
const statusTextStyle = {
  margin: 0,
  fontSize: 'clamp(13px, 1.6dvh, 16px)',
  textAlign: 'center',
  fontWeight: 700,
}

export default EmojiQuizQuestionPhase

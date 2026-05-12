// Vista unica per tutti i giocatori (host incluso).
// Fase question: HUD + bottoni risposta
// Fase reveal: risultato + host vede "Prossima domanda"
// Fase final: classifica con podio + host vede "Nuova partita"

import { motion, AnimatePresence } from 'framer-motion'
import GameHUD from '../../components/GameHUD'
import PlayerAvatar from '../../components/PlayerAvatar'
import Button from '../../components/ui/Button'

const ANSWER_LABELS = ['A', 'B', 'C', 'D']
const ANSWER_COLORS = ['#7C3AED', '#0891B2', '#D97706', '#DC2626']
const PODIUM_EMOJIS = ['', '', '']

const ClientView = ({
  currentPhase,
  currentQuestion,
  players,
  roundResults,
  timeLeft,
  isExpired,
  questionNumber,
  totalQuestions,
  localPlayerId,
  localAnswer,
  submitting,
  advancing,
  myRoundResult,
  isHost,
  submitAnswer,
  hostAdvance,
  hasMoreQuestions,
  timerDuration,
}) => {
  const hasAnswered = localAnswer !== null

  // --- QUESTION PHASE ---
  if (currentPhase === 'question') {
    return (
      <div style={S.container}>
        <GameHUD
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          timeLeft={timeLeft}
          total={timerDuration}
          players={players}
          localPlayerId={localPlayerId}
          phase={currentPhase}
        />

        <div style={S.body}>
          <motion.h2
            key={questionNumber}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={S.question}
          >
            {currentQuestion?.question}
          </motion.h2>

          <div style={S.grid}>
            {currentQuestion?.answers.map((ans, i) => {
              const isMine = i === localAnswer
              const canClick = !hasAnswered && !isExpired && !submitting

              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  whileTap={canClick ? { scale: 0.95 } : undefined}
                  onClick={canClick ? () => submitAnswer(i) : undefined}
                  style={{
                    ...S.answerBtn,
                    background: ANSWER_COLORS[i],
                    cursor: canClick ? 'pointer' : 'default',
                    opacity: hasAnswered ? (isMine ? 1 : 0.4) : 1,
                    border: isMine ? '3px solid var(--text)' : '3px solid transparent',
                    pointerEvents: canClick ? 'auto' : 'none',
                  }}
                >
                  <span style={S.answerLabel}>{ANSWER_LABELS[i]}</span>
                  <span style={S.answerText}>{ans}</span>
                </motion.button>
              )
            })}
          </div>

          <div style={S.statusBar}>
            {hasAnswered ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ ...S.statusText, color: 'var(--success)' }}
              >
                Risposta inviata
              </motion.p>
            ) : isExpired ? (
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                style={{ ...S.statusText, color: 'var(--danger)' }}
              >
                Tempo scaduto!
              </motion.p>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  // --- REVEAL PHASE ---
  if (currentPhase === 'reveal') {
    const myResult = myRoundResult
    const myChosen = myResult?.chosen ?? localAnswer
    const myPoints = myResult?.points ?? 0
    const isCorrect = myResult?.correct ?? false
    const correctIdx = currentQuestion?.correct

    return (
      <div style={S.container}>
        <GameHUD
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          timeLeft={0}
          total={timerDuration}
          players={players}
          localPlayerId={localPlayerId}
          phase={currentPhase}
        />

        <div style={S.body}>
          <p style={S.subheading}>
            Domanda {questionNumber} di {totalQuestions}
          </p>

          <h2 style={{ ...S.question, fontSize: 'clamp(14px, 2dvh, 20px)' }}>
            {currentQuestion?.question}
          </h2>

          <div style={S.grid}>
            {currentQuestion?.answers.map((ans, i) => {
              const isCorrectAns = i === correctIdx
              const isMine = i === myChosen
              const bg = isCorrectAns ? 'var(--success)' : isMine ? 'var(--danger)' : 'rgba(255,255,255,0.05)'

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.5 }}
                  animate={{
                    opacity: isCorrectAns || isMine ? 1 : 0.25,
                    scale: isMine && isCorrectAns ? 1.03 : 1,
                  }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  style={{
                    ...S.answerBtn,
                    background: bg,
                    border: isMine
                      ? `3px solid ${isCorrectAns ? 'var(--success)' : 'var(--danger)'}`
                      : '3px solid transparent',
                  }}
                >
                  <span style={S.answerLabel}>{ANSWER_LABELS[i]}</span>
                  <span style={S.answerText}>{ans}</span>
                </motion.div>
              )
            })}
          </div>

          <AnimatePresence>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={S.scoreArea}
            >
              <span
                style={{
                  color:
                    myPoints > 0
                      ? 'var(--success)'
                      : myPoints < 0
                        ? 'var(--danger)'
                        : 'var(--muted)',
                  fontSize: 'clamp(28px, 5dvh, 40px)',
                  fontWeight: 800,
                }}
              >
                {myPoints > 0 ? `+${myPoints}` : myPoints}
              </span>
              <span style={S.statusText}>
                {myChosen == null
                  ? 'Non hai risposto'
                  : isCorrect
                    ? 'Risposta corretta!'
                    : 'Risposta sbagliata'}
              </span>
            </motion.div>
          </AnimatePresence>

          <div style={S.footer}>
            {isHost ? (
              <Button
                variant="primary"
                width="full"
                onClick={hostAdvance}
                disabled={advancing}
              >
                {advancing ? '...' : hasMoreQuestions ? 'Prossima domanda' : 'Classifica finale'}
              </Button>
            ) : (
              <p style={S.waitingText}>In attesa dell'host...</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // --- FINAL PHASE ---
  if (currentPhase === 'final') {
    const sorted = [...players].sort((a, b) => b.score - a.score)
    const myRank = sorted.findIndex((p) => p.id === localPlayerId) + 1
    const myScore = sorted.find((p) => p.id === localPlayerId)?.score ?? 0

    return (
      <div style={S.container}>
        <div style={{ ...S.body, padding: 'clamp(12px, 2dvh, 24px) clamp(12px, 3vw, 24px)' }}>
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ ...S.question, fontSize: 'clamp(20px, 3dvh, 28px)', marginBottom: 4 }}
          >
            Classifica Finale
          </motion.h2>

          {/* Podium top 3 */}
          {sorted.length >= 2 && (
            <div style={S.podium}>
              {[1, 0, 2].map((rank) => {
                const p = sorted[rank]
                if (!p) return <div key={rank} style={{ flex: 1 }} />
                const isFirst = rank === 0
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: rank === 0 ? 0.3 : rank === 1 ? 0.1 : 0.5 }}
                    style={{
                      ...S.podiumSlot,
                      transform: isFirst ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <span style={{ fontSize: isFirst ? 32 : 24 }}>{PODIUM_EMOJIS[rank]}</span>
                    <PlayerAvatar player={p} showScore={false} size={isFirst ? 'lg' : 'md'} />
                    <span style={{
                      fontSize: 'clamp(11px, 1.4dvh, 14px)',
                      fontWeight: 600,
                      color: 'var(--text)',
                      maxWidth: 80,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                    }}>
                      {p.name}
                    </span>
                    <span style={{
                      fontSize: 'clamp(14px, 1.8dvh, 18px)',
                      fontWeight: 800,
                      color: 'var(--accent)',
                    }}>
                      {p.score}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Full leaderboard */}
          <div style={S.leaderboard}>
            {sorted.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                style={{
                  ...S.leaderRow,
                  border: p.id === localPlayerId ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                  background: p.id === localPlayerId ? 'rgba(124, 58, 237, 0.1)' : 'var(--surface)',
                }}
              >
                <span style={S.rank}>#{i + 1}</span>
                <div style={{ ...S.chipDot, backgroundColor: p.color }} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 'clamp(13px, 1.6dvh, 16px)' }}>
                  {p.name}
                </span>
                <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 'clamp(15px, 1.8dvh, 19px)' }}>
                  {p.score}
                </span>
              </motion.div>
            ))}
          </div>

          <div style={S.footer}>
            {isHost ? (
              <Button
                variant="primary"
                width="full"
                onClick={hostAdvance}
                disabled={advancing}
              >
                {advancing ? '...' : 'Nuova partita'}
              </Button>
            ) : (
              <p style={S.waitingText}>In attesa dell'host...</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div style={S.container}>
      <div style={S.body}>
        <p style={S.statusText}>In attesa...</p>
      </div>
    </div>
  )
}

// --- Styles ---
const S = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: 'clamp(8px, 1.5dvh, 16px) clamp(12px, 3vw, 24px)',
    gap: 'clamp(6px, 1dvh, 12px)',
    overflow: 'hidden',
  },
  subheading: {
    color: 'var(--muted)',
    fontSize: 'clamp(11px, 1.3dvh, 13px)',
    textAlign: 'center',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    fontWeight: 600,
    flexShrink: 0,
  },
  question: {
    fontWeight: 700,
    fontSize: 'clamp(15px, 2.2dvh, 22px)',
    lineHeight: 1.35,
    textAlign: 'center',
    letterSpacing: '-0.01em',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'clamp(6px, 1dvh, 10px)',
    flex: 1,
    minHeight: 0,
  },
  answerBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    color: 'white',
    padding: 'clamp(6px, 1dvh, 12px)',
    gap: 4,
    cursor: 'pointer',
  },
  answerLabel: {
    fontSize: 'clamp(10px, 1.2dvh, 12px)',
    fontWeight: 800,
    opacity: 0.6,
    letterSpacing: '0.1em',
  },
  answerText: {
    fontWeight: 600,
    fontSize: 'clamp(13px, 1.7dvh, 17px)',
    lineHeight: 1.3,
    wordBreak: 'break-word',
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'clamp(24px, 3dvh, 32px)',
    flexShrink: 0,
  },
  statusText: {
    color: 'var(--muted)',
    fontSize: 'clamp(13px, 1.6dvh, 16px)',
    textAlign: 'center',
    fontWeight: 500,
  },
  scoreArea: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    gap: 2,
  },
  footer: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  waitingText: {
    color: 'var(--muted)',
    fontSize: 'clamp(13px, 1.6dvh, 16px)',
    fontWeight: 500,
    textAlign: 'center',
    padding: 'clamp(10px, 1.5dvh, 16px) 0',
  },
  podium: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 'clamp(8px, 2vw, 16px)',
    flexShrink: 0,
    padding: 'clamp(4px, 1dvh, 12px) 0',
  },
  podiumSlot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    maxWidth: 100,
  },
  leaderboard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(4px, 0.8dvh, 8px)',
    flex: 1,
    overflow: 'auto',
    scrollbarWidth: 'none',
  },
  leaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(8px, 1.5vw, 12px)',
    padding: 'clamp(8px, 1.2dvh, 12px) clamp(10px, 2vw, 16px)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-sm)',
  },
  rank: {
    fontSize: 'clamp(13px, 1.6dvh, 16px)',
    fontWeight: 800,
    color: 'var(--accent)',
    minWidth: 28,
    textAlign: 'center',
  },
  chipDot: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    flexShrink: 0,
  },
}

export default ClientView

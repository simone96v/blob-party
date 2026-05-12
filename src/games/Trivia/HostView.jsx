// Vista Host (spettatore) — TV / schermo grande.
// Mostra: domanda, griglia risposte, timer, avatar giocatori, risultati.
// NESSUN pulsante di controllo: il ritmo lo governano i giocatori via "Pronto".

import { motion, AnimatePresence } from 'framer-motion'
import PlayerAvatar from '../../components/PlayerAvatar'

const ANSWER_COLORS = ['#7C3AED', '#0891B2', '#D97706', '#DC2626']

const HostView = ({
  currentPhase,
  currentQuestion,
  players,
  roundResults,
  timeLeft,
  questionNumber,
  totalQuestions,
  readyCounts,
  gameState,
}) => {
  // --- QUESTION PHASE ---
  if (currentPhase === 'question') {
    return (
      <div style={S.container}>
        <div style={S.topBar}>
          <p style={S.progress}>
            Domanda {questionNumber} di {totalQuestions}
          </p>
          <TimerDisplay timeLeft={timeLeft} />
        </div>

        <h2 style={S.question}>{currentQuestion?.question}</h2>

        <div style={S.grid}>
          {currentQuestion?.answers.map((ans, i) => (
            <div key={i} style={{ ...S.answerBtn, background: ANSWER_COLORS[i] }}>
              <span>{ans}</span>
            </div>
          ))}
        </div>

        <div style={S.playerRow}>
          {players
            .filter((p) => !p.is_host)
            .map((p) => (
              <PlayerAvatar key={p.id} player={p} showScore size="sm" />
            ))}
        </div>
      </div>
    )
  }

  // --- REVEAL PHASE ---
  if (currentPhase === 'reveal') {
    const getPlayersByAnswer = (ansIdx) => {
      if (!roundResults) return []
      return players.filter((p) => {
        const r = roundResults[p.id]
        return r && r.chosen === ansIdx
      })
    }

    return (
      <div style={S.container}>
        <p style={S.progress}>
          Domanda {questionNumber} di {totalQuestions}
        </p>

        <h2 style={S.question}>{currentQuestion?.question}</h2>

        <div style={S.grid}>
          {currentQuestion?.answers.map((ans, i) => {
            const isCorrect = i === currentQuestion.correct
            const bg = isCorrect ? 'var(--success)' : 'var(--danger)'
            const opacity = isCorrect ? 1 : 0.45
            const votePlayers = getPlayersByAnswer(i)

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0.5 }}
                animate={{ opacity, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                style={{ ...S.answerBtn, background: bg }}
              >
                <span>{ans}</span>
                {votePlayers.length > 0 && (
                  <div style={S.voterRow}>
                    {votePlayers.map((p) => {
                      const pts = roundResults[p.id]?.points ?? 0
                      return (
                        <div key={p.id} style={{ position: 'relative' }}>
                          <PlayerAvatar player={p} showScore={false} size="sm" />
                          <motion.span
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                              ...S.scoreBadge,
                              background: pts > 0 ? 'var(--success)' : 'var(--danger)',
                            }}
                          >
                            {pts > 0 ? `+${pts}` : pts}
                          </motion.span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        <ReadyIndicator players={players} readyCounts={readyCounts} />
      </div>
    )
  }

  // --- FINAL PHASE ---
  if (currentPhase === 'final') {
    const sorted = [...players]
      .filter((p) => !p.is_host)
      .sort((a, b) => b.score - a.score)

    return (
      <div style={S.container}>
        <h2 style={{ ...S.question, fontSize: 'clamp(22px, 3.5dvh, 32px)' }}>
          Classifica Finale
        </h2>

        <div style={S.leaderboard}>
          {sorted.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={S.leaderRow}
            >
              <span style={S.rank}>#{i + 1}</span>
              <PlayerAvatar player={p} showScore={false} size="md" />
              <span style={S.playerName}>{p.name}</span>
              <span style={S.playerScore}>{p.score}</span>
            </motion.div>
          ))}
        </div>

        <ReadyIndicator players={players} readyCounts={readyCounts} />
      </div>
    )
  }

  // Fallback
  return (
    <div style={S.container}>
      <p style={S.progress}>In attesa...</p>
    </div>
  )
}

// --- Sub-components ---

const TimerDisplay = ({ timeLeft }) => {
  const urgent = timeLeft <= 5
  return (
    <motion.div
      animate={{
        scale: urgent ? [1, 1.1, 1] : 1,
        color: urgent ? 'var(--danger)' : 'var(--muted)',
      }}
      transition={urgent ? { repeat: Infinity, duration: 1 } : {}}
      style={S.timer}
    >
      {timeLeft}s
    </motion.div>
  )
}

const ReadyIndicator = ({ players, readyCounts }) => {
  const nonHost = players.filter((p) => !p.is_host)
  return (
    <div style={S.readyArea}>
      <p style={S.counter}>
        {readyCounts.ready}/{readyCounts.total} pronti
      </p>
      <div className="flex" style={{ gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
        {nonHost.map((p) => (
          <PlayerAvatar
            key={p.id}
            player={p}
            showScore={false}
            size="sm"
            dimmed={!p.is_ready}
          />
        ))}
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
    padding: 'clamp(12px, 2.5dvh, 24px) clamp(16px, 4vw, 28px)',
    gap: 'clamp(8px, 1.5dvh, 14px)',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  progress: {
    color: 'var(--muted)',
    fontSize: 'clamp(12px, 1.5dvh, 14px)',
    textAlign: 'center',
    flexShrink: 0,
  },
  timer: {
    fontSize: 'clamp(20px, 3dvh, 28px)',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  question: {
    fontWeight: 700,
    fontSize: 'clamp(16px, 2.5dvh, 24px)',
    lineHeight: 1.3,
    textAlign: 'center',
    letterSpacing: '-0.01em',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'clamp(8px, 1.2dvh, 12px)',
    flex: 1,
    minHeight: 0,
  },
  answerBtn: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    color: 'white',
    fontWeight: 600,
    fontSize: 'clamp(13px, 1.8dvh, 17px)',
    padding: 'clamp(8px, 1.5dvh, 16px)',
    lineHeight: 1.3,
    wordBreak: 'break-word',
    gap: 6,
  },
  voterRow: {
    display: 'flex',
    gap: 4,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  scoreBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    color: 'white',
    borderRadius: 8,
    padding: '1px 5px',
    fontSize: 10,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  playerRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  readyArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  counter: {
    color: 'var(--muted)',
    fontSize: 'clamp(13px, 1.8dvh, 16px)',
    textAlign: 'center',
    fontWeight: 600,
    flexShrink: 0,
  },
  leaderboard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(8px, 1.5dvh, 14px)',
    flex: 1,
    justifyContent: 'center',
  },
  leaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(8px, 2vw, 16px)',
    padding: 'clamp(8px, 1.5dvh, 14px)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-sm)',
  },
  rank: {
    fontSize: 'clamp(18px, 2.5dvh, 24px)',
    fontWeight: 800,
    color: 'var(--accent)',
    minWidth: 40,
    textAlign: 'center',
  },
  playerName: {
    flex: 1,
    fontSize: 'clamp(14px, 2dvh, 18px)',
    fontWeight: 600,
  },
  playerScore: {
    fontSize: 'clamp(18px, 2.5dvh, 24px)',
    fontWeight: 800,
    color: 'var(--accent)',
  },
}

export default HostView

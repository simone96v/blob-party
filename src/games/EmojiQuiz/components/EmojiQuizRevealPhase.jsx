// Fase reveal di Emoji Quiz: emoji card + risposte (correct verde / wrong rosso) +
// titolo del puzzle (chip) + voter dots + footer host con "Avanti" / "Classifica".

import { motion } from 'framer-motion'
import AppHeader from '../../../components/AppHeader'
import GameHUD from '../../../components/GameHUD'
import IconButton from '../../../components/ui/IconButton'
import Button from '../../../components/ui/Button'
import RoundBadge from '../../../components/ui/RoundBadge'
import AnswerTile from '../../Trivia/components/AnswerTile'
import EmojiQuizCard from './EmojiQuizCard'
import { accentBtnStyle } from '../../../theme/gameColors'
import { usePlayerAccent } from '../../../hooks/usePlayerAccent'

const EmojiQuizRevealPhase = ({
  puzzle,
  roundIdx,
  totalRounds,
  timerDuration,
  players,
  localPlayerId,
  localAnswer,
  eqRoundAnswers,
  eqRoundResult,
  eqScores,
  isHost,
  hasMoreRounds,
  advancing,
  onAdvance,
  onExit,
}) => {
  const C = usePlayerAccent()
  const correctIdx = puzzle?.correct
  const myChosen = localAnswer
  const isCorrect = myChosen != null && myChosen === correctIdx
  const myPoints = eqRoundResult?.points?.[localPlayerId] ?? 0

  // Voters per ogni indice di risposta (per i mini avatar sui tile).
  const votersByAnswer = {}
  Object.entries(eqRoundAnswers ?? {}).forEach(([pid, ans]) => {
    if (!ans || ans.round !== roundIdx) return
    const p = players.find((pp) => pp.id === pid)
    if (!p) return
    if (!votersByAnswer[ans.chosen]) votersByAnswer[ans.chosen] = []
    votersByAnswer[ans.chosen].push(p)
  })

  const playersForHud = (players ?? []).map((p) => ({ ...p, score: eqScores?.[p.id] ?? 0 }))

  return (
    <div style={containerStyle}>
      <AppHeader
        leading={isHost && <IconButton ariaLabel="Esci" onClick={onExit}>←</IconButton>}
        actions={<RoundBadge n={roundIdx + 1} total={totalRounds} accentColor={C.accent} />}
      />
      <GameHUD
        questionNumber={roundIdx + 1}
        totalQuestions={totalRounds}
        timeLeft={0}
        total={timerDuration}
        players={playersForHud}
        localPlayerId={localPlayerId}
        phase="reveal"
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
              mode="reveal"
              isMine={i === myChosen}
              isCorrect={i === correctIdx}
              voters={votersByAnswer[i] ?? []}
            />
          ))}
        </div>

        {/* Score popup: punti guadagnati in questo round */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...scorePopupStyle,
            background: isCorrect ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg2, var(--surface))',
            border: isCorrect ? '1.5px solid var(--success)' : '1.5px solid var(--border)',
          }}
        >
          <span style={{
            fontSize: 'clamp(14px, 1.7dvh, 17px)',
            fontWeight: 700,
            color: isCorrect ? 'var(--success)' : 'var(--muted)',
          }}>
            {isCorrect ? `✓ Corretto! +${myPoints} punti` : myChosen != null ? '✗ Sbagliato' : 'Nessuna risposta'}
          </span>
        </motion.div>

        <div style={footerStyle}>
          {isHost ? (
            <Button variant="primary" width="full" onClick={onAdvance} disabled={advancing} style={accentBtnStyle(C.accent)}>
              {advancing ? '...' : hasMoreRounds ? 'Avanti tutta! →' : 'Chi ha vinto?! 🏆'}
            </Button>
          ) : (
            <p style={waitingTextStyle}>Aspettando il boss... 👑</p>
          )}
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
const scorePopupStyle = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  padding: 'clamp(8px, 1.2dvh, 12px) clamp(12px, 2vw, 18px)',
  borderRadius: 'var(--radius-sm)',
  flexShrink: 0,
}
const footerStyle = {
  flexShrink: 0,
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  gap: 6, paddingTop: 4,
}
const waitingTextStyle = {
  color: 'var(--muted)',
  fontSize: 'clamp(13px, 1.6dvh, 16px)',
  fontWeight: 500,
  textAlign: 'center',
  padding: 'clamp(10px, 1.5dvh, 16px) 0',
}

export default EmojiQuizRevealPhase

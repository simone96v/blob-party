// Fase reveal: header + HUD + question card compatta + grid risposte con esito +
// score popup + voters distribution + footer host-only (Avanti / Chi ha vinto).

import AppHeader from '../../../components/AppHeader'
import GameHUD from '../../../components/GameHUD'
import IconButton from '../../../components/ui/IconButton'
import Button from '../../../components/ui/Button'
import QuestionCard from '../components/QuestionCard'
import AnswerTile from '../components/AnswerTile'
import ScorePopup from '../components/ScorePopup'

const RevealPhase = ({
  currentQuestion,
  questionNumber,
  totalQuestions,
  timerDuration,
  players,
  localPlayerId,
  localAnswer,
  myRoundResult,
  roundResults,
  isHost,
  hasMoreQuestions,
  advancing,
  onAdvance,
  onExit,
}) => {
  const myChosen = myRoundResult?.chosen ?? localAnswer
  const myPoints = myRoundResult?.points ?? 0
  const isCorrect = myRoundResult?.correct ?? false
  const correctIdx = currentQuestion?.correct
  const didAnswer = myChosen != null
  const myPlayer = players.find((p) => p.id === localPlayerId)
  const myStreak = myPlayer?.current_streak ?? 0

  // Build voters-per-answer map
  const votersByAnswer = {}
  if (roundResults) {
    Object.entries(roundResults).forEach(([pid, r]) => {
      if (r?.chosen == null) return
      const p = players.find((pp) => pp.id === pid)
      if (!p) return
      if (!votersByAnswer[r.chosen]) votersByAnswer[r.chosen] = []
      votersByAnswer[r.chosen].push(p)
    })
  }

  return (
    <div style={containerStyle}>
      <AppHeader
        leading={isHost && <IconButton ariaLabel="Esci" onClick={onExit}>←</IconButton>}
        actions={<RoundBadge n={questionNumber} total={totalQuestions} />}
      />
      <GameHUD
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        timeLeft={0}
        total={timerDuration}
        players={players}
        localPlayerId={localPlayerId}
        phase="reveal"
      />

      <div style={bodyStyle}>
        <QuestionCard question={currentQuestion} compact />

        <div style={gridStyle}>
          {currentQuestion?.answers.map((ans, i) => (
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

        <ScorePopup
          points={myPoints}
          isCorrect={isCorrect}
          didAnswer={didAnswer}
          currentStreak={myStreak}
        />

        <div style={footerStyle}>
          {isHost ? (
            <Button variant="primary" width="full" onClick={onAdvance} disabled={advancing}>
              {advancing ? '...' : hasMoreQuestions ? 'Avanti tutta! →' : 'Chi ha vinto?! 🏆'}
            </Button>
          ) : (
            <p style={waitingTextStyle}>Aspettando il boss... 👑</p>
          )}
        </div>
      </div>
    </div>
  )
}

const RoundBadge = ({ n, total }) => (
  <div style={{
    background: 'var(--bg2)',
    color: 'var(--accent)',
    fontWeight: 800,
    fontSize: 'clamp(11px, 1.4dvh, 13px)',
    padding: '5px 12px',
    borderRadius: 999,
    border: '1.5px solid rgba(124,58,237,0.18)',
    letterSpacing: '0.05em',
    minWidth: 44,
    textAlign: 'center',
  }}>
    {n}/{total}
  </div>
)

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
  position: 'relative',
}

const bodyStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  padding: 'clamp(10px, 1.8dvh, 18px) clamp(14px, 3vw, 22px)',
  gap: 'clamp(10px, 1.6dvh, 16px)',
  overflow: 'hidden',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'clamp(8px, 1.2dvh, 12px)',
  flexShrink: 0,
}

const footerStyle = {
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  paddingTop: 4,
}

const waitingTextStyle = {
  color: 'var(--muted)',
  fontSize: 'clamp(13px, 1.6dvh, 16px)',
  fontWeight: 500,
  textAlign: 'center',
  padding: 'clamp(10px, 1.5dvh, 16px) 0',
}

export default RevealPhase

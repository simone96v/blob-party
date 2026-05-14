import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CountdownOverlay from '../../components/CountdownOverlay'
import Spinner from '../../components/ui/Spinner'
import { useSession } from '../../stores/useSession'
import { pushRoom } from '../../lib/room'
import { useSentenza, initSentenzaState } from './useSentenza'
import JudgingSetup from './components/JudgingSetup'
import SentenzaSelection from './components/SentenzaSelection'
import SentenzaSelectionWaiting from './components/SentenzaSelectionWaiting'
import SentenzaJudging from './components/SentenzaJudging'
import SentenzaJudgingWaiting from './components/SentenzaJudgingWaiting'
import SentenzaReveal from './components/SentenzaReveal'
import SentenzaFinal from './components/SentenzaFinal'

const Loading = () => (
  <div className="flex items-center justify-center" style={{ flex: 1 }}>
    <Spinner size="lg" />
  </div>
)

const Sentenza = () => {
  const g = useSentenza()
  const navigate = useNavigate()
  const setAwaitingGameChange = useSession((s) => s.setAwaitingGameChange)
  const [replaying, setReplaying] = useState(false)

  const handleChangeGame = async () => {
    setAwaitingGameChange(true)
    navigate('/games', { replace: true })
    const s = useSession.getState()
    const resetPlayers = (s.players || []).map((p) => ({ ...p, score: 0 }))
    const fullState = {
      players: resetPlayers,
      currentIdx: 0,
      round: 0,
      activeGame: null,
      selectedCategory: s.gameState?.selectedCategory ?? null,
      categoryVotes: s.gameState?.categoryVotes ?? {},
      gameVotes: {},
      selectedGame: null,
    }
    await pushRoom(s.roomCode, 'game_voting', fullState)
    setAwaitingGameChange(false)
  }

  const handleReplay = async () => {
    if (replaying) return
    setReplaying(true)
    const s = useSession.getState()
    const resetPlayers = (s.players || []).map((p) => ({ ...p, score: 0 }))
    const sentenzaState = initSentenzaState(resetPlayers, s.gameState?.totalRounds ?? 8)
    const now = new Date().toISOString()

    if (s.mode === 'online' && s.roomCode) {
      const fullState = {
        players: resetPlayers,
        currentIdx: 0,
        round: 0,
        activeGame: 'sentenza',
        ...sentenzaState,
      }
      await pushRoom(s.roomCode, 'sentenza_countdown', fullState, now)
    } else {
      useSession.setState({
        players: resetPlayers,
        gameState: sentenzaState,
        currentPhase: 'sentenza_countdown',
        questionStartedAt: now,
      })
    }
    setReplaying(false)
  }

  if (g.currentPhase === 'sentenza_countdown') {
    return <CountdownOverlay questionStartedAt={g.questionStartedAt} />
  }

  if (g.currentPhase === 'sentenza_judging_setup') {
    return (
      <div className="screen screen-narrow">
        <div className="screen-body">
          <JudgingSetup
            judgeName={g.judge?.name}
            judgeColor={g.judge?.color}
            round={g.currentRound + 1}
            prompt={g.currentPrompt?.text}
          />
        </div>
      </div>
    )
  }

  if (g.currentPhase === 'sentenza_selection') {
    return (
      <div className="screen screen-narrow">
        <div className="screen-body" style={{ overflowY: 'auto', scrollbarWidth: 'none' }}>
          {g.isJudge ? (
            <SentenzaSelectionWaiting
              prompt={g.currentPrompt?.text}
              players={g.challengers}
              submittedIds={g.submittedIds}
              timeLeft={g.timeLeft}
              total={30}
            />
          ) : (
            <SentenzaSelection
              key={g.currentRound}
              prompt={g.currentPrompt?.text}
              answers={g.myHand}
              timeLeft={g.timeLeft}
              total={30}
              onSubmit={g.submitProof}
            />
          )}
        </div>
      </div>
    )
  }

  if (g.currentPhase === 'sentenza_judging') {
    return (
      <div className="screen screen-narrow">
        <div className="screen-body" style={{ overflowY: 'auto', scrollbarWidth: 'none' }}>
          {g.isJudge ? (
            <SentenzaJudging
              key={g.currentRound}
              prompt={g.currentPrompt?.text}
              proofs={g.proofs}
              timeLeft={g.timeLeft}
              total={30}
              onVerdict={g.emitVerdict}
            />
          ) : (
            <SentenzaJudgingWaiting
              prompt={g.currentPrompt?.text}
              myAnswer={g.myAnswer}
              judgeName={g.judge?.name}
              timeLeft={g.timeLeft}
              total={30}
            />
          )}
        </div>
      </div>
    )
  }

  if (g.currentPhase === 'sentenza_reveal') {
    return (
      <div className="screen screen-narrow">
        <div className="screen-body" style={{ overflowY: 'auto', scrollbarWidth: 'none' }}>
          <SentenzaReveal
            prompt={g.currentPrompt?.text}
            winnerAnswer={g.winnerProof?.text}
            winnerName={g.winnerPlayer?.name}
            winnerColor={g.winnerPlayer?.color}
            otherProofs={g.otherProofs}
            isHost={g.isHost}
            advancing={g.advancing}
            onNext={g.hostAdvance}
          />
        </div>
      </div>
    )
  }

  if (g.currentPhase === 'sentenza_final') {
    return (
      <div className="screen screen-narrow">
        <div className="screen-body">
          <SentenzaFinal
            players={g.players}
            localPlayerId={g.localPlayerId}
            isHost={g.isHost}
            advancing={replaying}
            onReplay={handleReplay}
            onChangeGame={handleChangeGame}
          />
        </div>
      </div>
    )
  }

  return <Loading />
}

export default Sentenza

import CountdownOverlay from '../../components/CountdownOverlay'
import Spinner from '../../components/ui/Spinner'
import { useSentenza } from './useSentenza'
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
            advancing={g.advancing}
            onReplay={() => {}}
            onChangeGame={() => {}}
          />
        </div>
      </div>
    )
  }

  return <Loading />
}

export default Sentenza

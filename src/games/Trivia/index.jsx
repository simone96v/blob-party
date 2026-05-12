// Entry point del gioco Trivia — modello host-controlled.
// Fasi: countdown → question → reveal → ... → final

import { useTrivia } from './useTrivia'
import ClientView from './ClientView'
import CountdownOverlay from '../../components/CountdownOverlay'
import Spinner from '../../components/ui/Spinner'

const Trivia = () => {
  const trivia = useTrivia()

  // Countdown phase: 3-2-1-VIA!
  if (trivia.currentPhase === 'countdown') {
    return (
      <CountdownOverlay
        questionStartedAt={trivia.questionStartedAt}
      />
    )
  }

  // Waiting for initial sync
  if (!trivia.currentQuestion && trivia.currentPhase !== 'final') {
    return (
      <div className="flex items-center justify-center" style={{ flex: 1 }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return <ClientView {...trivia} />
}

export default Trivia

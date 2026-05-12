// Entry point del gioco Trivia — modello "pronto democratico".
// L'host vede la HostView (spettatore), i client la ClientView.
// Il routing tra le fasi (question, reveal, final) è gestito internamente.

import { useTrivia } from './useTrivia'
import HostView from './HostView'
import ClientView from './ClientView'
import Spinner from '../../components/ui/Spinner'

const Trivia = () => {
  const trivia = useTrivia()

  // Mostra spinner se non c'è ancora una domanda (in attesa del sync iniziale)
  if (!trivia.currentQuestion && trivia.currentPhase !== 'final') {
    return (
      <div className="flex items-center justify-center" style={{ flex: 1 }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return trivia.isHost ? (
    <HostView {...trivia} />
  ) : (
    <ClientView {...trivia} />
  )
}

export default Trivia

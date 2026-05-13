import { useSession } from '../../stores/useSession'
import CountdownOverlay from '../../components/CountdownOverlay'
import Spinner from '../../components/ui/Spinner'

const Loading = () => (
  <div className="flex items-center justify-center" style={{ flex: 1 }}>
    <Spinner size="lg" />
  </div>
)

const Sentenza = () => {
  const currentPhase = useSession((s) => s.currentPhase)
  const questionStartedAt = useSession((s) => s.questionStartedAt)

  if (currentPhase === 'sentenza_countdown') {
    return <CountdownOverlay questionStartedAt={questionStartedAt} />
  }

  return <Loading />
}

export default Sentenza

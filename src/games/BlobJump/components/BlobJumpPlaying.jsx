import { useState, useCallback, useRef, useEffect } from 'react'
import BlobJumpGame from './BlobJumpGame'
import BlobJumpHUD from './BlobJumpHUD'
import BlobJumpDeath from './BlobJumpDeath'

const BlobJumpPlaying = ({
  seed,
  blobColor,
  roundDuration,
  isExpired,
  scoreSubmitted,
  onSubmitScore,
  onUpdateScore,
}) => {
  const [score, setScore] = useState(0)
  const [dead, setDead] = useState(false)
  const scoreRef = useRef(0)

  const handleScore = useCallback((s) => {
    setScore(s)
    scoreRef.current = s
    onUpdateScore?.(s)
  }, [onUpdateScore])

  const handleDeath = useCallback((s) => {
    setScore(s)
    scoreRef.current = s
    setDead(true)
    onSubmitScore(s)
  }, [onSubmitScore])

  const handleTimeUp = useCallback((s) => {
    setScore(s)
    scoreRef.current = s
    onSubmitScore(s)
  }, [onSubmitScore])

  // Server timer expired — submit if not already done
  useEffect(() => {
    if (isExpired && !scoreSubmitted && !dead) {
      onSubmitScore(scoreRef.current)
    }
  }, [isExpired, scoreSubmitted, dead, onSubmitScore])

  return (
    <div style={styles.container}>
      <div style={styles.gameArea}>
        <BlobJumpGame
          seed={seed}
          blobColor={blobColor}
          duration={roundDuration}
          forceStop={isExpired}
          onScoreUpdate={handleScore}
          onDeath={handleDeath}
          onTimeUp={handleTimeUp}
        />
        <BlobJumpHUD score={score} duration={roundDuration} running={!dead && !isExpired} />
        {dead && (
          <BlobJumpDeath
            score={score}
            blobColor={blobColor}
            waitingMessage={!isExpired ? 'Aspettando gli altri...' : null}
          />
        )}
        {isExpired && !dead && scoreSubmitted && (
          <BlobJumpDeath
            score={score}
            blobColor={blobColor}
            waitingMessage="Tempo scaduto!"
          />
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0a1e',
    overflow: 'hidden',
  },
  gameArea: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
}

export default BlobJumpPlaying

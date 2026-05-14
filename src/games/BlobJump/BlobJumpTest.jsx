import { useState, useCallback } from 'react'
import BlobJumpGame from './components/BlobJumpGame'
import BlobJumpHUD from './components/BlobJumpHUD'
import BlobJumpDeath from './components/BlobJumpDeath'

const TEST_SEED = 48291037
const TEST_COLOR = '#8B5CF6'
const DURATION = 60

const BlobJumpTest = () => {
  const [score, setScore] = useState(0)
  const [dead, setDead] = useState(false)
  const [gameKey, setGameKey] = useState(0)
  const [timeUp, setTimeUp] = useState(false)

  const handleScore = useCallback((s) => setScore(s), [])
  const handleDeath = useCallback((s) => {
    setScore(s)
    setDead(true)
  }, [])
  const handleTimeUp = useCallback((s) => {
    setScore(s)
    setTimeUp(true)
  }, [])

  const restart = () => {
    setScore(0)
    setDead(false)
    setTimeUp(false)
    setGameKey((k) => k + 1)
  }

  const running = !dead && !timeUp

  return (
    <div style={styles.container}>
      <div style={styles.gameArea}>
        <BlobJumpGame
          key={gameKey}
          seed={TEST_SEED}
          blobColor={TEST_COLOR}
          duration={DURATION}
          onScoreUpdate={handleScore}
          onDeath={handleDeath}
          onTimeUp={handleTimeUp}
        />
        <BlobJumpHUD score={score} duration={DURATION} running={running} />
        {dead && <BlobJumpDeath score={score} blobColor={TEST_COLOR} onRestart={restart} />}
        {timeUp && !dead && (
          <BlobJumpDeath score={score} blobColor={TEST_COLOR} onRestart={restart} />
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

export default BlobJumpTest

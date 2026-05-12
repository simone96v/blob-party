// Schermata che monta il componente gioco.
// Nel modello "pronto democratico", il gioco gestisce internamente
// le sue fasi (question, reveal, final). Non c'è un "endGame" che naviga altrove.

import { Suspense, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppHeader from '../components/AppHeader'
import ErrorBanner from '../components/ErrorBanner'
import Spinner from '../components/ui/Spinner'
import { getGame } from '../data/games'

const GameScreen = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const game = getGame(gameId)

  useEffect(() => {
    if (!game) navigate('/lobby', { replace: true })
  }, [game, navigate])

  if (!game) return null

  const GameComponent = game.component

  return (
    <motion.div
      className="screen"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <AppHeader />
      <ErrorBanner />
      <div className="screen-body" style={{ padding: 0 }}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center" style={{ flex: 1 }}>
              <Spinner size="lg" />
            </div>
          }
        >
          <GameComponent />
        </Suspense>
      </div>
    </motion.div>
  )
}

export default GameScreen

// Lobby di gioco Trivia (session-mode) — uses GameLobbyLayout.
// Settings (round/domande) + CategoryWheel + player grid.

import { useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import GameLobbyLayout from '../components/GameLobbyLayout'
import CategoryWheel from '../components/CategoryWheel'
import ErrorBanner from '../components/ErrorBanner'
import BlobLoader from '../components/BlobLoader'
import { useSession } from '../stores/useSession'
import { useSettings } from '../stores/useSettings'
import { pushRoom, rpcStartGame } from '../lib/room'
import { getDeck, preloadPool } from '../lib/aiQuestions'
import { TRIVIA_CATEGORIES } from '../games/Trivia/constants'
import { usePlayerAccent } from '../hooks/usePlayerAccent'

const ALL_CATEGORIES = TRIVIA_CATEGORIES

const TriviaLobbyScreen = () => {
  const navigate = useNavigate()

  const isHost         = useSession((s) => s.isHost)
  const mode           = useSession((s) => s.mode)
  const roomCode       = useSession((s) => s.roomCode)
  const localPlayerId  = useSession((s) => s.localPlayerId)
  const players        = useSession((s) => s.players)
  const gameState      = useSession((s) => s.gameState)
  const showError      = useSession((s) => s.showError)
  const setAwaitingGC  = useSession((s) => s.setAwaitingGameChange)

  const C = usePlayerAccent()
  const isSolo = mode === 'local'
  const canControl = isHost || isSolo

  const triviaSessionRoundsLocal = useSettings((s) => s.triviaSessionRounds)
  const triviaQuestionsLocal     = useSettings((s) => s.triviaQuestionsPerRound)
  const setTotalRounds           = useSettings((s) => s.setTriviaSessionRounds)
  const setQuestionsPerRound     = useSettings((s) => s.setTriviaQuestionsPerRound)
  const timerDuration            = useSettings((s) => s.timerDuration)

  const session = gameState?.triviaSession ?? null
  const roundIdx        = session?.roundIdx ?? 0
  const totalRounds     = session?.totalRounds ?? triviaSessionRoundsLocal
  const questionsPerRound = session?.questionsPerRound ?? triviaQuestionsLocal
  const categoriesPlayed  = session?.categoriesPlayed ?? []
  const spinTarget = session?.spinTarget ?? null
  const launching = session?.launching ?? false
  const launchingRef = useRef(false)
  useEffect(() => { launchingRef.current = launching }, [launching])
  useEffect(() => { launchingRef.current = false }, [])

  const currentSpinner = useMemo(() => {
    if (players.length === 0) return null
    const seed = (roomCode || '').split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0)
    const idx = Math.abs(seed + roundIdx * 7919) % players.length
    return players[idx]?.id ?? null
  }, [roomCode, roundIdx, players])

  const isSpinner = localPlayerId === currentSpinner
  const spinnerPlayer = players.find((p) => p.id === currentSpinner)

  const availableCategories = useMemo(
    () => ALL_CATEGORIES.filter((c) => !categoriesPlayed.includes(c.id)),
    [categoriesPlayed],
  )

  useEffect(() => { preloadPool() }, [])

  // Init session
  useEffect(() => {
    if (!canControl) return
    if (gameState?.triviaSession) return
    const s = useSession.getState()
    const newGameState = {
      ...s.gameState,
      triviaSession: {
        roundIdx: 0,
        totalRounds: triviaSessionRoundsLocal,
        questionsPerRound: triviaQuestionsLocal,
        categoriesPlayed: [],
        cumulativeScores: {},
        spinTarget: null,
      },
    }
    useSession.setState({ gameState: newGameState })
    if (s.mode === 'online' && s.roomCode) {
      pushRoom(s.roomCode, s.currentPhase, {
        players: s.players,
        currentIdx: s.currentIdx,
        round: s.round,
        activeGame: s.activeGame,
        ...newGameState,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canControl])

  const updateSessionSetting = (patch) => {
    if (!canControl) return
    const s = useSession.getState()
    const newSession = { ...(s.gameState?.triviaSession ?? {}), ...patch }
    const newGameState = { ...s.gameState, triviaSession: newSession }
    useSession.setState({ gameState: newGameState })
    if (s.mode === 'online' && s.roomCode) {
      pushRoom(s.roomCode, s.currentPhase, {
        players: s.players,
        currentIdx: s.currentIdx,
        round: s.round,
        activeGame: s.activeGame,
        ...newGameState,
      })
    }
  }

  const handleQuestionsChange = (n) => {
    setQuestionsPerRound(n)
    updateSessionSetting({ questionsPerRound: n })
  }

  const handleRoundsChange = (n) => {
    setTotalRounds(n)
    updateSessionSetting({ totalRounds: n })
  }

  const handleExit = async () => {
    const s = useSession.getState()
    if (s.mode !== 'online') {
      navigate('/solo/games', { replace: true })
      return
    }
    setAwaitingGC(true)
    navigate('/games', { replace: true })
    const fullState = {
      players: (s.players || []).map((p) => ({ ...p, score: 0 })),
      currentIdx: 0,
      round: 0,
      activeGame: null,
      selectedCategory: s.gameState?.selectedCategory ?? null,
      categoryVotes: s.gameState?.categoryVotes ?? {},
      gameVotes: {},
      selectedGame: null,
    }
    await pushRoom(s.roomCode, 'game_voting', fullState)
    setAwaitingGC(false)
  }

  const handleRequestSpin = useCallback(() => {
    if (!isSpinner || launchingRef.current || spinTarget) return
    if (availableCategories.length === 0) return

    const winIdx = Math.floor(Math.random() * availableCategories.length)
    const winner = availableCategories[winIdx]

    const s = useSession.getState()
    const newSession = { ...(s.gameState?.triviaSession ?? {}), spinTarget: winner.id }
    const newGameState = { ...s.gameState, triviaSession: newSession }
    useSession.setState({ gameState: newGameState })
    if (s.mode === 'online' && s.roomCode) {
      pushRoom(s.roomCode, s.currentPhase, {
        players: s.players,
        currentIdx: s.currentIdx,
        round: s.round,
        activeGame: s.activeGame,
        ...newGameState,
      })
    }
  }, [isSpinner, spinTarget, availableCategories])

  const setLaunchingState = useCallback((value) => {
    const s = useSession.getState()
    const newSession = { ...(s.gameState?.triviaSession ?? {}), launching: value }
    const newGameState = { ...s.gameState, triviaSession: newSession }
    useSession.setState({ gameState: newGameState })
    if (s.mode === 'online' && s.roomCode) {
      pushRoom(s.roomCode, s.currentPhase, {
        players: s.players,
        currentIdx: s.currentIdx,
        round: s.round,
        activeGame: s.activeGame,
        ...newGameState,
      })
    }
  }, [])

  const handleSpinEnd = useCallback(async (category) => {
    if (!canControl || launchingRef.current) return
    launchingRef.current = true

    const s = useSession.getState()
    const freshSession = s.gameState?.triviaSession ?? {}
    const freshCategoriesPlayed = freshSession.categoriesPlayed ?? []
    const freshRoundIdx = freshSession.roundIdx ?? 0
    const freshQuestionsPerRound = freshSession.questionsPerRound ?? questionsPerRound

    const launchSession = {
      ...freshSession,
      categoriesPlayed: [...freshCategoriesPlayed, category.id],
      currentCategory: category.id,
      spinTarget: null,
      launching: true,
    }
    const launchGameState = { ...s.gameState, triviaSession: launchSession }
    useSession.setState({ gameState: launchGameState })

    try {
      const deckData = await getDeck(category.id, freshQuestionsPerRound)
      const resetScores = freshRoundIdx === 0

      if (s.mode === 'online' && s.roomCode) {
        const startResult = await rpcStartGame(s.roomCode, deckData, timerDuration, resetScores)
        if (startResult.error) {
          console.error('[trivia-lobby] startGame:', startResult.error)
          showError('generic')
          setLaunchingState(false)
          launchingRef.current = false
        }
      } else {
        const resetPlayers = resetScores
          ? (s.players || []).map((p) => ({
              ...p, score: 0, current_streak: 0, best_streak: 0,
              correct_count: 0, total_speed_ms: 0,
            }))
          : s.players
        const now = new Date().toISOString()
        useSession.setState({
          players: resetPlayers,
          gameState: {
            deck: deckData,
            current_round: 0,
            current_question: deckData[0],
            round_results: {},
            triviaSession: launchSession,
          },
          currentPhase: 'countdown',
          questionStartedAt: now,
          activeGame: 'trivia',
        })
        navigate('/game/trivia', { replace: true })
      }
    } catch (err) {
      console.error('[trivia-lobby] handleSpinEnd:', err)
      showError('generic')
      setLaunchingState(false)
      launchingRef.current = false
    }
  }, [canControl, questionsPerRound, timerDuration, showError, setLaunchingState, navigate])

  if (launching) {
    return <BlobLoader text="Preparando le domande..." />
  }

  return (
    <GameLobbyLayout
      gameEmoji="🧠"
      gameName="Trivia"
      gameDescription={
        categoriesPlayed.length === 0
          ? 'La ruota decide la categoria!'
          : `Giocate: ${categoriesPlayed.map((id) => ALL_CATEGORIES.find((c) => c.id === id)?.emoji).join(' ')}`
      }
      players={players}
      canControl={canControl}
      onBack={handleExit}
    >
      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={settingsCard}
      >
        <div style={settingRow}>
          <span style={settingLabelStyle}>Round</span>
          <Stepper
            value={totalRounds}
            onDecrement={() => canControl && handleRoundsChange(totalRounds - 1)}
            onIncrement={() => canControl && handleRoundsChange(totalRounds + 1)}
            disabled={!canControl || launching || !!spinTarget || roundIdx > 0}
            min={1} max={5}
          />
        </div>
        <div style={{ ...settingRow, marginTop: 'clamp(6px, 1dvh, 10px)' }}>
          <span style={settingLabelStyle}>Domande</span>
          <Stepper
            value={questionsPerRound}
            onDecrement={() => canControl && handleQuestionsChange(questionsPerRound - 1)}
            onIncrement={() => canControl && handleQuestionsChange(questionsPerRound + 1)}
            disabled={!canControl || launching || !!spinTarget || roundIdx > 0}
            min={1} max={15}
          />
        </div>
      </motion.div>

      {/* Wheel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <CategoryWheel
          categories={availableCategories}
          spinTarget={spinTarget}
          onRequestSpin={handleRequestSpin}
          onSpinEnd={handleSpinEnd}
          disabled={launching || !!spinTarget}
          canSpin={isSpinner}
          spinnerName={spinnerPlayer?.name ?? ''}
        />
      </motion.div>
    </GameLobbyLayout>
  )
}

const Stepper = ({ value, onDecrement, onIncrement, disabled, min, max }) => {
  const decDisabled = disabled || value <= min
  const incDisabled = disabled || value >= max
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <motion.button
        type="button"
        onClick={onDecrement}
        disabled={decDisabled}
        whileHover={decDisabled ? undefined : { scale: 1.1 }}
        whileTap={decDisabled ? undefined : { scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        style={{ ...stepBtn, opacity: decDisabled ? 0.4 : 1 }}
      >
        {'−'}
      </motion.button>
      <span style={stepValue}>{value}</span>
      <motion.button
        type="button"
        onClick={onIncrement}
        disabled={incDisabled}
        whileHover={incDisabled ? undefined : { scale: 1.1 }}
        whileTap={incDisabled ? undefined : { scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        style={{ ...stepBtn, opacity: incDisabled ? 0.4 : 1 }}
      >
        +
      </motion.button>
    </div>
  )
}

const settingsCard = {
  background: 'var(--surface)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-sm)',
  padding: 'clamp(10px, 1.5dvh, 14px) clamp(14px, 3vw, 18px)',
}
const settingRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}
const settingLabelStyle = {
  fontSize: 'clamp(13px, 1.5dvh, 15px)',
  fontWeight: 700,
  color: 'var(--text)',
}
const stepBtn = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: '1.5px solid var(--border-strong)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 17,
  fontWeight: 800,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const stepValue = {
  minWidth: 26,
  textAlign: 'center',
  fontSize: 'clamp(15px, 1.8dvh, 19px)',
  fontWeight: 900,
  color: 'var(--accent)',
}

export default TriviaLobbyScreen

// Lobby Emoji Quiz (session mode + ruota categorie) — uses GameLobbyLayout.

import { useEffect, useCallback, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import GameLobbyLayout from '../components/GameLobbyLayout'
import CategoryWheel from '../components/CategoryWheel'
import BlobLoader from '../components/BlobLoader'
import { useSession } from '../stores/useSession'
import { pushRoom } from '../lib/room'
import {
  loadEmojiQuizDeck,
  preloadEmojiQuizPool,
  EMOJI_QUIZ_CATEGORIES,
} from '../lib/emojiQuizDeck'
import { usePlayerAccent } from '../hooks/usePlayerAccent'

const WHEEL_CATEGORIES = EMOJI_QUIZ_CATEGORIES.filter((c) => c.id !== 'tutte')

const DEFAULT_TOTAL_ROUNDS = 1
const DEFAULT_QUESTIONS = 7
const MIN_ROUNDS = 1
const MAX_ROUNDS = 3
const MIN_QUESTIONS = 5
const MAX_QUESTIONS = 15

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

const EmojiQuizLobbyScreen = () => {
  const navigate = useNavigate()

  const isHost = useSession((s) => s.isHost)
  const mode = useSession((s) => s.mode)
  const roomCode = useSession((s) => s.roomCode)
  const localPlayerId = useSession((s) => s.localPlayerId)
  const players = useSession((s) => s.players)
  const gameState = useSession((s) => s.gameState)
  const showError = useSession((s) => s.showError)
  const setAwaitingGC = useSession((s) => s.setAwaitingGameChange)

  const C = usePlayerAccent()
  const isSolo = mode === 'local'
  const canControl = isHost || isSolo

  const session = gameState?.eqSession ?? null
  const roundIdx = session?.roundIdx ?? 0
  const totalRounds = session?.totalRounds ?? DEFAULT_TOTAL_ROUNDS
  const questionsPerRound = session?.questionsPerRound ?? DEFAULT_QUESTIONS
  const categoriesPlayed = session?.categoriesPlayed ?? []
  const spinTarget = session?.spinTarget ?? null
  const launching = session?.launching ?? false

  const launchingRef = useRef(false)
  useEffect(() => { launchingRef.current = launching }, [launching])
  useEffect(() => { launchingRef.current = false }, [])

  const currentSpinner = useMemo(() => {
    if (players.length === 0) return null
    const seed = (roomCode || 'solo').split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0)
    const idx = Math.abs(seed + roundIdx * 7919) % players.length
    return players[idx]?.id ?? null
  }, [roomCode, roundIdx, players])
  const isSpinner = isSolo || localPlayerId === currentSpinner
  const spinnerPlayer = players.find((p) => p.id === currentSpinner)

  const availableCategories = useMemo(
    () => WHEEL_CATEGORIES.filter((c) => !categoriesPlayed.includes(c.id)),
    [categoriesPlayed],
  )

  useEffect(() => { preloadEmojiQuizPool() }, [])

  // Init / reset session
  useEffect(() => {
    if (!canControl) return
    const cur = gameState?.eqSession
    if (cur && (cur.roundIdx ?? 0) > 0) return

    const needsReset = !cur
      || (cur.categoriesPlayed ?? []).length > 0
      || cur.spinTarget != null
      || cur.launching === true

    if (!needsReset) return

    const s = useSession.getState()
    const newSession = {
      roundIdx: 0,
      totalRounds: cur?.totalRounds ?? DEFAULT_TOTAL_ROUNDS,
      questionsPerRound: cur?.questionsPerRound ?? DEFAULT_QUESTIONS,
      categoriesPlayed: [],
      currentCategory: null,
      spinTarget: null,
      launching: false,
    }
    const newGameState = { ...s.gameState, eqSession: newSession }
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

  const updateSession = useCallback((patch) => {
    if (!canControl) return
    const s = useSession.getState()
    const newSession = { ...(s.gameState?.eqSession ?? {}), ...patch }
    const newGameState = { ...s.gameState, eqSession: newSession }
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
  }, [canControl])

  const handleRoundsChange = (n) => updateSession({ totalRounds: clamp(n, MIN_ROUNDS, MAX_ROUNDS) })
  const handleQuestionsChange = (n) => updateSession({ questionsPerRound: clamp(n, MIN_QUESTIONS, MAX_QUESTIONS) })

  const handleExit = useCallback(async () => {
    const s = useSession.getState()
    if (s.mode !== 'online') {
      navigate('/solo/games', { replace: true })
      return
    }
    setAwaitingGC(true)
    navigate('/games', { replace: true })
    const fullState = {
      players: (s.players || []).map((p) => ({ ...p, score: 0, correct_count: 0 })),
      currentIdx: 0,
      round: 0,
      activeGame: null,
      selectedCategory: s.gameState?.selectedCategory ?? null,
      categoryVotes: s.gameState?.categoryVotes ?? {},
      gameVotes: {},
      selectedGame: null,
    }
    if (s.roomCode) await pushRoom(s.roomCode, 'game_voting', fullState)
    setAwaitingGC(false)
  }, [navigate, setAwaitingGC])

  const handleRequestSpin = useCallback(() => {
    if (!isSpinner || launchingRef.current || spinTarget) return
    if (availableCategories.length === 0) return
    const winIdx = Math.floor(Math.random() * availableCategories.length)
    const winner = availableCategories[winIdx]
    const s = useSession.getState()
    const newSession = { ...(s.gameState?.eqSession ?? {}), spinTarget: winner.id }
    const newGameState = { ...s.gameState, eqSession: newSession }
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

  const handleSpinEnd = useCallback(async (category) => {
    if (!canControl || launchingRef.current) return
    launchingRef.current = true

    const s = useSession.getState()
    const freshSession = s.gameState?.eqSession ?? {}
    const launchSession = {
      ...freshSession,
      currentCategory: category.id,
      categoriesPlayed: [...(freshSession.categoriesPlayed ?? []), category.id],
      spinTarget: null,
      launching: true,
    }
    const launchGameState = { ...s.gameState, eqSession: launchSession }
    useSession.setState({ gameState: launchGameState })

    try {
      const deck = await loadEmojiQuizDeck(launchSession.questionsPerRound ?? DEFAULT_QUESTIONS, category.id)
      const now = new Date().toISOString()
      const resetScores = (launchSession.roundIdx ?? 0) === 0

      const fullState = {
        players: resetScores
          ? (s.players || []).map((p) => ({ ...p, score: 0, correct_count: 0 }))
          : s.players,
        currentIdx: 0,
        round: 0,
        activeGame: 'emojiquiz',
        selectedGame: 'emojiquiz',
        eqSession: { ...launchSession, launching: false },
        eqDeck: deck,
        eqRoundIdx: 0,
        eqRoundAnswers: {},
        eqHintUsed: {},
        eqRoundResult: null,
        eqRoundLog: [],
        eqScores: resetScores ? {} : (s.gameState?.eqScores ?? {}),
        eqStreaks: {},
        eqCorrectCount: resetScores ? {} : (s.gameState?.eqCorrectCount ?? {}),
      }

      if (s.mode === 'online' && s.roomCode) {
        const pushRes = await pushRoom(s.roomCode, 'emojiquiz_countdown', fullState, now)
        if (pushRes.error) {
          showError('generic')
          updateSession({ launching: false })
          launchingRef.current = false
        }
      } else {
        useSession.setState({
          players: fullState.players,
          gameState: fullState,
          currentPhase: 'emojiquiz_countdown',
          questionStartedAt: now,
          activeGame: 'emojiquiz',
        })
        navigate('/game/emojiquiz', { replace: true })
      }
    } catch (e) {
      console.error('[emojiquiz-lobby] spin end:', e)
      showError('generic')
      updateSession({ launching: false })
      launchingRef.current = false
    }
  }, [canControl, showError, updateSession, navigate])

  if (launching) {
    return <BlobLoader text="Preparando le domande..." />
  }

  return (
    <GameLobbyLayout
      gameEmoji="🎬"
      gameName="Emoji Quiz"
      gameDescription={
        categoriesPlayed.length === 0
          ? 'Decifra gli emoji! La ruota decide la categoria.'
          : `Giocate: ${categoriesPlayed.map((id) => WHEEL_CATEGORIES.find((c) => c.id === id)?.emoji ?? '').join(' ')}`
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
            min={MIN_ROUNDS} max={MAX_ROUNDS}
          />
        </div>
        <div style={{ ...settingRow, marginTop: 'clamp(6px, 1dvh, 10px)' }}>
          <span style={settingLabelStyle}>Domande</span>
          <Stepper
            value={questionsPerRound}
            onDecrement={() => canControl && handleQuestionsChange(questionsPerRound - 1)}
            onIncrement={() => canControl && handleQuestionsChange(questionsPerRound + 1)}
            disabled={!canControl || launching || !!spinTarget || roundIdx > 0}
            min={MIN_QUESTIONS} max={MAX_QUESTIONS}
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
        −
      </motion.button>
      <span style={stepValueStyle}>{value}</span>
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
const stepValueStyle = {
  minWidth: 26,
  textAlign: 'center',
  fontSize: 'clamp(15px, 1.8dvh, 19px)',
  fontWeight: 900,
  color: 'var(--accent)',
}

export default EmojiQuizLobbyScreen

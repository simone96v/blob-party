// Lobby di gioco Trivia (session-mode).
// Mostra:
//   - settings: numero domande per round + numero round (host only edit)
//   - wheel categorie con bottone "Spin!"
//   - score cumulativo della sessione (dal round 2 in poi)
//
// Flow:
//   1. Host configura settings (sync via gameState)
//   2. Host preme Spin → wheel anima → estrae categoria
//   3. Al termine animazione, host chiama startTriviaGame con AI deck
//   4. Tutti i client navigano su /game/trivia via room sync (phase=countdown)
//
// I client NON-host vedono settings disabilitate e bottone disabilitato (solo host spinna).

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import IconButton from '../components/ui/IconButton'
import GradientTitle from '../components/ui/GradientTitle'
import CategoryWheel from '../components/CategoryWheel'
import ErrorBanner from '../components/ErrorBanner'
import { useSession } from '../stores/useSession'
import { useSettings } from '../stores/useSettings'
import { pushRoom, rpcStartGame } from '../lib/room'
import { generateDeck, prefetchCategory, clearAiCache } from '../lib/aiQuestions'

// 8 categorie tematiche — trivia alcolico tra amici 🍻
const ALL_CATEGORIES = [
  { id: 'cocktail',  label: 'Cocktail',   emoji: '🍹', color: '#7C3AED' },
  { id: 'sbronze',   label: 'Sbronze',    emoji: '🥴', color: '#F59E0B' },
  { id: 'birra',     label: 'Birra&Vino', emoji: '🍺', color: '#16A34A' },
  { id: 'giochi',    label: 'Giochi',     emoji: '🎲', color: '#EF4444' },
  { id: 'vip',       label: 'VIP',        emoji: '⭐', color: '#EC4899' },
  { id: 'musica',    label: 'Musica',     emoji: '🎵', color: '#3B82F6' },
  { id: 'cinema',    label: 'Cinema',     emoji: '🎬', color: '#F97316' },
  { id: 'hot',       label: 'Hot',        emoji: '🌶️', color: '#06B6D4' },
]

const TriviaLobbyScreen = () => {
  const navigate = useNavigate()

  const isHost         = useSession((s) => s.isHost)
  const roomCode       = useSession((s) => s.roomCode)
  const localPlayerId  = useSession((s) => s.localPlayerId)
  const players        = useSession((s) => s.players)
  const gameState      = useSession((s) => s.gameState)
  const showError      = useSession((s) => s.showError)
  const setAwaitingGC  = useSession((s) => s.setAwaitingGameChange)

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

  const [launching, setLaunching] = useState(false)
  const [spinResult, setSpinResult] = useState(null)

  // Categorie ancora "spinnabili" (escluse quelle già giocate).
  const availableCategories = useMemo(
    () => ALL_CATEGORIES.filter((c) => !categoriesPlayed.includes(c.id)),
    [categoriesPlayed],
  )

  // Init session: se gameState non ha triviaSession, host la crea.
  useEffect(() => {
    if (!isHost) return
    if (gameState?.triviaSession) return
    const s = useSession.getState()
    const newGameState = {
      ...s.gameState,
      triviaSession: {
        roundIdx: 0,
        totalRounds: triviaSessionRoundsLocal,
        questionsPerRound: triviaQuestionsLocal,
        categoriesPlayed: [],
        cumulativeScores: {}, // playerId → total
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
    // All'inizio della sessione, pulisci cache AI così le partite di stasera
    // sono diverse da quelle di ieri.
    if (roundIdx === 0) clearAiCache()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost])

  // Pre-fetch: appena la lobby è pronta, scalda la cache AI in background.
  useEffect(() => {
    if (!isHost) return
    availableCategories.forEach((c) => prefetchCategory(c.id, questionsPerRound + 3))
  }, [isHost, availableCategories, questionsPerRound])

  // Update settings on session: host modifica e si propaga ai client.
  const updateSessionSetting = (patch) => {
    if (!isHost) return
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

  // Host esce: torna a /games e resetta sessione trivia.
  const handleExit = async () => {
    setAwaitingGC(true)
    navigate('/games', { replace: true })
    const s = useSession.getState()
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

  // Wheel spinned: estrae categoria → host chiama startGame
  const handleSpinEnd = async (category) => {
    if (!isHost || launching) return
    setSpinResult(category)
    setLaunching(true)
    try {
      // Genera deck via AI (con fallback locale)
      const deck = await generateDeck(category.id, questionsPerRound)
      // Aggiorna session state PRIMA di lanciare il game
      const s = useSession.getState()
      const newSession = {
        ...(s.gameState?.triviaSession ?? {}),
        categoriesPlayed: [...categoriesPlayed, category.id],
        currentCategory: category.id,
      }
      const newGameState = { ...s.gameState, triviaSession: newSession }
      useSession.setState({ gameState: newGameState })
      // Push state aggiornato così tutti i client sanno la categoria
      await pushRoom(s.roomCode, s.currentPhase, {
        players: s.players,
        currentIdx: s.currentIdx,
        round: s.round,
        activeGame: s.activeGame,
        ...newGameState,
      })

      // Lancia il game: round > 0 = non resetta scores
      const resetScores = roundIdx === 0
      const { error } = await rpcStartGame(roomCode, deck, timerDuration, resetScores)
      if (error) {
        console.error('[trivia-lobby] startGame:', error)
        showError('generic')
        setLaunching(false)
        setSpinResult(null)
      }
      // Su successo, room phase diventa 'countdown' e tutti vanno su /game/trivia
    } catch (err) {
      console.error('[trivia-lobby] handleSpinEnd:', err)
      showError('generic')
      setLaunching(false)
      setSpinResult(null)
    }
  }

  const ENTRY_TITLES = ['🎬 Round 1', '🎯 Round 2', '🏆 Round Finale']
  const roundTitle = ENTRY_TITLES[roundIdx] ?? `Round ${roundIdx + 1}`

  return (
    <div className="screen screen-narrow">
      <AppHeader
        leading={isHost && (
          <IconButton ariaLabel="Esci" onClick={handleExit}>←</IconButton>
        )}
        actions={
          <div style={S.roundBadge}>
            {roundIdx + 1}/{totalRounds}
          </div>
        }
      />
      <ErrorBanner />

      <div className="screen-body" style={{
        justifyContent: 'flex-start',
        gap: 'clamp(12px, 2dvh, 18px)',
        paddingTop: 'clamp(8px, 1.5dvh, 14px)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center' }}
        >
          <GradientTitle as="h1" size="lg">{roundTitle}</GradientTitle>
          <p style={S.subtitle}>
            {categoriesPlayed.length === 0
              ? 'La ruota decide la categoria — preparati!'
              : `Già giocato: ${categoriesPlayed.map((id) => ALL_CATEGORIES.find((c) => c.id === id)?.emoji).join(' ')}`}
          </p>
        </motion.div>

        {/* Settings card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={S.settingsCard}
        >
          <div style={S.settingRow}>
            <span style={S.settingLabel}>Domande per round</span>
            <Stepper
              value={questionsPerRound}
              onDecrement={() => isHost && handleQuestionsChange(questionsPerRound - 1)}
              onIncrement={() => isHost && handleQuestionsChange(questionsPerRound + 1)}
              disabled={!isHost || launching || roundIdx > 0}
              min={3} max={15}
            />
          </div>
          {/* Disabilitato se round già iniziato — non si può cambiare a metà sessione */}
          {roundIdx > 0 && (
            <p style={S.hint}>
              Impostazioni fissate per questa sessione 🔒
            </p>
          )}
        </motion.div>

        {/* Wheel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', justifyContent: 'center', flex: 1, minHeight: 0, alignItems: 'center' }}
        >
          <CategoryWheel
            categories={availableCategories}
            onSpinEnd={handleSpinEnd}
            disabled={!isHost || launching}
          />
        </motion.div>

        {/* Non-host wait message */}
        {!isHost && (
          <p style={S.waitText}>
            👑 L'host sta scegliendo la categoria...
          </p>
        )}
      </div>
    </div>
  )
}

const Stepper = ({ value, onDecrement, onIncrement, disabled, min, max }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <button
      type="button"
      onClick={onDecrement}
      disabled={disabled || value <= min}
      style={{ ...S.stepBtn, opacity: (disabled || value <= min) ? 0.4 : 1 }}
    >
      −
    </button>
    <span style={S.stepValue}>{value}</span>
    <button
      type="button"
      onClick={onIncrement}
      disabled={disabled || value >= max}
      style={{ ...S.stepBtn, opacity: (disabled || value >= max) ? 0.4 : 1 }}
    >
      +
    </button>
  </div>
)

const S = {
  roundBadge: {
    background: 'var(--bg2)',
    color: 'var(--accent)',
    fontWeight: 800,
    fontSize: 'clamp(11px, 1.4dvh, 13px)',
    padding: '5px 12px',
    borderRadius: 999,
    border: '1.5px solid rgba(124,58,237,0.18)',
    letterSpacing: '0.05em',
    minWidth: 44,
    textAlign: 'center',
  },
  subtitle: {
    margin: '6px 0 0',
    color: 'var(--muted)',
    fontSize: 'clamp(13px, 1.6dvh, 15px)',
    fontWeight: 500,
  },
  settingsCard: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    padding: 'clamp(12px, 2dvh, 16px) clamp(14px, 3vw, 18px)',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingLabel: {
    fontSize: 'clamp(13px, 1.5dvh, 15px)',
    fontWeight: 700,
    color: 'var(--text)',
  },
  hint: {
    margin: '8px 0 0',
    fontSize: 'clamp(11px, 1.3dvh, 12px)',
    color: 'var(--muted)',
    textAlign: 'center',
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: '1.5px solid var(--border-strong)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: 18,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 'clamp(16px, 2dvh, 20px)',
    fontWeight: 900,
    color: 'var(--accent)',
  },
  waitText: {
    margin: 0,
    textAlign: 'center',
    color: 'var(--muted)',
    fontSize: 'clamp(13px, 1.6dvh, 15px)',
    fontWeight: 600,
  },
}

export default TriviaLobbyScreen

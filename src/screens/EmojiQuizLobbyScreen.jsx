// Lobby Emoji Quiz: selettore categoria + selettore round + start.
// L'host pubblica il deck in gameState.eqDeck. I client validano i guess
// localmente sul deck (con answers) — gli answers non sono inviati extra,
// fanno parte del payload Realtime una volta che il deck è caricato.

import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppHeader from '../components/AppHeader'
import IconButton from '../components/ui/IconButton'
import Button from '../components/ui/Button'
import GradientTitle from '../components/ui/GradientTitle'
import MiniBlob, { useMiniExpr } from '../components/MiniBlob'
import { useSession } from '../stores/useSession'
import { pushRoom } from '../lib/room'
import {
  loadEmojiQuizDeck,
  preloadEmojiQuizPool,
  EMOJI_QUIZ_CATEGORIES,
} from '../lib/emojiQuizDeck'
import { accentBtnStyle } from '../theme/gameColors'
import { usePlayerAccent } from '../hooks/usePlayerAccent'

const ROUND_OPTIONS = [5, 7, 10, 15]

const EmojiQuizLobbyScreen = () => {
  const C = usePlayerAccent()
  const navigate = useNavigate()
  const isHost = useSession((s) => s.isHost)
  const mode = useSession((s) => s.mode)
  const players = useSession((s) => s.players)
  const gameState = useSession((s) => s.gameState)
  const showError = useSession((s) => s.showError)
  const setAwaitingGC = useSession((s) => s.setAwaitingGameChange)
  const expr = useMiniExpr()

  const isSolo = mode === 'local'
  const canControl = isHost || isSolo
  const minPlayers = isSolo ? 1 : 2
  const [launching, setLaunching] = useState(false)

  // Settings con persistenza in gameState (sincronizzati con i client).
  const savedCategory = gameState?.eqCategory ?? 'tutte'
  const savedRounds = gameState?.eqRounds ?? 7
  const [category, setCategory] = useState(savedCategory)
  const [rounds, setRounds] = useState(savedRounds)

  // Preload del pool quando entriamo in lobby → start instant.
  useEffect(() => { preloadEmojiQuizPool() }, [])

  // Sync settings in online (per i client che vedono le scelte dell'host).
  const syncSettings = useCallback((next) => {
    if (!canControl) return
    const s = useSession.getState()
    const newGameState = { ...s.gameState, ...next }
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

  const onCategoryChange = (id) => {
    setCategory(id)
    syncSettings({ eqCategory: id })
  }
  const onRoundsChange = (r) => {
    setRounds(r)
    syncSettings({ eqRounds: r })
  }

  const handleStart = useCallback(async () => {
    if (!canControl || launching) return
    setLaunching(true)
    try {
      const deck = await loadEmojiQuizDeck(rounds, category)
      const now = new Date().toISOString()
      const s = useSession.getState()
      const fullState = {
        players: (s.players || []).map((p) => ({ ...p, score: 0, correct_count: 0 })),
        currentIdx: 0,
        round: 0,
        activeGame: 'emojiquiz',
        selectedGame: 'emojiquiz',
        eqCategory: category,
        eqRounds: rounds,
        eqDeck: deck,
        eqRoundIdx: 0,
        eqRoundAnswers: {},
        eqHintUsed: {},
        eqRoundResult: null,
        eqScores: {},
        eqStreaks: {},
        eqCorrectCount: {},
        eqRoundLog: [],
      }
      if (s.mode === 'online' && s.roomCode) {
        const pushRes = await pushRoom(s.roomCode, 'emojiquiz_countdown', fullState, now)
        if (pushRes.error) {
          showError('generic')
          setLaunching(false)
          return
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
      console.error('[emojiquiz-lobby] start error:', e)
      showError('generic')
      setLaunching(false)
    }
  }, [canControl, launching, rounds, category, showError, navigate])

  const handleBack = useCallback(() => {
    const s = useSession.getState()
    if (s.mode !== 'online') {
      navigate('/solo/games', { replace: true })
      return
    }
    setAwaitingGC(true)
    navigate('/games', { replace: true })
    const fullState = {
      players: s.players,
      currentIdx: s.currentIdx,
      round: s.round,
      activeGame: null,
      selectedCategory: s.gameState?.selectedCategory ?? null,
      categoryVotes: s.gameState?.categoryVotes ?? {},
      gameVotes: {},
      selectedGame: null,
    }
    if (s.roomCode) pushRoom(s.roomCode, 'game_voting', fullState)
    setAwaitingGC(false)
  }, [navigate, setAwaitingGC])

  return (
    <div style={S.container}>
      <AppHeader
        accentColor={C.accent}
        leading={canControl && <IconButton ariaLabel="Indietro" onClick={handleBack}>←</IconButton>}
      />

      <div style={S.body}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center' }}
        >
          <GradientTitle as="h2" size="lg" gradient={C.gradient}>
            🎬 Emoji Quiz
          </GradientTitle>
          <p style={S.subtitle}>Decifra il titolo nascosto negli emoji</p>
        </motion.div>

        {/* Categoria */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={S.settingsCard}
        >
          <span style={S.settingLabel}>📂 Categoria</span>
          <div style={S.categoryGrid}>
            {EMOJI_QUIZ_CATEGORIES.map((cat) => {
              const active = cat.id === category
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => canControl && onCategoryChange(cat.id)}
                  disabled={!canControl}
                  style={{
                    ...S.categoryChip,
                    background: active ? cat.color : 'var(--bg)',
                    color: active ? '#fff' : 'var(--text)',
                    border: active ? `2px solid ${cat.color}` : '1.5px solid var(--border)',
                    cursor: canControl ? 'pointer' : 'default',
                    opacity: canControl ? 1 : 0.6,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Rounds */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={S.settingsCard}
        >
          <span style={S.settingLabel}>🎯 Numero round</span>
          <div style={S.roundsRow}>
            {ROUND_OPTIONS.map((r) => {
              const active = r === rounds
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => canControl && onRoundsChange(r)}
                  disabled={!canControl}
                  style={{
                    ...S.roundChip,
                    background: active ? C.accent : 'var(--bg)',
                    color: active ? '#fff' : 'var(--text)',
                    border: active ? `2px solid ${C.accent}` : '1.5px solid var(--border)',
                    cursor: canControl ? 'pointer' : 'default',
                    opacity: canControl ? 1 : 0.6,
                  }}
                >
                  {r}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Players */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={S.playersCard}
        >
          <span style={S.settingLabel}>👥 Giocatori ({players.length})</span>
          <div style={S.playersList}>
            {players.map((p, i) => (
              <div key={p.id} style={S.playerChip}>
                <MiniBlob color={p.color} expr={expr} size={28} id={`eql-${i}`} />
                <span style={S.playerName}>{p.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div style={S.footer}>
          {canControl ? (
            <Button
              variant="primary"
              width="full"
              onClick={handleStart}
              disabled={launching || players.length < minPlayers}
              style={accentBtnStyle(C.accent)}
            >
              {launching ? '⏳ Caricamento...' : (players.length < minPlayers ? `Servono almeno ${minPlayers} giocatori` : '🎬 Inizia!')}
            </Button>
          ) : (
            <p style={S.waitText}>Aspettando l'host... 👑</p>
          )}
        </div>
      </div>
    </div>
  )
}

const S = {
  container: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  body: {
    display: 'flex', flexDirection: 'column', flex: 1,
    padding: 'clamp(14px, 2.5dvh, 24px) clamp(16px, 4vw, 28px)',
    gap: 'clamp(12px, 2dvh, 18px)',
    overflow: 'auto',
  },
  subtitle: {
    margin: '6px 0 0',
    color: 'var(--muted)',
    fontSize: 'clamp(13px, 1.6dvh, 15px)',
    fontWeight: 600,
  },
  settingsCard: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'clamp(14px, 2dvh, 20px)',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  settingLabel: {
    fontSize: 'clamp(13px, 1.6dvh, 15px)',
    fontWeight: 800, color: 'var(--text)',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
    gap: 8,
  },
  categoryChip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'inherit',
    fontSize: 'clamp(11px, 1.3dvh, 13px)',
    fontWeight: 700,
    transition: 'all 0.15s',
    minHeight: 38,
  },
  roundsRow: { display: 'flex', gap: 8 },
  roundChip: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'inherit',
    fontSize: 'clamp(14px, 1.7dvh, 16px)',
    fontWeight: 800,
    transition: 'all 0.15s',
  },
  playersCard: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'clamp(14px, 2dvh, 20px)',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  playersList: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  playerChip: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 10px 4px 4px',
    background: 'var(--bg)', borderRadius: 999,
    border: '1px solid var(--border)',
  },
  playerName: {
    fontSize: 'clamp(12px, 1.4dvh, 14px)',
    fontWeight: 700, color: 'var(--text)',
  },
  footer: { marginTop: 'auto', flexShrink: 0 },
  waitText: {
    color: 'var(--muted)', fontSize: 'clamp(13px, 1.6dvh, 16px)',
    fontWeight: 600, textAlign: 'center',
    padding: 'clamp(10px, 1.5dvh, 16px) 0', margin: 0,
  },
}

export default EmojiQuizLobbyScreen

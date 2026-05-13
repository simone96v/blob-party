// Obbligo o Verità — multiplayer sync con UI drammatica.
// Hero card target con bg color del player, bottoni mode con icone grandi.

import { motion, AnimatePresence } from 'framer-motion'
import IconButton from '../../components/ui/IconButton'
import AppHeader from '../../components/AppHeader'
import PlayerStripCompact from '../../components/PlayerStripCompact'
import GameFinalScreen from '../../components/GameFinalScreen'
import { useSession } from '../../stores/useSession'
import { rpcUpdateGameState, rpcPlayerUpdate } from '../../lib/room'
import CARDS from '../../data/questions/truth-or-dare.json'

const REPLAY_PATCH = {
  td_targetIndex: -1,
  td_mode: null,
  td_card: '',
  td_phase: 'idle',
  td_usedTruth: [],
  td_usedDare: [],
}

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

const TruthOrDare = () => {
  const isHost = useSession((s) => s.isHost)
  const roomCode = useSession((s) => s.roomCode)
  const localPlayerId = useSession((s) => s.localPlayerId)
  const players = useSession((s) => s.players)
  const gameState = useSession((s) => s.gameState)

  const targetIndex = gameState?.td_targetIndex ?? -1
  const mode = gameState?.td_mode ?? null
  const card = gameState?.td_card ?? ''
  const phase = gameState?.td_phase ?? 'idle'
  const usedTruth = gameState?.td_usedTruth ?? []
  const usedDare = gameState?.td_usedDare ?? []

  const target = targetIndex >= 0 ? players[targetIndex] : null
  const isMyTurn = target && target.id === localPlayerId

  const handleDraw = async () => {
    if (!isHost || players.length === 0) return
    let next
    if (players.length === 1) next = 0
    else {
      do { next = Math.floor(Math.random() * players.length) }
      while (next === targetIndex)
    }
    await rpcUpdateGameState(roomCode, localPlayerId, {
      td_targetIndex: next,
      td_phase: 'choice',
      td_mode: null,
      td_card: '',
    })
  }

  const handleChooseMode = async (m) => {
    if (!isMyTurn) return
    const pool = m === 'truth' ? CARDS.truth : CARDS.dare
    const usedList = m === 'truth' ? usedTruth : usedDare
    const available = pool.filter((c) => !usedList.includes(c))
    const fromPool = available.length > 0 ? available : pool
    const picked = pickRandom(fromPool)
    const newUsedList = available.length > 0 ? [...usedList, picked] : [picked]
    const patch = { td_mode: m, td_card: picked, td_phase: 'card' }
    if (m === 'truth') patch.td_usedTruth = newUsedList
    else patch.td_usedDare = newUsedList
    await rpcPlayerUpdate(roomCode, localPlayerId, patch)
  }

  const handleNext = async () => {
    if (!isHost) return
    await rpcUpdateGameState(roomCode, localPlayerId, {
      td_phase: 'idle',
      td_mode: null,
      td_card: '',
    })
  }

  const handleEnd = async () => {
    if (!isHost) return
    await rpcUpdateGameState(roomCode, localPlayerId, { td_phase: 'final' })
  }

  return (
    <div style={S.container}>
      <AppHeader
        leading={isHost && (
          <IconButton ariaLabel="Esci" onClick={handleEnd}>←</IconButton>
        )}
      />

      <PlayerStripCompact players={players} highlightId={target?.id} />

      {phase === 'final' && (
        <GameFinalScreen
          emoji="💋"
          title="Bella partita!"
          subtitle="Ne facciamo un'altra o cambiamo gioco?"
          replayPatch={REPLAY_PATCH}
        />
      )}

      {phase !== 'final' && (
      <>
      <div style={S.body}>
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={S.idleWrap}>
              <motion.div
                animate={{ rotate: [0, -8, 8, -8, 8, 0], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                style={S.idleDice}
              >
                🎲
              </motion.div>
              <h2 style={S.idleTitle}>Chi sarà il prossimo?</h2>
              <p style={S.idleSub}>
                {isHost ? 'Estrai per scoprirlo' : "Aspettando che l'host estragga..."}
              </p>
            </motion.div>
          )}

          {phase === 'choice' && target && (
            <motion.div
              key={`choice-${targetIndex}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{
                ...S.heroCard,
                background: `linear-gradient(145deg, ${target.color}E6 0%, ${target.color} 60%, ${target.color}DC 100%)`,
              }}
            >
              {/* Spotlight orb */}
              <div style={S.heroOrb} />

              <p style={S.heroLabel}>TOCCA A</p>
              <motion.div
                initial={{ scale: 0.6, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                style={S.heroAvatar}
              >
                {target.name?.slice(0, 2).toUpperCase()}
              </motion.div>
              <h2 style={S.heroName}>{target.name}</h2>
              <p style={S.heroPrompt}>
                {isMyTurn ? '✋ Tocca a te! Cosa scegli?' : `${target.name} sta scegliendo...`}
              </p>
            </motion.div>
          )}

          {phase === 'card' && target && (
            <motion.div
              key={`card-${card}`}
              initial={{ opacity: 0, y: 30, rotateX: 20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              style={S.cardWrap}
            >
              <div style={{
                ...S.modeBadge,
                background: mode === 'truth'
                  ? 'linear-gradient(135deg, #06B6D4, #0891B2)'
                  : 'linear-gradient(135deg, #F97316, #EA580C)',
              }}>
                <span style={{ fontSize: 18 }}>{mode === 'truth' ? '🤫' : '🔥'}</span>
                <span>{mode === 'truth' ? 'VERITÀ' : 'OBBLIGO'}</span>
                <span style={S.modeBadgeDot}>·</span>
                <span style={{ opacity: 0.85 }}>{target.name}</span>
              </div>
              <p style={S.cardText}>{card}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={S.footer}>
        {phase === 'idle' && isHost && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleDraw} style={S.primaryBtn}>
            🎲 Estrai giocatore
          </motion.button>
        )}
        {phase === 'idle' && !isHost && (
          <p style={S.waiting}>👑 L'host estrae</p>
        )}
        {phase === 'choice' && isMyTurn && (
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => handleChooseMode('truth')}
              style={{ ...S.modeBtn, background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)' }}
            >
              <span style={{ fontSize: 22 }}>🤫</span>
              <span>Verità</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => handleChooseMode('dare')}
              style={{ ...S.modeBtn, background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
            >
              <span style={{ fontSize: 22 }}>🔥</span>
              <span>Obbligo</span>
            </motion.button>
          </div>
        )}
        {phase === 'choice' && !isMyTurn && (
          <p style={S.waiting}>⏳ {target?.name} sta scegliendo...</p>
        )}
        {phase === 'card' && isHost && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext} style={S.primaryBtn}>
            ✓ Fatto — prossimo giocatore
          </motion.button>
        )}
        {phase === 'card' && !isHost && (
          <p style={S.waiting}>👑 L'host passa al prossimo</p>
        )}
      </div>
      </>
      )}
    </div>
  )
}

const S = {
  container: { display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: 'clamp(10px, 1.5dvh, 16px) clamp(14px, 3vw, 20px)',
    flexShrink: 0, borderBottom: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)',
  },
  body: {
    flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
    padding: 'clamp(16px, 3dvh, 28px) clamp(16px, 4vw, 24px)',
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },

  // IDLE
  idleWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14,
  },
  idleDice: {
    fontSize: 'clamp(72px, 14vw, 110px)',
    filter: 'drop-shadow(0 8px 20px rgba(124, 58, 237, 0.30))',
  },
  idleTitle: {
    margin: 0,
    fontSize: 'clamp(22px, 3.2dvh, 30px)',
    fontWeight: 900,
    letterSpacing: '-0.025em',
    background: 'linear-gradient(120deg, #7C3AED 30%, #EC4899 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  idleSub: {
    margin: 0, color: 'var(--muted)',
    fontSize: 'clamp(13px, 1.7dvh, 15px)', fontWeight: 600,
  },

  // CHOICE (hero card)
  heroCard: {
    position: 'relative',
    width: '100%', maxWidth: 420,
    padding: 'clamp(24px, 4dvh, 36px) clamp(20px, 4vw, 28px)',
    borderRadius: 26,
    color: '#fff',
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 'clamp(8px, 1.4dvh, 12px)',
    boxShadow: '0 24px 56px rgba(31,41,55,0.30), inset 0 1px 0 rgba(255,255,255,0.3)',
    border: '1px solid rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    top: -40, right: -40,
    width: 180, height: 180,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.22)',
    filter: 'blur(30px)',
    pointerEvents: 'none',
  },
  heroLabel: {
    margin: 0,
    fontSize: 'clamp(11px, 1.4dvh, 13px)',
    fontWeight: 900,
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0.80)',
    textTransform: 'uppercase',
    background: 'rgba(0,0,0,0.18)',
    padding: '5px 14px',
    borderRadius: 999,
    backdropFilter: 'blur(4px)',
    zIndex: 1,
  },
  heroAvatar: {
    width: 'clamp(96px, 16dvh, 130px)', height: 'clamp(96px, 16dvh, 130px)',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.95)',
    color: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 'clamp(32px, 5dvh, 42px)',
    fontWeight: 900,
    boxShadow: '0 16px 36px rgba(0,0,0,0.25), inset 0 0 0 4px rgba(255,255,255,0.8)',
    zIndex: 1,
  },
  heroName: {
    margin: '4px 0 4px',
    fontSize: 'clamp(28px, 4.5dvh, 40px)',
    fontWeight: 900,
    letterSpacing: '-0.025em',
    color: '#fff',
    textShadow: '0 2px 12px rgba(0,0,0,0.25)',
    zIndex: 1,
  },
  heroPrompt: {
    margin: 0,
    fontSize: 'clamp(13px, 1.7dvh, 15px)',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.92)',
    zIndex: 1,
  },

  // CARD
  cardWrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: 'clamp(22px, 3.5dvh, 30px) clamp(22px, 4.5vw, 32px)',
    boxShadow: '0 16px 40px rgba(31,41,55,0.18)',
    width: '100%', maxWidth: 460,
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
  },
  modeBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    color: '#fff',
    fontWeight: 900,
    fontSize: 'clamp(12px, 1.5dvh, 14px)',
    letterSpacing: '0.06em',
    padding: '7px 16px',
    borderRadius: 999,
    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
  },
  modeBadgeDot: { opacity: 0.5 },
  cardText: {
    margin: 0,
    fontSize: 'clamp(18px, 2.6dvh, 24px)',
    fontWeight: 800,
    color: 'var(--text)',
    lineHeight: 1.35,
    letterSpacing: '-0.01em',
  },

  // BTNS
  primaryBtn: {
    width: '100%',
    height: 'clamp(50px, 7dvh, 60px)',
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 800,
    fontSize: 'clamp(15px, 2.1dvh, 18px)',
    letterSpacing: '0.02em',
    cursor: 'pointer',
    boxShadow: '0 8px 22px rgba(124, 58, 237, 0.35)',
  },
  modeBtn: {
    flex: 1,
    height: 'clamp(56px, 8dvh, 72px)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: '#fff',
    fontSize: 'clamp(15px, 2.1dvh, 18px)',
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(31, 41, 55, 0.22)',
    letterSpacing: '0.04em',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  footer: {
    flexShrink: 0,
    padding: 'clamp(12px, 1.8dvh, 18px) clamp(16px, 4vw, 24px)',
    display: 'flex', gap: 10, borderTop: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)',
  },
  waiting: {
    margin: 0, textAlign: 'center', color: 'var(--muted)',
    fontSize: 'clamp(13px, 1.6dvh, 15px)', fontWeight: 600, padding: '12px 0', width: '100%',
  },
}

export default TruthOrDare

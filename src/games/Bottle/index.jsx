// Bottiglia — multiplayer sync con grafica a torta.
// Settori colorati per ogni player, bottiglia rotante al centro, target evidenziato.
// Host gira; target sceglie verità/obbligo. Tap sulla bottiglia oltre al bottone.

import { useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import IconButton from '../../components/ui/IconButton'
import AppHeader from '../../components/AppHeader'
import GameFinalScreen from '../../components/GameFinalScreen'
import { useSession } from '../../stores/useSession'
import { rpcUpdateGameState, rpcPlayerUpdate } from '../../lib/room'
import CARDS from '../../data/questions/bottle.json'

const SPIN_DURATION_MS = 3200
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

const REPLAY_PATCH = {
  b_rotation: 0,
  b_targetIndex: -1,
  b_mode: null,
  b_card: null,
  b_phase: 'idle',
  b_spunCount: 0,
  b_usedTruth: [],
  b_usedDare: [],
}

const Bottle = () => {
  const isHost = useSession((s) => s.isHost)
  const roomCode = useSession((s) => s.roomCode)
  const localPlayerId = useSession((s) => s.localPlayerId)
  const players = useSession((s) => s.players)
  const gameState = useSession((s) => s.gameState)

  const rotation = gameState?.b_rotation ?? 0
  const targetIndex = gameState?.b_targetIndex ?? -1
  const mode = gameState?.b_mode ?? null
  const card = gameState?.b_card ?? null
  const phase = gameState?.b_phase ?? 'idle'
  const spunCount = gameState?.b_spunCount ?? 0
  const usedTruth = gameState?.b_usedTruth ?? []
  const usedDare = gameState?.b_usedDare ?? []

  const target = targetIndex >= 0 ? players[targetIndex] : null
  const isMyTurn = target && target.id === localPlayerId
  const N = players.length || 1
  const sliceDeg = 360 / N

  // -- Host actions --
  const handleSpin = async () => {
    if (!isHost || phase === 'spinning' || phase === 'choice' || phase === 'card' || players.length === 0) return
    let next
    if (players.length === 1) next = 0
    else {
      do { next = Math.floor(Math.random() * players.length) }
      while (next === targetIndex)
    }
    const fullSpins = 5 + Math.floor(Math.random() * 3)
    const sliceCenter = sliceDeg * next + sliceDeg / 2  // angolo del centro del settore (da top)
    // L'emoji 🍾 con transform rotate(45deg) ha il collo che punta a 12 ore (top).
    // Per puntare al settore i, ruotiamo di sliceCenter gradi clockwise.
    const jitter = (Math.random() - 0.5) * sliceDeg * 0.4
    const finalAngle = sliceCenter + jitter
    const currentMod = rotation % 360
    let delta = finalAngle - currentMod
    if (delta < 0) delta += 360
    const newRot = rotation + fullSpins * 360 + delta
    await rpcUpdateGameState(roomCode, localPlayerId, {
      b_rotation: newRot,
      b_targetIndex: next,
      b_phase: 'spinning',
      b_spunCount: spunCount + 1,
      b_mode: null,
      b_card: null,
    })
  }

  const completeRef = useRef(-1)
  const handleSpinComplete = async () => {
    if (!isHost) return
    if (completeRef.current === spunCount) return
    completeRef.current = spunCount
    if (phase === 'spinning') {
      await rpcUpdateGameState(roomCode, localPlayerId, { b_phase: 'choice' })
    }
  }

  useEffect(() => {
    if (!isHost || phase !== 'spinning') return
    const t = setTimeout(() => handleSpinComplete(), SPIN_DURATION_MS + 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, spunCount])

  // -- Player target actions --
  const handleChooseMode = async (m) => {
    if (!isMyTurn) return
    const pool = m === 'truth' ? CARDS.truth : CARDS.dare
    const usedList = m === 'truth' ? usedTruth : usedDare
    const available = pool.filter((c) => !usedList.includes(c))
    const fromPool = available.length > 0 ? available : pool
    const picked = pickRandom(fromPool)
    const newUsedList = available.length > 0 ? [...usedList, picked] : [picked]
    const patch = { b_mode: m, b_card: picked, b_phase: 'card' }
    if (m === 'truth') patch.b_usedTruth = newUsedList
    else patch.b_usedDare = newUsedList
    await rpcPlayerUpdate(roomCode, localPlayerId, patch)
  }

  const handleNext = async () => {
    if (!isHost) return
    await rpcUpdateGameState(roomCode, localPlayerId, {
      b_phase: 'idle',
      b_mode: null,
      b_card: null,
    })
  }

  const handleEnd = async () => {
    if (!isHost) return
    await rpcUpdateGameState(roomCode, localPlayerId, { b_phase: 'final' })
  }

  // -- Pie gradient con settori colorati dei players --
  const pieGradient = useMemo(() => {
    if (players.length === 0) return 'transparent'
    if (players.length === 1) return players[0].color
    const stops = players.map((p, i) => {
      const start = i * sliceDeg
      const end = (i + 1) * sliceDeg
      return `${p.color} ${start}deg ${end}deg`
    }).join(', ')
    // -sliceDeg/2 in modo che il primo settore sia centrato in cima (12 ore)
    return `conic-gradient(from -${sliceDeg / 2}deg, ${stops})`
  }, [players, sliceDeg])

  // -- Posizioni etichette nei settori (trig) --
  const labelPositions = useMemo(() => {
    return players.map((_, i) => {
      const centerAngle = (i + 0.5) * sliceDeg  // 0° = top
      const rad = (centerAngle - 90) * Math.PI / 180
      const r = 0.36 // distanza dal centro (36% del raggio)
      return {
        dx: Math.cos(rad) * r * 100,
        dy: Math.sin(rad) * r * 100,
        rotateDeg: centerAngle,
      }
    })
  }, [players, sliceDeg])

  return (
    <div style={S.container}>
      <AppHeader
        leading={isHost && (
          <IconButton ariaLabel="Esci" onClick={handleEnd}>←</IconButton>
        )}
        actions={
          <div style={S.counterBadge}>{spunCount > 0 ? `#${spunCount}` : '—'}</div>
        }
      />

      {phase === 'final' && (
        <GameFinalScreen
          emoji="🍾"
          title="Bella partita!"
          subtitle={`${spunCount} giri di bottiglia. Ne facciamo un'altra?`}
          replayPatch={REPLAY_PATCH}
        />
      )}

      {phase !== 'final' && (
        <>
          {/* Pie + bottle stage */}
          <div style={S.stage}>
            <div style={S.pieWrap}>
              {/* Glow ambient */}
              <div style={S.glow} />

              {/* Pie chart con settori colorati */}
              <div style={{ ...S.pie, background: pieGradient }}>
                {/* Divisori bianchi */}
                {players.length > 1 && players.map((_, i) => (
                  <div
                    key={`div-${i}`}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '50%',
                      height: 3,
                      background: 'rgba(255,255,255,0.95)',
                      transform: `translateY(-50%) rotate(${i * sliceDeg - sliceDeg / 2}deg)`,
                      transformOrigin: '0 50%',
                      pointerEvents: 'none',
                      borderRadius: 2,
                    }}
                  />
                ))}

                {/* Labels player */}
                {players.map((p, i) => {
                  const pos = labelPositions[i]
                  const isTarget = targetIndex === i && (phase === 'choice' || phase === 'card')
                  return (
                    <motion.div
                      key={p.id}
                      animate={isTarget ? { scale: [1, 1.18, 1.08] } : { scale: 1 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${pos.dx}%)`,
                        top: `calc(50% + ${pos.dy}%)`,
                        transform: `translate(-50%, -50%) rotate(${pos.rotateDeg}deg)`,
                        pointerEvents: 'none',
                        zIndex: 2,
                        width: 'clamp(54px, 8vw, 70px)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{
                        width: 'clamp(32px, 5vw, 40px)',
                        height: 'clamp(32px, 5vw, 40px)',
                        borderRadius: '50%',
                        background: '#fff',
                        color: p.color,
                        margin: '0 auto 3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(12px, 1.6vw, 14px)',
                        fontWeight: 900,
                        boxShadow: isTarget
                          ? '0 0 0 4px #fff, 0 0 0 7px var(--accent), 0 6px 18px rgba(124,58,237,0.4)'
                          : '0 2px 6px rgba(0,0,0,0.20), inset 0 0 0 2px rgba(255,255,255,0.85)',
                      }}>
                        {p.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{
                        fontSize: 'clamp(10px, 1.2vw, 12px)',
                        fontWeight: 800,
                        color: '#fff',
                        textShadow: '0 1px 3px rgba(0,0,0,0.50)',
                        letterSpacing: '-0.005em',
                        lineHeight: 1.1,
                      }}>
                        {p.name?.slice(0, 8)}
                      </div>
                    </motion.div>
                  )
                })}

                {/* Bottle al centro */}
                <motion.div
                  animate={{ rotate: rotation }}
                  transition={{ duration: SPIN_DURATION_MS / 1000, ease: [0.16, 1, 0.3, 1] }}
                  onAnimationComplete={handleSpinComplete}
                  onClick={isHost && phase === 'idle' ? handleSpin : undefined}
                  whileTap={isHost && phase === 'idle' ? { scale: 0.92 } : undefined}
                  style={{
                    ...S.bottle,
                    cursor: isHost && phase === 'idle' ? 'pointer' : 'default',
                  }}
                >
                  <div style={S.bottleEmoji}>🍾</div>
                </motion.div>

                {/* Center hub (sotto bottiglia) */}
                <div style={S.hub}>
                  <div style={S.hubInner} />
                </div>
              </div>
            </div>

            {/* Status info sotto la torta */}
            <div style={S.statusArea}>
              <AnimatePresence mode="wait">
                {phase === 'idle' && (
                  <motion.p
                    key="idle"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={S.statusText}
                  >
                    {isHost ? '👇 Pronto? Tocca la bottiglia o il bottone' : "Aspettando che l'host giri..."}
                  </motion.p>
                )}
                {phase === 'spinning' && (
                  <motion.p key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={S.statusText}>
                    🌀 La bottiglia gira...
                  </motion.p>
                )}
                {phase === 'choice' && target && (
                  <motion.div
                    key="choice"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={S.choiceWrap}
                  >
                    <div style={S.choiceLabel}>BOTTIGLIA PUNTA A</div>
                    <div style={{ ...S.choiceName, color: target.color }}>{target.name}</div>
                    <div style={S.choicePrompt}>
                      {isMyTurn ? '✋ Tocca a te! Scegli sotto.' : `${target.name} sta scegliendo...`}
                    </div>
                  </motion.div>
                )}
                {phase === 'card' && target && (
                  <motion.div
                    key="card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={S.cardBox}
                  >
                    <div style={{
                      ...S.modeBadge,
                      background: mode === 'truth'
                        ? 'linear-gradient(135deg, #06B6D4, #0891B2)'
                        : 'linear-gradient(135deg, #F97316, #EA580C)',
                    }}>
                      <span style={{ fontSize: 16 }}>{mode === 'truth' ? '🤫' : '🔥'}</span>
                      <span>{mode === 'truth' ? 'VERITÀ' : 'OBBLIGO'}</span>
                      <span style={{ opacity: 0.5 }}>·</span>
                      <span style={{ opacity: 0.85 }}>{target.name}</span>
                    </div>
                    <p style={S.cardText}>{card}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div style={S.footer}>
            {phase === 'idle' && isHost && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSpin} style={S.primaryBtn}>
                🌀 Gira la bottiglia
              </motion.button>
            )}
            {phase === 'idle' && !isHost && (
              <p style={S.waiting}>👑 L'host gira la bottiglia</p>
            )}
            {phase === 'spinning' && (
              <button disabled style={{ ...S.primaryBtn, opacity: 0.5, cursor: 'wait' }}>...</button>
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
                ✓ Fatto — gira di nuovo
              </motion.button>
            )}
            {phase === 'card' && !isHost && (
              <p style={S.waiting}>👑 L'host gira di nuovo</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const S = {
  container: {
    display: 'flex', flexDirection: 'column',
    flex: 1, height: '100%', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: 'clamp(10px, 1.5dvh, 16px) clamp(14px, 3vw, 20px)',
    flexShrink: 0, borderBottom: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)',
  },
  counterBadge: {
    background: 'var(--bg2)', color: 'var(--accent)',
    fontWeight: 800, fontSize: 'clamp(11px, 1.4dvh, 13px)',
    padding: '5px 12px', borderRadius: 999,
    border: '1.5px solid rgba(124,58,237,0.18)',
    letterSpacing: '0.05em', minWidth: 40, textAlign: 'center',
  },
  stage: {
    flex: 1, minHeight: 0,
    display: 'flex', flexDirection: 'column',
    padding: 'clamp(12px, 2dvh, 20px) clamp(14px, 3vw, 22px)',
    gap: 'clamp(10px, 1.8dvh, 16px)', overflow: 'hidden',
  },
  pieWrap: {
    position: 'relative',
    width: '100%', aspectRatio: '1 / 1',
    maxWidth: 'min(82vw, 52dvh)',
    margin: '0 auto', flexShrink: 0,
  },
  glow: {
    position: 'absolute', inset: -28, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.20) 0%, rgba(236,72,153,0.10) 40%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  pie: {
    position: 'relative', width: '100%', height: '100%',
    borderRadius: '50%', border: '8px solid #fff',
    boxShadow: '0 18px 50px rgba(31, 41, 55, 0.22), inset 0 0 0 3px rgba(0,0,0,0.05)',
    zIndex: 1, overflow: 'visible',
  },
  bottle: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transformOrigin: 'center', zIndex: 4,
  },
  bottleEmoji: {
    fontSize: 'clamp(64px, 12vw, 96px)',
    // L'emoji 🍾 ha il collo orientato verso alto-destra: con rotate(-45deg) lo
    // porto a 12 ore (top). Sommato alla rotation totale, il collo punta al settore target.
    transform: 'rotate(-45deg)',
    filter: 'drop-shadow(0 6px 18px rgba(31,41,55,0.32))',
    lineHeight: 1,
  },
  hub: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'clamp(38px, 5.5vw, 50px)',
    height: 'clamp(38px, 5.5vw, 50px)',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #fff 0%, #F4F0FF 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(31,41,55,0.20), inset 0 0 0 2px rgba(255,255,255,0.85)',
    zIndex: 3,
  },
  hubInner: {
    width: '60%', height: '60%', borderRadius: '50%',
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)',
  },
  statusArea: {
    flex: 1, minHeight: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '4px 0', overflow: 'auto',
  },
  statusText: {
    margin: 0, color: 'var(--muted)',
    fontSize: 'clamp(13px, 1.7dvh, 16px)', fontWeight: 700,
    textAlign: 'center',
  },
  choiceWrap: {
    textAlign: 'center', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: 4,
  },
  choiceLabel: {
    fontSize: 'clamp(10px, 1.3dvh, 12px)', fontWeight: 800,
    letterSpacing: '0.15em', color: 'var(--muted)', textTransform: 'uppercase',
  },
  choiceName: {
    fontSize: 'clamp(24px, 4dvh, 34px)', fontWeight: 900,
    letterSpacing: '-0.02em', margin: 0,
  },
  choicePrompt: {
    fontSize: 'clamp(13px, 1.7dvh, 15px)', fontWeight: 700,
    color: 'var(--text)', margin: 0,
  },
  cardBox: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: 'clamp(14px, 2.4dvh, 20px) clamp(16px, 4vw, 22px)',
    boxShadow: 'var(--shadow-md)', width: '100%', maxWidth: 460,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  },
  modeBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    color: '#fff', fontWeight: 900,
    fontSize: 'clamp(11px, 1.4dvh, 13px)', letterSpacing: '0.05em',
    padding: '6px 14px', borderRadius: 999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  cardText: {
    margin: 0, fontSize: 'clamp(16px, 2.3dvh, 20px)',
    fontWeight: 700, color: 'var(--text)',
    lineHeight: 1.35, textAlign: 'center',
  },
  footer: {
    flexShrink: 0, padding: 'clamp(12px, 1.8dvh, 18px) clamp(16px, 4vw, 24px)',
    display: 'flex', gap: 10, borderTop: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)',
  },
  primaryBtn: {
    width: '100%', height: 'clamp(50px, 7dvh, 60px)',
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
    fontWeight: 800, fontSize: 'clamp(15px, 2.1dvh, 18px)',
    letterSpacing: '0.02em', cursor: 'pointer',
    boxShadow: '0 8px 22px rgba(124, 58, 237, 0.35)',
  },
  modeBtn: {
    flex: 1, height: 'clamp(56px, 8dvh, 72px)',
    border: 'none', borderRadius: 'var(--radius-sm)',
    color: '#fff', fontSize: 'clamp(15px, 2.1dvh, 18px)', fontWeight: 900,
    cursor: 'pointer', boxShadow: '0 10px 24px rgba(31, 41, 55, 0.22)',
    letterSpacing: '0.04em',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  waiting: {
    margin: 0, textAlign: 'center', color: 'var(--muted)',
    fontSize: 'clamp(13px, 1.6dvh, 15px)', fontWeight: 600,
    padding: '12px 0', width: '100%',
  },
}

export default Bottle

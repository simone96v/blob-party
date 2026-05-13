// Spin the Wheel — multiplayer sync con UI ricca.
// Pointer SVG drop-shadow, hub centrale, divisori bianchi, result card con burst.

import { useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../../components/ui/Button'
import IconButton from '../../components/ui/IconButton'
import AppHeader from '../../components/AppHeader'
import PlayerStripCompact from '../../components/PlayerStripCompact'
import GameFinalScreen from '../../components/GameFinalScreen'
import { useSession } from '../../stores/useSession'
import { rpcUpdateGameState } from '../../lib/room'
import WHEEL from '../../data/questions/spinwheel.json'
import { haptic } from '../../utils/haptic'

const SPIN_DURATION_MS = 3200

const REPLAY_PATCH = {
  sw_rotation: 0,
  sw_targetIndex: -1,
  sw_phase: 'idle',
  sw_spunCount: 0,
}

const SpinTheWheel = () => {
  const isHost = useSession((s) => s.isHost)
  const roomCode = useSession((s) => s.roomCode)
  const localPlayerId = useSession((s) => s.localPlayerId)
  const players = useSession((s) => s.players)
  const gameState = useSession((s) => s.gameState)

  const wedges = WHEEL.wedges
  const N = wedges.length
  const sliceDeg = 360 / N

  const rotation = gameState?.sw_rotation ?? 0
  const targetIndex = gameState?.sw_targetIndex ?? -1
  const phase = gameState?.sw_phase ?? 'idle'
  const spunCount = gameState?.sw_spunCount ?? 0

  const handleEnd = async () => {
    if (!isHost) return
    await rpcUpdateGameState(roomCode, localPlayerId, { sw_phase: 'final' })
  }

  const completeRef = useRef(-1)
  const handleSpinComplete = async () => {
    if (spunCount > 0) haptic.land()
    if (!isHost) return
    if (completeRef.current === spunCount) return
    completeRef.current = spunCount
    await rpcUpdateGameState(roomCode, localPlayerId, { sw_phase: 'result' })
  }

  useEffect(() => {
    if (!isHost || phase !== 'spinning') return
    const t = setTimeout(() => handleSpinComplete(), SPIN_DURATION_MS + 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, spunCount])

  const handleSpin = async () => {
    if (!isHost) return
    if (phase === 'spinning') return
    haptic.medium()
    const target = Math.floor(Math.random() * N)
    const fullSpins = 5 + Math.floor(Math.random() * 3)
    const sliceCenter = (target + 0.5) * sliceDeg
    const jitter = (Math.random() - 0.5) * sliceDeg * 0.45
    const finalRotMod = (360 - sliceCenter + jitter + 720) % 360
    const currentMod = rotation % 360
    let delta = finalRotMod - currentMod
    if (delta < 0) delta += 360
    const newRot = rotation + fullSpins * 360 + delta
    await rpcUpdateGameState(roomCode, localPlayerId, {
      sw_rotation: newRot,
      sw_targetIndex: target,
      sw_phase: 'spinning',
      sw_spunCount: spunCount + 1,
    })
  }

  // Conic gradient + divisori bianchi tra settori (via repeating-conic-gradient)
  const wheelBackground = useMemo(() => {
    const stops = wedges.map((w, i) => {
      const start = i * sliceDeg
      const end = (i + 1) * sliceDeg
      return `${w.color} ${start}deg ${end}deg`
    }).join(', ')
    return `conic-gradient(from -${sliceDeg / 2}deg, ${stops})`
  }, [wedges, sliceDeg])

  const winner = targetIndex >= 0 ? wedges[targetIndex] : null

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

      <PlayerStripCompact players={players} />

      {phase === 'final' && (
        <GameFinalScreen
          emoji="🎡"
          title="Bella ruota!"
          subtitle={`${spunCount} giri fatti. Vogliamo continuare o cambiare gioco?`}
          replayPatch={REPLAY_PATCH}
        />
      )}

      {phase !== 'final' && (
      <div style={S.body}>
        <div style={S.wheelStage}>
          {/* Glow ambient dietro la ruota */}
          <div style={S.glow} />

          {/* Pointer SVG */}
          <div style={S.pointerWrap}>
            <svg width="44" height="56" viewBox="0 0 44 56" style={S.pointerSvg}>
              <defs>
                <linearGradient id="ptr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
              <path d="M22 56 L4 6 Q22 0 40 6 Z" fill="url(#ptr)" stroke="#fff" strokeWidth="2.5" />
              <circle cx="22" cy="14" r="4" fill="#fff" />
            </svg>
          </div>

          {/* Ruota */}
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: SPIN_DURATION_MS / 1000, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={handleSpinComplete}
            style={{ ...S.wheel, background: wheelBackground }}
          >
            {/* Divisori bianchi tra settori */}
            {wedges.map((_, i) => (
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

            {/* Labels emoji + testo — posizionati radialmente via trigonometria */}
            {wedges.map((w, i) => {
              const centerAngle = (i + 0.5) * sliceDeg // 0° = top (12 ore)
              const rad = (centerAngle - 90) * Math.PI / 180
              const r = 0.34 // distanza dal centro (34% del raggio)
              const dx = Math.cos(rad) * r * 100
              const dy = Math.sin(rad) * r * 100
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${dx}%)`,
                    top: `calc(50% + ${dy}%)`,
                    transform: `translate(-50%, -50%) rotate(${centerAngle}deg)`,
                    textAlign: 'center',
                    pointerEvents: 'none',
                    width: 78,
                    color: '#fff',
                    textShadow: '0 1px 3px rgba(0,0,0,0.50)',
                    zIndex: 2,
                  }}
                >
                  <div style={{ fontSize: 'clamp(18px, 2.4vw, 24px)', lineHeight: 1, marginBottom: 3 }}>{w.emoji}</div>
                  <div style={{
                    fontSize: 'clamp(9px, 1.1vw, 11px)',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    letterSpacing: '-0.005em',
                  }}>
                    {w.label}
                  </div>
                </div>
              )
            })}

            {/* Center hub */}
            <div style={S.hub}>
              <div style={S.hubInner}>
                <span style={{ fontSize: 24 }}>🎯</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Result */}
        <div style={S.resultArea}>
          <AnimatePresence mode="wait">
            {phase === 'result' && winner && (
              <motion.div
                key={`r-${spunCount}`}
                initial={{ opacity: 0, y: 20, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                style={S.resultCard}
              >
                {/* Bordo color winner */}
                <div style={{
                  ...S.resultStripe,
                  background: winner.color,
                }} />
                <div style={{
                  fontSize: 'clamp(36px, 5.5vw, 48px)',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))',
                }}>{winner.emoji}</div>
                <div style={S.resultLabel}>{winner.label}</div>
              </motion.div>
            )}
            {phase === 'spinning' && (
              <motion.div
                key="spinning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={S.spinningCard}
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ display: 'inline-block', fontSize: 24 }}
                >
                  🌀
                </motion.span>
                <span>Sta girando...</span>
              </motion.div>
            )}
            {phase === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={S.idleCard}>
                {isHost ? '👇 Pronto? Gira la ruota' : "👑 L'host gira la ruota"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      )}

      {phase !== 'final' && (
      <div style={S.footer}>
        {isHost ? (
          <Button variant="primary" width="full" onClick={handleSpin} disabled={phase === 'spinning'}>
            {phase === 'spinning' ? '...' : phase === 'result' ? '🔄 Gira ancora' : '🎡 Gira la ruota'}
          </Button>
        ) : (
          <p style={S.waiting}>👑 L'host gira la ruota</p>
        )}
      </div>
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
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(8px)',
  },
  counterBadge: {
    background: 'var(--bg2)',
    color: 'var(--accent)',
    fontWeight: 800,
    fontSize: 'clamp(11px, 1.4dvh, 13px)',
    padding: '5px 12px',
    borderRadius: 999,
    border: '1.5px solid rgba(124,58,237,0.18)',
    letterSpacing: '0.05em',
    minWidth: 40,
    textAlign: 'center',
  },
  body: {
    flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
    padding: 'clamp(12px, 2dvh, 22px) clamp(14px, 3vw, 22px)',
    gap: 'clamp(10px, 1.6dvh, 16px)', overflow: 'hidden',
  },
  wheelStage: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1 / 1',
    maxWidth: 'min(82vw, 50dvh)',
    margin: '0 auto',
    flexShrink: 0,
  },
  glow: {
    position: 'absolute',
    inset: -30,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(236,72,153,0.08) 40%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  pointerWrap: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 5,
    pointerEvents: 'none',
  },
  pointerSvg: {
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.30))',
  },
  wheel: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '8px solid #fff',
    boxShadow: '0 16px 48px rgba(31, 41, 55, 0.22), inset 0 0 0 3px rgba(0,0,0,0.05)',
    zIndex: 1,
  },
  label: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transformOrigin: '0 0',
    pointerEvents: 'none',
    zIndex: 2,
  },
  hub: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'clamp(58px, 8.5vw, 76px)',
    height: 'clamp(58px, 8.5vw, 76px)',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #fff 0%, #F4F0FF 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 18px rgba(31,41,55,0.25), inset 0 0 0 3px rgba(255,255,255,0.85)',
    zIndex: 3,
  },
  hubInner: {
    width: '78%',
    height: '78%',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)',
  },
  resultArea: {
    flex: 1, minHeight: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0',
  },
  resultCard: {
    position: 'relative',
    width: '100%', maxWidth: 460,
    padding: 'clamp(18px, 2.5dvh, 24px) clamp(18px, 3.5vw, 28px)',
    borderRadius: 'var(--radius)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    boxShadow: '0 16px 40px rgba(31,41,55,0.18)',
    overflow: 'hidden',
  },
  resultStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: '100%',
  },
  resultLabel: {
    fontSize: 'clamp(19px, 2.8dvh, 26px)',
    fontWeight: 900,
    color: 'var(--text)',
    letterSpacing: '-0.01em',
    textAlign: 'left',
    flex: 1,
  },
  spinningCard: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    color: 'var(--muted)',
    fontWeight: 700,
    fontSize: 'clamp(14px, 1.8dvh, 17px)',
    background: 'var(--surface)',
    padding: '12px 22px',
    borderRadius: 999,
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
  },
  idleCard: {
    color: 'var(--muted)',
    fontWeight: 700,
    fontSize: 'clamp(14px, 1.8dvh, 16px)',
    textAlign: 'center',
  },
  footer: {
    flexShrink: 0,
    padding: 'clamp(12px, 1.8dvh, 18px) clamp(16px, 4vw, 24px)',
    borderTop: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(8px)',
  },
  waiting: {
    margin: 0, textAlign: 'center', color: 'var(--muted)',
    fontSize: 'clamp(13px, 1.6dvh, 15px)', fontWeight: 600, padding: '12px 0',
  },
}

export default SpinTheWheel

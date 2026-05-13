// HomeScreen — hero + CTA "Crea party" / "Ho già un codice" + blob che sbucano.

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import GradientTitle from '../components/ui/GradientTitle'
import OptionCard from '../components/ui/OptionCard'
import Spinner from '../components/ui/Spinner'
import ErrorBanner from '../components/ErrorBanner'
import { useSession } from '../stores/useSession'
import { createRoom } from '../lib/room'

const OPTIONS = [
  {
    id: 'create',
    emoji: '🎉',
    title: 'Crea party',
    description: 'Apri un nuovo party e invita i tuoi amici.',
    bg: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 60%, #EC4899 100%)',
    shadow: 'rgba(124, 58, 237, 0.40)',
  },
  {
    id: 'join',
    emoji: '🔑',
    title: 'Ho già un codice',
    description: 'Entra in un party già creato da un amico.',
    bg: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
    shadow: 'rgba(249, 115, 22, 0.35)',
  },
]

const STATS = [
  { emoji: '🎮', label: 'Mini-giochi' },
  { emoji: '👥', label: '2-8 giocatori' },
  { emoji: '⚡', label: 'Senza account' },
]

const StatPill = ({ emoji, label, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 999,
      background: 'rgba(255,255,255,0.65)',
      backdropFilter: 'blur(6px)',
      border: '1px solid var(--border)',
      fontSize: 'clamp(11px, 1.4dvh, 13px)',
      fontWeight: 700,
      color: 'var(--text)',
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{ fontSize: 14 }}>{emoji}</span>
    <span>{label}</span>
  </motion.div>
)

// Sequenza espressioni — top e bottom sfasati.
const EXPR_SEQUENCE = [
  { top: 'normal',     bottom: 'normal',     dur: 2500 },
  { top: 'blink',      bottom: 'normal',     dur: 150 },
  { top: 'normal',     bottom: 'normal',     dur: 3000 },
  { top: 'normal',     bottom: 'blink',      dur: 150 },
  { top: 'normal',     bottom: 'normal',     dur: 2000 },
  { top: 'look-right', bottom: 'look-left',  dur: 2000 },
  { top: 'blink',      bottom: 'blink',      dur: 150 },
  { top: 'happy',      bottom: 'normal',     dur: 2500 },
  { top: 'normal',     bottom: 'happy',      dur: 2500 },
  { top: 'blink',      bottom: 'normal',     dur: 150 },
  { top: 'normal',     bottom: 'normal',     dur: 2000 },
  { top: 'look-left',  bottom: 'look-right', dur: 2000 },
  { top: 'normal',     bottom: 'blink',      dur: 150 },
  { top: 'normal',     bottom: 'normal',     dur: 3000 },
  { top: 'blink',      bottom: 'blink',      dur: 150 },
]

const useExpressions = () => {
  const [topExpr, setTopExpr] = useState('normal')
  const [bottomExpr, setBottomExpr] = useState('normal')
  const idxRef = useRef(0)

  useEffect(() => {
    let timer
    const step = () => {
      const s = EXPR_SEQUENCE[idxRef.current]
      setTopExpr(s.top)
      setBottomExpr(s.bottom)
      idxRef.current = (idxRef.current + 1) % EXPR_SEQUENCE.length
      timer = setTimeout(step, s.dur)
    }
    step()
    return () => clearTimeout(timer)
  }, [])

  return { topExpr, bottomExpr }
}

// Occhi SVG con espressioni — posizioni relative al centro (lx, rx, ey).
const BlobEyes = ({ expr, lx, rx, ey, prefix }) => {
  const pupilDx = expr === 'look-left' ? -4 : expr === 'look-right' ? 4 : 0

  if (expr === 'blink') {
    return (
      <>
        <ellipse cx={lx} cy={ey} rx="14" ry="2.5" fill="#fff" opacity="0.9" />
        <ellipse cx={rx} cy={ey} rx="14" ry="2.5" fill="#fff" opacity="0.9" />
      </>
    )
  }

  if (expr === 'happy') {
    return (
      <>
        <path d={`M${lx - 14} ${ey + 2} Q${lx} ${ey - 14}, ${lx + 14} ${ey + 2}`}
          fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
        <path d={`M${rx - 14} ${ey + 2} Q${rx} ${ey - 14}, ${rx + 14} ${ey + 2}`}
          fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      </>
    )
  }

  return (
    <>
      <ellipse cx={lx} cy={ey} rx="16" ry="17" fill={`url(#${prefix}-eye-l)`} />
      <circle cx={lx + 2 + pupilDx} cy={ey + 3} r="7.5" fill="#6D28D9" />
      <circle cx={lx + 4 + pupilDx} cy={ey + 1} r="3" fill="#1E1B4B" />
      <circle cx={lx + 6 + pupilDx} cy={ey - 2} r="1.8" fill="rgba(255,255,255,0.9)" />
      <ellipse cx={rx} cy={ey} rx="16" ry="17" fill={`url(#${prefix}-eye-r)`} />
      <circle cx={rx + 2 + pupilDx} cy={ey + 3} r="7.5" fill="#6D28D9" />
      <circle cx={rx + 4 + pupilDx} cy={ey + 1} r="3" fill="#1E1B4B" />
      <circle cx={rx + 6 + pupilDx} cy={ey - 2} r="1.8" fill="rgba(255,255,255,0.9)" />
    </>
  )
}

const blobDefs = (prefix) => (
  <defs>
    <linearGradient id={`${prefix}-grad`} x1="0%" y1="0%" x2="100%" y2="80%">
      <stop offset="0%" stopColor="#C4B5FD" />
      <stop offset="30%" stopColor="#A78BFA" />
      <stop offset="60%" stopColor="#7C3AED" />
      <stop offset="100%" stopColor="#DB2777" />
    </linearGradient>
    <radialGradient id={`${prefix}-hl1`} cx="30%" cy="25%" r="35%">
      <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
    </radialGradient>
    <radialGradient id={`${prefix}-hl2`} cx="65%" cy="35%" r="20%">
      <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
    </radialGradient>
    <radialGradient id={`${prefix}-shd`} cx="50%" cy="20%" r="50%">
      <stop offset="0%" stopColor="rgba(91,33,182,0.25)" />
      <stop offset="100%" stopColor="rgba(91,33,182,0)" />
    </radialGradient>
    <radialGradient id={`${prefix}-eye-l`} cx="40%" cy="35%" r="50%">
      <stop offset="0%" stopColor="#fff" />
      <stop offset="100%" stopColor="#E9E5F5" />
    </radialGradient>
    <radialGradient id={`${prefix}-eye-r`} cx="40%" cy="35%" r="50%">
      <stop offset="0%" stopColor="#fff" />
      <stop offset="100%" stopColor="#E9E5F5" />
    </radialGradient>
  </defs>
)

const BottomBlob = ({ expr }) => (
  <div style={{
    position: 'fixed',
    bottom: 'clamp(-80px, -12dvh, -50px)',
    left: 0, right: 0,
    zIndex: 0,
    pointerEvents: 'none',
    lineHeight: 0,
    display: 'flex',
    justifyContent: 'center',
  }}>
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMax meet"
      style={{
        width: '110%', maxWidth: 650, height: 'auto',
        filter: 'drop-shadow(0 -8px 30px rgba(124, 58, 237, 0.3))',
      }}
      aria-hidden="true"
    >
      {blobDefs('bb')}
      <ellipse cx="200" cy="160" rx="210" ry="150" fill="url(#bb-grad)" />
      <ellipse cx="200" cy="160" rx="210" ry="150" fill="url(#bb-shd)" />
      <ellipse cx="145" cy="75" rx="70" ry="35" fill="url(#bb-hl1)" />
      <ellipse cx="270" cy="85" rx="40" ry="22" fill="url(#bb-hl2)" />
      <BlobEyes expr={expr} lx={160} rx={240} ey={100} prefix="bb" />
    </svg>
  </div>
)

const TopBlob = ({ expr }) => (
  <div style={{
    position: 'fixed',
    top: 'clamp(-80px, -12dvh, -50px)',
    left: 0, right: 0,
    zIndex: 0,
    pointerEvents: 'none',
    lineHeight: 0,
    display: 'flex',
    justifyContent: 'center',
  }}>
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMin meet"
      style={{
        width: '110%', maxWidth: 650, height: 'auto',
        filter: 'drop-shadow(0 8px 30px rgba(124, 58, 237, 0.3))',
      }}
      aria-hidden="true"
    >
      {blobDefs('tb')}
      <ellipse cx="200" cy="40" rx="210" ry="150" fill="url(#tb-grad)" />
      <ellipse cx="200" cy="40" rx="210" ry="150" fill="url(#tb-shd)" />
      <ellipse cx="255" cy="115" rx="70" ry="35" fill="url(#tb-hl1)" />
      <ellipse cx="130" cy="105" rx="40" ry="22" fill="url(#tb-hl2)" />
      <BlobEyes expr={expr} lx={160} rx={240} ey={100} prefix="tb" />
    </svg>
  </div>
)

const HomeScreen = () => {
  const navigate = useNavigate()
  const resetSession = useSession((s) => s.resetSession)
  const setOnlineMode = useSession((s) => s.setOnlineMode)
  const showError = useSession((s) => s.showError)
  const [creating, setCreating] = useState(false)
  const { topExpr, bottomExpr } = useExpressions()

  const handlePick = async (id) => {
    if (creating) return
    if (id === 'join') {
      navigate('/join')
      return
    }
    setCreating(true)
    resetSession()
    const { code, error } = await createRoom({
      players: [],
      categoryVotes: {},
      gameVotes: {},
      selectedGame: null,
    })
    if (error || !code) {
      showError('generic')
      setCreating(false)
      return
    }
    setOnlineMode(code, true, null)
    setCreating(false)
    navigate('/lobby')
  }

  return (
    <motion.div
      className="screen screen-narrow"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <ErrorBanner />

      <div
        className="screen-body"
        style={{
          justifyContent: 'center',
          paddingTop: 'clamp(16px, 3dvh, 28px)',
          paddingBottom: 'clamp(16px, 3dvh, 28px)',
          gap: 'clamp(20px, 3.5dvh, 36px)',
        }}
      >
        {/* HERO — solo testo, niente blob */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ textAlign: 'center' }}
        >
          <GradientTitle as="h1" size="xl">
            Blob Party
          </GradientTitle>
          <p
            style={{
              margin: '6px 0 0',
              color: 'var(--muted)',
              fontSize: 'clamp(13px, 1.7dvh, 15px)',
              fontWeight: 500,
            }}
          >
            Mini-giochi per le serate con i tuoi
          </p>

          {/* Stats pills */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: 'clamp(10px, 1.6dvh, 16px)',
            }}
          >
            {STATS.map((s, i) => (
              <StatPill key={s.label} emoji={s.emoji} label={s.label} delay={0.15 + i * 0.05} />
            ))}
          </div>
        </motion.div>

        {/* CTA cards */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(10px, 1.5dvh, 14px)',
          }}
        >
          {OPTIONS.map((opt, i) => (
            <OptionCard
              key={opt.id}
              option={opt}
              index={i}
              onClick={() => handlePick(opt.id)}
              disabled={creating && opt.id === 'create'}
              badge={creating && opt.id === 'create' ? <Spinner size="sm" /> : null}
            />
          ))}
        </div>

      </div>

      <TopBlob expr={topExpr} />
      <BottomBlob expr={bottomExpr} />
    </motion.div>
  )
}

export default HomeScreen

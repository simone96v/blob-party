// HomeScreen — hero animato + CTA "Crea party" / "Ho già un codice" + anteprima giochi.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import GradientTitle from '../components/ui/GradientTitle'
import OptionCard from '../components/ui/OptionCard'
import Spinner from '../components/ui/Spinner'
import ErrorBanner from '../components/ErrorBanner'
import { useSession } from '../stores/useSession'
import { createRoom } from '../lib/room'
import { GAMES } from '../data/games'

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

const PLAYABLE_GAMES = GAMES.filter((g) => !g.locked)

const HeroBlob = () => (
  <motion.div
    animate={{ y: [0, -8, 0], rotate: [0, 2, 0, -2, 0] }}
    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    style={{ display: 'inline-block', lineHeight: 0 }}
  >
    <svg
      width="clamp(72px, 12dvh, 104px)"
      height="clamp(72px, 12dvh, 104px)"
      viewBox="0 0 100 100"
      style={{
        width: 'clamp(72px, 12dvh, 104px)',
        height: 'clamp(72px, 12dvh, 104px)',
        filter: 'drop-shadow(0 12px 28px rgba(124, 58, 237, 0.45))',
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="home-blob-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <radialGradient id="home-blob-hl" cx="32%" cy="28%" r="35%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <path
        d="M50 6 C72 6, 94 22, 94 48 C94 72, 78 92, 54 94 C30 96, 8 78, 6 54 C4 30, 22 8, 50 6 Z"
        fill="url(#home-blob-grad)"
      />
      <ellipse cx="35" cy="30" rx="18" ry="14" fill="url(#home-blob-hl)" />
      <path
        d="M34 58 Q50 72, 66 58"
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="38" cy="46" r="4" fill="#fff" />
      <circle cx="62" cy="46" r="4" fill="#fff" />
    </svg>
  </motion.div>
)

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

const GameBubble = ({ game, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.4 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.35 + index * 0.05, type: 'spring', stiffness: 300, damping: 18 }}
    whileHover={{ y: -4, scale: 1.12, rotate: -4 }}
    title={game.name}
    style={{
      width: 'clamp(40px, 6dvh, 48px)',
      height: 'clamp(40px, 6dvh, 48px)',
      borderRadius: '50%',
      background: game.bg,
      boxShadow: `0 6px 14px ${game.shadow}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'clamp(20px, 2.8dvh, 24px)',
      flexShrink: 0,
      cursor: 'default',
    }}
  >
    {game.emoji}
  </motion.div>
)

const HomeScreen = () => {
  const navigate = useNavigate()
  const resetSession = useSession((s) => s.resetSession)
  const setOnlineMode = useSession((s) => s.setOnlineMode)
  const showError = useSession((s) => s.showError)
  const [creating, setCreating] = useState(false)

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
        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ textAlign: 'center' }}
        >
          <HeroBlob />
          <GradientTitle as="h1" size="xl" style={{ marginTop: 'clamp(8px, 1.4dvh, 14px)' }}>
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

        {/* Game preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ textAlign: 'center' }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 10,
            }}
          >
            {PLAYABLE_GAMES.length} giochi disponibili
          </div>
          <div
            style={{
              display: 'flex',
              gap: 'clamp(6px, 1vw, 10px)',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {PLAYABLE_GAMES.map((g, i) => (
              <GameBubble key={g.id} game={g} index={i} />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default HomeScreen

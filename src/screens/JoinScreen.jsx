import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppHeader from '../components/AppHeader'
import ErrorBanner from '../components/ErrorBanner'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import GradientTitle from '../components/ui/GradientTitle'
import { addPlayerToRoom } from '../lib/room'
import { useSession } from '../stores/useSession'

const CODE_ALPHABET = 'BCDFGHJKLMNPRSTVWX'

const JoinScreen = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const setOnlineMode = useSession((s) => s.setOnlineMode)
  const showError = useSession((s) => s.showError)

  const handleCodeChange = (e) => {
    const raw = e.target.value.toUpperCase().slice(0, 4)
    const filtered = [...raw].filter((c) => CODE_ALPHABET.includes(c)).join('')
    setCode(filtered)
  }

  const canSubmit = code.length === 4 && name.trim().length > 0 && !submitting

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    const playerId =
      crypto.randomUUID?.() ??
      `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const { error } = await addPlayerToRoom(code, { id: playerId, name: name.trim() })
    if (error) {
      const errType = error.message === 'room_full' ? 'room_full' : 'room_not_found'
      showError(errType)
      setSubmitting(false)
      return
    }
    setOnlineMode(code, false, playerId)
    navigate('/lobby')
  }

  return (
    <motion.div
      className="screen screen-narrow"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <AppHeader
        leading={
          <IconButton ariaLabel="Indietro" onClick={() => navigate('/', { replace: true })}>←</IconButton>
        }
      />
      <ErrorBanner />

      <form
        className="screen-body"
        onSubmit={handleSubmit}
        style={{
          gap: 'clamp(12px, 1.8dvh, 18px)',
          paddingTop: 'clamp(24px, 5dvh, 48px)',
          paddingBottom: 'clamp(16px, 3dvh, 28px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', flexShrink: 0 }}
        >
          <GradientTitle as="h1" size="lg">Entra nel party 🔑</GradientTitle>
          <p style={{
            margin: '6px 0 0',
            color: 'var(--muted)',
            fontSize: 'clamp(12px, 1.5dvh, 14px)',
            fontWeight: 600,
          }}>
            Inserisci il codice e il tuo nome
          </p>
        </motion.div>

        {/* Code input card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          style={cardStyle}
        >
          <div style={labelStyle}>🎟️ Codice party</div>
          <input
            value={code}
            onChange={handleCodeChange}
            placeholder="ABCD"
            style={{ ...inputStyle, letterSpacing: '0.2em', textAlign: 'center', fontWeight: 800, fontSize: 'clamp(20px, 3dvh, 28px)' }}
            autoFocus
            maxLength={4}
          />
        </motion.div>

        {/* Name input card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={cardStyle}
        >
          <div style={labelStyle}>✍️ Il tuo nome</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Marco"
              style={inputStyle}
              maxLength={12}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit}
              style={{ flexShrink: 0, padding: '0 16px', boxShadow: 'none', height: 'clamp(44px, 6dvh, 56px)' }}
            >
              {submitting ? '...' : 'Entra'}
            </Button>
          </div>
        </motion.div>
      </form>

    </motion.div>
  )
}

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: 'clamp(12px, 1.8dvh, 16px)',
  boxShadow: 'var(--shadow-sm)',
  flexShrink: 0,
}

const labelStyle = {
  fontSize: 'clamp(11px, 1.4dvh, 13px)',
  color: 'var(--muted)',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 8,
}

const inputStyle = {
  flex: 1,
  minWidth: 0,
  height: 'clamp(44px, 6dvh, 56px)',
  background: 'var(--surface)',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  fontSize: 'clamp(14px, 2dvh, 18px)',
  padding: '0 clamp(12px, 2vw, 16px)',
  outline: 'none',
}

export default JoinScreen

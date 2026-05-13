import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppHeader from '../components/AppHeader'
import ErrorBanner from '../components/ErrorBanner'
import Button from '../components/ui/Button'
import GradientTitle from '../components/ui/GradientTitle'
import LinkCta from '../components/ui/LinkCta'
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

  const inputStyle = {
    width: '100%',
    height: 'clamp(48px, 7dvh, 64px)',
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    fontSize: 'clamp(16px, 2.5dvh, 22px)',
    padding: '0 clamp(14px, 3vw, 20px)',
    outline: 'none',
  }

  return (
    <motion.div
      className="screen screen-narrow"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <AppHeader />
      <ErrorBanner />
      <form
        className="screen-body"
        onSubmit={handleSubmit}
        style={{ justifyContent: 'center', gap: 'clamp(10px, 1.8dvh, 16px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 'clamp(4px, 1.5dvh, 12px)' }}
        >
          <GradientTitle as="h2" size="md">Entra nel party 🚪</GradientTitle>
          <p style={{
            margin: '8px 0 0',
            color: 'var(--muted)',
            fontSize: 'clamp(13px, 1.7dvh, 15px)',
          }}>
            Inserisci il codice del party
          </p>
        </motion.div>

        <label style={{ color: 'var(--muted)', fontSize: 'clamp(13px, 1.8dvh, 15px)', fontWeight: 600 }}>
          Codice party
        </label>
        <input
          value={code}
          onChange={handleCodeChange}
          placeholder="ABCD"
          style={{ ...inputStyle, letterSpacing: '0.2em', textAlign: 'center', fontWeight: 700 }}
          autoFocus
          maxLength={4}
        />
        <label style={{ color: 'var(--muted)', fontSize: 'clamp(13px, 1.8dvh, 15px)', fontWeight: 600 }}>
          Il tuo nome
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome (max 8)"
          style={inputStyle}
          maxLength={8}
        />
      </form>
      <div
        className="screen-footer"
        style={{
          flexDirection: 'column',
          gap: 10,
          height: 'auto',
          padding: 'clamp(16px, 2.5dvh, 22px) clamp(16px, 4vw, 28px) clamp(20px, 3dvh, 28px)',
          alignItems: 'stretch',
        }}
      >
        <Button variant="primary" width="full" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Entro...' : '🚪 Entra nel party'}
        </Button>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LinkCta onClick={() => navigate('/')}>
            ← Indietro
          </LinkCta>
        </div>
      </div>
    </motion.div>
  )
}

export default JoinScreen

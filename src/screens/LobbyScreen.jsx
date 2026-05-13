// Lobby — modello host-controlled.
// Host: aggiunge il proprio nome, vede QR, vede giocatori, impostazioni, bottone "Inizia".
// Client: vede giocatori, messaggio "In attesa dell'host..."
// L'host avvia il gioco con il bottone "Inizia la sfida".

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import AppHeader from '../components/AppHeader'
import ErrorBanner from '../components/ErrorBanner'
import ShareModal from '../components/ShareModal'
import SettingsModal from '../components/SettingsModal'
import HelpModal from '../components/HelpModal'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import GradientTitle from '../components/ui/GradientTitle'
import { useSession } from '../stores/useSession'
import { useSettings } from '../stores/useSettings'
import { addPlayerToRoom, pushRoom } from '../lib/room'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
}

const LobbyScreen = () => {
  const [name, setName] = useState('')
  const [starting, setStarting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const isHost = useSession((s) => s.isHost)
  const roomCode = useSession((s) => s.roomCode)
  const players = useSession((s) => s.players)
  const localPlayerId = useSession((s) => s.localPlayerId)
  const removePlayer = useSession((s) => s.removePlayer)
  const setOnlineMode = useSession((s) => s.setOnlineMode)
  const showError = useSession((s) => s.showError)

  const numQuestions = useSettings((s) => s.numQuestions)
  const timerDuration = useSettings((s) => s.timerDuration)
  const setNumQuestions = useSettings((s) => s.setNumQuestions)
  const setTimerDuration = useSettings((s) => s.setTimerDuration)

  const hostHasJoined = !isHost || (isHost && !!localPlayerId)
  const showNameInput = !localPlayerId && players.length < 8
  const canStart = isHost && hostHasJoined && players.length >= 2

  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    const trimmed = name.trim()
    if (!trimmed || players.length >= 8 || adding) return
    setAdding(true)
    const playerId =
      crypto.randomUUID?.() ??
      `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const { error } = await addPlayerToRoom(roomCode, {
      id: playerId,
      name: trimmed,
      isHost: isHost && !localPlayerId,
    })
    setAdding(false)
    if (error) {
      showError('generic')
      return
    }
    if (isHost && !localPlayerId) {
      setOnlineMode(roomCode, true, playerId)
    }
    setName('')
  }

  const handleRemove = (id) => {
    if (!isHost) return
    removePlayer(id)
  }

  // Host fa avanzare il flusso: lobby → game_voting.
  // La categoria è già stata scelta dall'host prima della creazione stanza
  // (salvata in gameState.selectedCategory). Resettiamo solo i voti dei giochi.
  const handleStartGame = useCallback(async () => {
    if (!canStart || starting) return
    setStarting(true)
    const s = useSession.getState()
    const newGameState = {
      ...(s.gameState || {}),
      gameVotes: {},
      selectedGame: null,
    }
    // Stato piatto top-level: tutte le RPC server-side scrivono qui.
    const fullState = {
      players: s.players,
      currentIdx: s.currentIdx,
      round: s.round,
      activeGame: s.activeGame,
      settings: { numQuestions },
      ...newGameState,
    }
    const { error } = await pushRoom(roomCode, 'game_voting', fullState)
    if (error) {
      console.error('[Lobby] proceed error:', error)
      showError('generic')
    }
    setStarting(false)
  }, [canStart, starting, numQuestions, roomCode, showError])

  const joinUrl = `${window.location.origin}/join?code=${roomCode}`

  return (
    <motion.div
      className="screen screen-narrow"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <AppHeader
        actions={
          <>
            {isHost && hostHasJoined && (
              <IconButton ariaLabel="Impostazioni" onClick={() => setShowSettings(true)}>
                ⚙️
              </IconButton>
            )}
            <IconButton ariaLabel="Come si gioca" onClick={() => setShowHelpModal(true)}>
              ❓
            </IconButton>
          </>
        }
      />
      <ErrorBanner />
      <div className="screen-body" style={{ gap: 'clamp(12px, 1.8dvh, 18px)', overflowY: 'auto' }}>
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', flexShrink: 0 }}
        >
          <GradientTitle as="h1" size="lg">Party in corso 🎉</GradientTitle>
          <p style={{
            margin: '6px 0 0',
            color: 'var(--muted)',
            fontSize: 'clamp(12px, 1.5dvh, 14px)',
            fontWeight: 600,
          }}>
            {players.length === 0
              ? 'Aggiungi il tuo nome per cominciare'
              : `${players.length}/8 giocatori al party`}
          </p>
        </motion.div>

        {/* Card codice + QR + copia */}
        {roomCode && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={inviteCardStyle}
          >
            {/* Blob decorativi */}
            <div style={inviteOrbStyle('top-right')} />
            <div style={inviteOrbStyle('bottom-left')} />

            <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
              <div style={codeLabelStyle}>🎟️ Codice party</div>
              <div style={codeNumberStyle}>{roomCode}</div>
              <div style={codeHintStyle}>Condividilo con gli amici per farli entrare</div>
            </div>

            {isHost && (
              <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowShareModal(true)}
                  style={shareBtnStyle}
                >
                  <span style={{ fontSize: 18 }}>📤</span>
                  <span>Condividi</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {/* Host name input */}
        {showNameInput && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12 }}
            style={nameInputBoxStyle}
          >
            <div style={{ fontSize: 'clamp(11px, 1.4dvh, 13px)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              ✍️ {isHost ? 'Il tuo nome (host)' : 'Il tuo nome'}
            </div>
            <div className="flex" style={{ gap: 8 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Es. Marco"
                style={inputStyle}
                maxLength={8}
                autoFocus
              />
              <Button
                variant="primary"
                onClick={handleAdd}
                disabled={!name.trim() || adding}
                style={{ flexShrink: 0, padding: '0 clamp(14px, 3vw, 20px)' }}
              >
                {adding ? '...' : 'Entra'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Players slots */}
        <div style={{ flexShrink: 0 }}>
          <div style={playerListLabelStyle}>
            <span>👥 Giocatori</span>
            <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{players.length}/8</span>
          </div>
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {players.map((p) => (
              <motion.div
                key={p.id}
                variants={itemVariants}
                onClick={() => (isHost && !p.is_host ? handleRemove(p.id) : undefined)}
                style={{ ...playerRowStyle, cursor: isHost && !p.is_host ? 'pointer' : 'default' }}
              >
                <div style={{ ...playerDotStyle, background: p.color }}>
                  {p.name?.slice(0, 2).toUpperCase()}
                </div>
                <span style={playerNameStyle}>
                  {p.name?.slice(0, 8)}
                </span>
                {p.is_host && <span style={hostPillStyle}>👑 HOST</span>}
                {isHost && !p.is_host && (
                  <span style={removeHintStyle}>✕</span>
                )}
              </motion.div>
            ))}
            {/* Slot vuoti (placeholder) */}
            {players.length < 8 && Array.from({ length: Math.min(2, 8 - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} style={emptySlotStyle}>
                <div style={emptyDotStyle}>?</div>
                <span style={emptyTextStyle}>In attesa...</span>
              </div>
            ))}
          </motion.div>
        </div>

      </div>

      {/* Footer */}
      <div className="screen-footer" style={{ flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
        {isHost && hostHasJoined && (
          <Button
            variant="primary"
            width="full"
            onClick={handleStartGame}
            disabled={!canStart || starting}
          >
            {starting ? '...' : 'Avanti — votate il gioco →'}
          </Button>
        )}

        {!isHost && (
          <p style={waitingStyle}>Aspettando che il capo si decida... 👑</p>
        )}

        {isHost && players.length < 2 && hostHasJoined && (
          <p style={waitingStyle}>Hai bisogno di almeno un nemico 😈</p>
        )}
      </div>

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        joinUrl={joinUrl}
        roomCode={roomCode}
      />

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        numQuestions={numQuestions}
        setNumQuestions={setNumQuestions}
        timerDuration={timerDuration}
        setTimerDuration={setTimerDuration}
      />

      <HelpModal
        open={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </motion.div>
  )
}

// --- Styles ---

const inputStyle = {
  flex: 1,
  height: 'clamp(44px, 6dvh, 56px)',
  background: 'var(--surface)',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  fontSize: 'clamp(14px, 2dvh, 18px)',
  padding: '0 clamp(12px, 2vw, 16px)',
  outline: 'none',
}

const inviteCardStyle = {
  position: 'relative',
  background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #EC4899 100%)',
  borderRadius: 24,
  padding: 'clamp(16px, 2.4dvh, 22px) clamp(16px, 4vw, 24px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'clamp(12px, 1.8dvh, 16px)',
  boxShadow: '0 16px 36px rgba(124, 58, 237, 0.32), inset 0 1px 0 rgba(255,255,255,0.3)',
  border: '1px solid rgba(255,255,255,0.18)',
  overflow: 'hidden',
  flexShrink: 0,
}

const inviteOrbStyle = (pos) => ({
  position: 'absolute',
  width: 140,
  height: 140,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.22)',
  filter: 'blur(28px)',
  pointerEvents: 'none',
  ...(pos === 'top-right'
    ? { top: -40, right: -40 }
    : { bottom: -50, left: -50 }),
})

const codeLabelStyle = {
  fontSize: 'clamp(10px, 1.3dvh, 12px)',
  color: 'rgba(255,255,255,0.85)',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: 4,
}

const codeNumberStyle = {
  fontSize: 'clamp(36px, 6.5dvh, 54px)',
  letterSpacing: '0.18em',
  color: '#fff',
  fontWeight: 900,
  lineHeight: 1.05,
  textShadow: '0 4px 16px rgba(0,0,0,0.20)',
  fontVariantNumeric: 'tabular-nums',
}

const codeHintStyle = {
  marginTop: 4,
  fontSize: 'clamp(11px, 1.4dvh, 13px)',
  color: 'rgba(255,255,255,0.80)',
  fontWeight: 600,
}

const shareBtnStyle = {
  width: '100%',
  height: 'clamp(44px, 6dvh, 52px)',
  background: 'rgba(255,255,255,0.98)',
  color: 'var(--accent)',
  border: 'none',
  borderRadius: 999,
  fontSize: 'clamp(13px, 1.7dvh, 15px)',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'all 0.15s',
  boxShadow: '0 6px 16px rgba(0,0,0,0.14)',
  backdropFilter: 'blur(6px)',
  letterSpacing: '-0.005em',
}

const nameInputBoxStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: 'clamp(12px, 1.8dvh, 16px)',
  boxShadow: 'var(--shadow-sm)',
  flexShrink: 0,
}

const playerListLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 'clamp(11px, 1.4dvh, 13px)',
  fontWeight: 700,
  color: 'var(--muted)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const emptySlotStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 'clamp(8px, 1.2dvh, 12px) clamp(12px, 2vw, 14px)',
  background: 'transparent',
  border: '1.5px dashed var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  opacity: 0.55,
}

const emptyDotStyle = {
  width: 'clamp(32px, 4.5dvh, 38px)',
  height: 'clamp(32px, 4.5dvh, 38px)',
  borderRadius: '50%',
  background: 'var(--bg2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--muted)',
  fontWeight: 800,
  fontSize: 'clamp(13px, 1.6dvh, 15px)',
  flexShrink: 0,
}

const emptyTextStyle = {
  flex: 1,
  fontWeight: 600,
  color: 'var(--muted)',
  fontSize: 'clamp(13px, 1.6dvh, 15px)',
  fontStyle: 'italic',
}

const playerRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 'clamp(8px, 1.2dvh, 12px) clamp(12px, 2vw, 14px)',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  boxShadow: 'var(--shadow-sm)',
}

const playerDotStyle = {
  width: 'clamp(32px, 4.5dvh, 38px)',
  height: 'clamp(32px, 4.5dvh, 38px)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 800,
  fontSize: 'clamp(11px, 1.4dvh, 13px)',
  flexShrink: 0,
}

const playerNameStyle = {
  flex: 1,
  fontWeight: 700,
  color: 'var(--text)',
  fontSize: 'clamp(14px, 1.8dvh, 16px)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const hostPillStyle = {
  background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
  color: '#fff',
  fontWeight: 800,
  fontSize: 10,
  letterSpacing: '0.05em',
  padding: '3px 8px',
  borderRadius: 10,
  flexShrink: 0,
}

const removeHintStyle = {
  color: 'var(--muted)',
  fontSize: 14,
  fontWeight: 700,
  width: 22,
  height: 22,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const waitingStyle = {
  color: 'var(--muted)',
  fontSize: 'clamp(12px, 1.5dvh, 14px)',
  textAlign: 'center',
}

export default LobbyScreen

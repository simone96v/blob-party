import { useMemo } from 'react'
import { motion } from 'framer-motion'
import AppHeader from '../../../components/AppHeader'
import IconButton from '../../../components/ui/IconButton'
import Button from '../../../components/ui/Button'
import MapView from './MapView'
import { haversine, calcScore } from '../geo'
import { haptic } from '../../../utils/haptic'

const MappaReveal = ({
  question,
  questionNumber,
  totalQuestions,
  players,
  localPlayerId,
  isHost,
  pins,
  hasMoreQuestions,
  advancing,
  onAdvance,
  onExit,
}) => {
  const answer = question?.answer

  const results = useMemo(() => {
    if (!answer) return []
    return players.map((p) => {
      const pin = pins?.[p.id]
      if (!pin || (pin.lat === 0 && pin.lng === 0 && pin.auto)) {
        return { ...p, distance: null, roundScore: 0, hasPin: false, auto: false, pin: null }
      }
      const dist = haversine(pin.lat, pin.lng, answer.lat, answer.lng)
      const pts = calcScore(dist)
      return { ...p, distance: dist, roundScore: pts, hasPin: true, auto: !!pin.auto, pin }
    }).sort((a, b) => b.roundScore - a.roundScore)
  }, [answer, players, pins])

  const myResult = results.find((r) => r.id === localPlayerId)

  const mapPins = useMemo(() =>
    results
      .filter((r) => r.hasPin && r.pin)
      .map((r) => ({
        lat: r.pin.lat,
        lng: r.pin.lng,
        color: r.color,
        id: r.id,
        auto: r.auto,
      })),
    [results],
  )

  if (!question) return null

  return (
    <div style={S.container}>
      <AppHeader
        leading={isHost && <IconButton ariaLabel="Esci" onClick={onExit}>←</IconButton>}
        actions={<RoundBadge n={questionNumber} total={totalQuestions} />}
      />

      <div style={S.mapSection}>
        <MapView
          pins={mapPins}
          revealMode
          realAnswer={answer}
          disabled
          rounded={false}
        />
      </div>

      <div style={S.panel}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={S.answerBar}
        >
          <span style={S.answerEmoji}>📍</span>
          <span style={S.answerName}>{answer?.name ?? 'Posizione sconosciuta'}</span>
        </motion.div>

        {myResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            style={S.myScoreCard}
            onAnimationComplete={() => {
              if (myResult.roundScore >= 80) haptic.double()
              else if (myResult.hasPin) haptic.medium()
              else haptic.light()
            }}
          >
            {myResult.hasPin ? (
              <>
                <span style={S.myDistance}>{myResult.distance.toFixed(1)} km</span>
                <span style={{
                  ...S.myPoints,
                  color: myResult.roundScore >= 80 ? 'var(--success)' : 'var(--text)',
                }}>
                  +{myResult.roundScore} {myResult.roundScore >= 100 ? '🎯' : myResult.distance < 10 ? '🔥' : ''}
                </span>
              </>
            ) : (
              <span style={S.myDistance}>Nessun pin — 0 punti</span>
            )}
          </motion.div>
        )}

        <div style={S.leaderboard}>
          {results.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              style={{
                ...S.lbRow,
                borderColor: r.id === localPlayerId ? 'var(--accent)' : 'transparent',
              }}
            >
              <span style={S.lbRank}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
              <div style={{ ...S.lbDot, backgroundColor: r.color }} />
              <span style={S.lbName}>{r.name}</span>
              <span style={S.lbFill} />
              {r.hasPin ? (
                <>
                  <span style={S.lbDist}>{r.distance.toFixed(0)} km</span>
                  <span style={S.lbScore}>+{r.roundScore}</span>
                </>
              ) : (
                <span style={{ ...S.lbDist, color: 'var(--muted)' }}>
                  {r.auto ? '⏰' : '—'}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        <div style={S.footer}>
          {isHost ? (
            <Button variant="primary" width="full" onClick={onAdvance} disabled={advancing}>
              {advancing
                ? '...'
                : hasMoreQuestions
                  ? 'Avanti tutta! →'
                  : 'Classifica finale 🏆'}
            </Button>
          ) : (
            <p style={S.waitText}>Aspettando il boss... 👑</p>
          )}
        </div>
      </div>
    </div>
  )
}

const RoundBadge = ({ n, total }) => (
  <div style={{
    background: 'var(--bg2)',
    color: '#059669',
    fontWeight: 800,
    fontSize: 'clamp(11px, 1.4dvh, 13px)',
    padding: '5px 12px',
    borderRadius: 999,
    border: '1.5px solid rgba(5, 150, 105, 0.18)',
    letterSpacing: '0.05em',
    minWidth: 44,
    textAlign: 'center',
  }}>
    {n}/{total}
  </div>
)

const S = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    height: '100dvh',
  },
  mapSection: {
    height: '38%',
    flexShrink: 0,
    position: 'relative',
  },
  panel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    background: 'var(--bg)',
    borderTop: '1px solid var(--border)',
  },
  answerBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 'clamp(10px, 1.5dvh, 14px) clamp(14px, 3vw, 20px)',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  answerEmoji: {
    fontSize: 'clamp(18px, 2.5dvh, 24px)',
    flexShrink: 0,
  },
  answerName: {
    fontWeight: 800,
    fontSize: 'clamp(15px, 2dvh, 19px)',
    color: 'var(--text)',
  },
  myScoreCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 'clamp(10px, 1.5dvh, 14px) clamp(14px, 3vw, 20px)',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  myDistance: {
    fontSize: 'clamp(13px, 1.6dvh, 16px)',
    fontWeight: 700,
    color: 'var(--muted)',
  },
  myPoints: {
    fontSize: 'clamp(18px, 2.5dvh, 24px)',
    fontWeight: 800,
  },
  leaderboard: {
    flex: 1,
    padding: 'clamp(8px, 1.2dvh, 12px) clamp(14px, 3vw, 20px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(4px, 0.6dvh, 6px)',
    overflow: 'auto',
    minHeight: 0,
  },
  lbRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 'clamp(6px, 1dvh, 10px) clamp(8px, 1.5vw, 12px)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid transparent',
    flexShrink: 0,
  },
  lbRank: {
    fontSize: 'clamp(13px, 1.6dvh, 16px)',
    fontWeight: 800,
    minWidth: 24,
    textAlign: 'center',
  },
  lbDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    flexShrink: 0,
  },
  lbName: {
    fontSize: 'clamp(13px, 1.6dvh, 16px)',
    fontWeight: 700,
    color: 'var(--text)',
  },
  lbFill: { flex: 1 },
  lbDist: {
    fontSize: 'clamp(11px, 1.3dvh, 13px)',
    fontWeight: 600,
    color: 'var(--muted)',
    marginRight: 4,
  },
  lbScore: {
    fontSize: 'clamp(13px, 1.6dvh, 16px)',
    fontWeight: 800,
    color: 'var(--success)',
    minWidth: 36,
    textAlign: 'right',
  },
  footer: {
    padding: 'clamp(8px, 1.2dvh, 12px) clamp(14px, 3vw, 20px)',
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
  },
  waitText: {
    color: 'var(--muted)',
    fontSize: 'clamp(13px, 1.6dvh, 16px)',
    fontWeight: 600,
    textAlign: 'center',
    padding: 'clamp(10px, 1.5dvh, 16px) 0',
    margin: 0,
  },
}

export default MappaReveal

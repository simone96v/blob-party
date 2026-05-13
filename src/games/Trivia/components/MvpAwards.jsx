// 3 badge MVP a fine partita: Cervellone / Streak Master / Lampo.
// Calcolati dai per-player aggregates aggiornati lato server in submit_answer.

import { motion } from 'framer-motion'

const computeMvps = (players) => {
  if (!players?.length) return []

  // 🎯 Cervellone — più correct_count (tie-break: speed_avg più basso)
  const byAccuracy = [...players].sort((a, b) => {
    const dc = (b.correct_count ?? 0) - (a.correct_count ?? 0)
    if (dc !== 0) return dc
    const aAvg = (a.correct_count ?? 0) > 0 ? (a.total_speed_ms ?? 0) / a.correct_count : Infinity
    const bAvg = (b.correct_count ?? 0) > 0 ? (b.total_speed_ms ?? 0) / b.correct_count : Infinity
    return aAvg - bAvg
  })
  const brain = byAccuracy[0]
  const brainOk = (brain?.correct_count ?? 0) >= 1

  // 🔥 Streak Master — best_streak max (min 3 per assegnarlo)
  const byStreak = [...players].sort((a, b) => (b.best_streak ?? 0) - (a.best_streak ?? 0))
  const streaker = byStreak[0]
  const streakerOk = (streaker?.best_streak ?? 0) >= 3

  // ⚡ Lampo — speed_avg più basso (min 3 corrette)
  const eligibleFast = players
    .filter((p) => (p.correct_count ?? 0) >= 3)
    .sort((a, b) => {
      const aAvg = (a.total_speed_ms ?? 0) / (a.correct_count || 1)
      const bAvg = (b.total_speed_ms ?? 0) / (b.correct_count || 1)
      return aAvg - bAvg
    })
  const flash = eligibleFast[0]
  const flashOk = !!flash

  return [
    {
      key: 'brain',
      emoji: '🎯',
      title: 'Cervellone',
      player: brainOk ? brain : null,
      stat: brainOk ? `${brain.correct_count} corrette` : '—',
      color: 'var(--accent)',
    },
    {
      key: 'streak',
      emoji: '🔥',
      title: 'Streak Master',
      player: streakerOk ? streaker : null,
      stat: streakerOk ? `streak x${streaker.best_streak}` : '—',
      color: 'var(--warning)',
    },
    {
      key: 'flash',
      emoji: '⚡',
      title: 'Lampo',
      player: flashOk ? flash : null,
      stat: flashOk
        ? `${((flash.total_speed_ms / flash.correct_count) / 1000).toFixed(1)}s/q`
        : '—',
      color: 'var(--accent3)',
    },
  ]
}

const MvpAwards = ({ players }) => {
  const mvps = computeMvps(players)
  return (
    <div style={{
      display: 'flex',
      gap: 'clamp(6px, 1.2vw, 10px)',
      flexShrink: 0,
    }}>
      {mvps.map((m, i) => (
        <motion.div
          key={m.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.08 }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: 'clamp(8px, 1.4dvh, 12px) clamp(6px, 1vw, 10px)',
            background: 'var(--surface)',
            border: `1.5px solid ${m.player ? m.color : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            opacity: m.player ? 1 : 0.55,
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 'clamp(20px, 2.6dvh, 26px)', lineHeight: 1 }}>
            {m.emoji}
          </span>
          <span style={{
            fontSize: 'clamp(9px, 1.1dvh, 11px)',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: m.player ? m.color : 'var(--muted)',
            textAlign: 'center',
          }}>
            {m.title}
          </span>
          <span style={{
            fontSize: 'clamp(11px, 1.4dvh, 13px)',
            fontWeight: 700,
            color: 'var(--text)',
            textAlign: 'center',
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {m.player?.name ?? 'Nessuno'}
          </span>
          <span style={{
            fontSize: 'clamp(10px, 1.2dvh, 12px)',
            color: 'var(--muted)',
            fontWeight: 600,
          }}>
            {m.stat}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

export default MvpAwards

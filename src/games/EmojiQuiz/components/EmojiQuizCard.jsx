// Card della "domanda" di Emoji Quiz: sequenza di emoji + chip categoria + difficoltà.
// Altezza minima fissa per non spostare la griglia risposte fra question/reveal.

import { motion } from 'framer-motion'
import { getCategoryById } from '../../../lib/emojiQuizDeck'

const EmojiQuizCard = ({ puzzle }) => {
  if (!puzzle) return null
  const stars = puzzle.difficulty ?? 2
  const diffColor =
    puzzle.difficulty === 3 ? 'var(--danger)' :
    puzzle.difficulty === 1 ? 'var(--success)' : 'var(--warning)'

  // Lookup metadata della categoria (label + emoji + color).
  // Supporta sia gli ID nuovi ('film', 'canzoni', 'serie_tv', 'videogiochi', 'marchi')
  // sia i valori legacy DB ('Film', 'Canzone') tramite normalizzazione.
  const catId = normalizeCatId(puzzle.category)
  const cat = getCategoryById(catId)

  return (
    <motion.div
      key={puzzle.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={cardStyle}
    >
      {/* Top row: categoria + difficoltà */}
      <div style={topRowStyle}>
        <span style={{
          ...catChip,
          background: `${cat.color}1f`,
          color: cat.color,
          border: `1px solid ${cat.color}40`,
        }}>
          <span style={{ fontSize: 14 }}>{cat.emoji}</span>
          {cat.label}
        </span>
        <div style={diffDotsStyle} aria-label={`Difficoltà ${stars}/3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              fontSize: 12,
              color: i < stars ? diffColor : 'var(--border-strong)',
              lineHeight: 1,
            }}>●</span>
          ))}
        </div>
      </div>

      {/* Emoji puzzle */}
      <div style={emojiContainerStyle}>
        <span style={emojiStyle}>{puzzle.emoji}</span>
      </div>
    </motion.div>
  )
}

// Mappa categorie legacy DB → nuovi ID del bundle. 'tutte' non è una categoria
// per-puzzle (è solo un filtro) quindi fallback a 'film' è arbitrario ma innocuo.
const normalizeCatId = (raw) => {
  if (!raw) return 'film'
  const s = String(raw).toLowerCase()
  if (s === 'film') return 'film'
  if (s === 'canzone' || s === 'canzoni') return 'canzoni'
  if (s === 'serie tv' || s === 'serie_tv' || s === 'series') return 'serie_tv'
  if (s === 'videogioco' || s === 'videogiochi' || s === 'videogames') return 'videogiochi'
  if (s === 'marchio' || s === 'marchi' || s === 'brand') return 'marchi'
  return s
}

const cardStyle = {
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--surface)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-sm)',
  padding: 'clamp(12px, 1.8dvh, 18px) clamp(14px, 3vw, 20px)',
  gap: 6,
  minHeight: 'clamp(120px, 18dvh, 180px)',
  boxSizing: 'border-box',
}

const topRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0,
}

const catChip = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 'clamp(11px, 1.3dvh, 13px)',
  fontWeight: 800,
  letterSpacing: '0.02em',
}

const diffDotsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
}

const emojiContainerStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 0,
  padding: 'clamp(8px, 1.2dvh, 14px) 0',
}

const emojiStyle = {
  fontSize: 'clamp(52px, 9dvh, 84px)',
  letterSpacing: 4,
  lineHeight: 1,
  textAlign: 'center',
  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))',
}

export default EmojiQuizCard

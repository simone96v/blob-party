// Card della domanda con topic chip e difficulty stars in alto, testo grosso al centro.
// Usata in fase question (testo full) e reveal (testo compatto).

import { motion } from 'framer-motion'
import { topicLabel, DIFFICULTY_STARS } from '../constants'

const QuestionCard = ({ question, compact = false }) => {
  if (!question) return null
  const topic = topicLabel(question.topic)
  const stars = DIFFICULTY_STARS[question.difficulty] ?? 2
  const diffColor =
    question.difficulty === 'hard' ? 'var(--danger)' :
    question.difficulty === 'easy' ? 'var(--success)' : 'var(--warning)'

  return (
    <motion.div
      key={question.question}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        flex: compact ? '0 0 auto' : 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        padding: 'clamp(14px, 2dvh, 20px) clamp(16px, 3vw, 22px)',
        gap: 'clamp(8px, 1.4dvh, 14px)',
      }}
    >
      {/* Meta row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        {topic && (
          <span style={{
            fontSize: 'clamp(11px, 1.3dvh, 13px)',
            fontWeight: 700,
            color: 'var(--accent)',
            background: 'rgba(124, 58, 237, 0.10)',
            padding: '4px 10px',
            borderRadius: 999,
            letterSpacing: '-0.005em',
          }}>
            {topic}
          </span>
        )}
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }} aria-label={`Difficoltà ${question.difficulty}`}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              fontSize: 12,
              color: i < stars ? diffColor : 'var(--border-strong)',
              lineHeight: 1,
            }}>
              ●
            </span>
          ))}
        </div>
      </div>

      {/* Question text */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
      }}>
        <h2 style={{
          margin: 0,
          fontWeight: 800,
          fontSize: compact
            ? 'clamp(14px, 2dvh, 18px)'
            : 'clamp(17px, 2.8dvh, 24px)',
          lineHeight: 1.35,
          textAlign: 'center',
          letterSpacing: '-0.01em',
          color: 'var(--text)',
        }}>
          {question.question}
        </h2>
      </div>
    </motion.div>
  )
}

export default QuestionCard

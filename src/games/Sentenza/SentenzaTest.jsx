import { useState } from 'react'
import GradientTitle from '../../components/ui/GradientTitle'
import Button from '../../components/ui/Button'

const PHASES = [
  'countdown',
  'judging_setup',
  'selection',
  'judging',
  'reveal',
  'final',
]

const SentenzaTest = () => {
  const [phase, setPhase] = useState('selection')

  return (
    <div className="screen screen-narrow">
      <div className="screen-body" style={{ gap: 16 }}>
        <GradientTitle
          as="h1"
          size="lg"
          gradient="linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #4F46E5 100%)"
        >
          Test Sentenza
        </GradientTitle>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PHASES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPhase(p)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: phase === p ? '2px solid #6366F1' : '1px solid var(--border)',
                background: phase === p ? '#6366F1' : 'var(--surface)',
                color: phase === p ? '#fff' : 'var(--text)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>
          <p style={{ color: 'var(--muted)', fontWeight: 600 }}>
            Phase: <strong style={{ color: '#6366F1' }}>{phase}</strong> — componenti in arrivo
          </p>
        </div>
      </div>
    </div>
  )
}

export default SentenzaTest

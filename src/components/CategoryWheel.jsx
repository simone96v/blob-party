// Wheel delle categorie. SVG con segmenti colorati, pointer fisso in alto,
// animazione di rotazione che termina su una categoria casuale (esclusione
// di categorie già giocate gestita lato chiamante via prop `categories`).
//
// Props:
//   - categories: array di { id, label, emoji, color } da mostrare
//   - onSpinEnd(category): callback al termine dell'animazione (~4s)
//   - disabled: bool — disabilita il bottone

import { useState } from 'react'
import { motion } from 'framer-motion'

const WHEEL_SIZE = 280
const CX = WHEEL_SIZE / 2
const CY = WHEEL_SIZE / 2
const R = (WHEEL_SIZE / 2) - 4

const CategoryWheel = ({ categories = [], onSpinEnd, disabled = false }) => {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [landed, setLanded] = useState(null)

  const segCount = categories.length
  if (segCount === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
        Nessuna categoria disponibile
      </div>
    )
  }
  const segAngle = 360 / segCount

  const spin = () => {
    if (spinning || disabled) return
    setSpinning(true)
    setLanded(null)

    // Indice vincente
    const winIdx = Math.floor(Math.random() * segCount)

    // Centro del segmento vincente nel sistema "0deg in alto, CW positive".
    // I segmenti sono disegnati partendo da -90 (top) e andando in senso orario.
    const segCenter = winIdx * segAngle + segAngle / 2

    // Rotazione: 6 giri pieni + offset per portare segCenter al pointer (top, 0deg).
    // Visto che il wheel ruota mentre i segmenti seguono, l'angolo finale =
    // -segCenter (mod 360) per allineare il centro del segmento con il pointer.
    const offset = ((360 - segCenter) % 360 + 360) % 360
    const total = 360 * 6 + offset

    setRotation((prev) => prev + total)

    setTimeout(() => {
      setSpinning(false)
      setLanded(categories[winIdx])
      onSpinEnd?.(categories[winIdx])
    }, 4200)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: WHEEL_SIZE, height: WHEEL_SIZE + 24 }}>
        {/* Pointer (triangolo in alto) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '14px solid transparent',
          borderRight: '14px solid transparent',
          borderTop: '22px solid #1F2937',
          zIndex: 2,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }} />

        <motion.svg
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.17, 0.67, 0.16, 0.99] }}
          style={{
            position: 'absolute',
            top: 24,
            left: 0,
            filter: 'drop-shadow(0 14px 32px rgba(124, 58, 237, 0.25))',
          }}
        >
          {categories.map((cat, i) => {
            const a1 = (i * segAngle - 90) * Math.PI / 180
            const a2 = ((i + 1) * segAngle - 90) * Math.PI / 180
            const x1 = CX + R * Math.cos(a1)
            const y1 = CY + R * Math.sin(a1)
            const x2 = CX + R * Math.cos(a2)
            const y2 = CY + R * Math.sin(a2)
            const largeArc = segAngle > 180 ? 1 : 0
            const path = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`

            // Label angle (centro del segmento)
            const labelAngle = (i * segAngle + segAngle / 2 - 90) * Math.PI / 180
            const lr = R * (segCount > 6 ? 0.62 : 0.6)
            const lx = CX + lr * Math.cos(labelAngle)
            const ly = CY + lr * Math.sin(labelAngle)
            // Rotazione del testo per seguire la sezione (perpendicolare al raggio)
            const textRotation = i * segAngle + segAngle / 2

            return (
              <g key={cat.id}>
                <path d={path} fill={cat.color} stroke="#fff" strokeWidth={segCount > 6 ? 2 : 3} />
                <g transform={`translate(${lx} ${ly}) rotate(${textRotation})`}>
                  <text
                    x="0" y={segCount > 6 ? -4 : -6}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={segCount > 6 ? 20 : 26}
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                  >
                    {cat.emoji}
                  </text>
                  <text
                    x="0" y={segCount > 6 ? 12 : 16}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={segCount > 6 ? 8 : 11}
                    fontWeight={800}
                    style={{ letterSpacing: '0.04em' }}
                  >
                    {cat.label.toUpperCase()}
                  </text>
                </g>
              </g>
            )
          })}
          {/* Center hub */}
          <circle cx={CX} cy={CY} r={20} fill="#fff" stroke="#1F2937" strokeWidth={3} />
          <circle cx={CX} cy={CY} r={8} fill="#1F2937" />
        </motion.svg>
      </div>

      <button
        type="button"
        onClick={spin}
        disabled={spinning || disabled || segCount === 0}
        style={{
          background: spinning
            ? 'var(--surface2)'
            : 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
          color: spinning ? 'var(--muted)' : '#fff',
          border: 'none',
          padding: '14px 32px',
          borderRadius: 16,
          fontSize: 'clamp(14px, 1.8dvh, 17px)',
          fontWeight: 900,
          letterSpacing: '0.01em',
          cursor: (spinning || disabled) ? 'default' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          boxShadow: spinning ? 'none' : '0 8px 20px rgba(124, 58, 237, 0.35)',
          transition: 'all 0.2s',
          minWidth: 200,
        }}
      >
        {spinning
          ? '🌀 Sto spinnando...'
          : landed
            ? `🎯 ${landed.emoji} ${landed.label}!`
            : '🎡 SPIN per scoprire la categoria!'}
      </button>
    </div>
  )
}

export default CategoryWheel

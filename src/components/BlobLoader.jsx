import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Spinner from './ui/Spinner'

const EXPR_SEQUENCE = [
  { top: 'look-right', bottom: 'look-left',  dur: 2000 },
  { top: 'blink',      bottom: 'look-left',  dur: 150 },
  { top: 'look-right', bottom: 'look-left',  dur: 2500 },
  { top: 'look-right', bottom: 'blink',      dur: 150 },
  { top: 'happy',      bottom: 'look-left',  dur: 2000 },
  { top: 'look-right', bottom: 'happy',      dur: 2000 },
  { top: 'blink',      bottom: 'blink',      dur: 150 },
  { top: 'look-right', bottom: 'look-left',  dur: 2500 },
]

const useExpressions = () => {
  const [topExpr, setTopExpr] = useState('look-right')
  const [bottomExpr, setBottomExpr] = useState('look-left')
  const idxRef = useRef(0)

  useEffect(() => {
    let timer
    const step = () => {
      const s = EXPR_SEQUENCE[idxRef.current]
      setTopExpr(s.top)
      setBottomExpr(s.bottom)
      idxRef.current = (idxRef.current + 1) % EXPR_SEQUENCE.length
      timer = setTimeout(step, s.dur)
    }
    step()
    return () => clearTimeout(timer)
  }, [])

  return { topExpr, bottomExpr }
}

const BlobEyes = ({ expr, lx, rx, ey, prefix, rotate = 0 }) => {
  const pupilDx = expr === 'look-left' ? -9 : expr === 'look-right' ? 9 : 0
  const pupilDy = expr === 'look-left' ? -3 : expr === 'look-right' ? -3 : 0
  const cx = (lx + rx) / 2
  const wrap = (children) =>
    rotate ? <g transform={`rotate(${rotate}, ${cx}, ${ey})`}>{children}</g> : <>{children}</>

  if (expr === 'blink') {
    return wrap(
      <>
        <ellipse cx={lx} cy={ey} rx="24" ry="4" fill="#fff" opacity="0.9" />
        <ellipse cx={rx} cy={ey} rx="24" ry="4" fill="#fff" opacity="0.9" />
      </>
    )
  }

  if (expr === 'happy') {
    return wrap(
      <>
        <path d={`M${lx - 22} ${ey + 3} Q${lx} ${ey - 22}, ${lx + 22} ${ey + 3}`}
          fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        <path d={`M${rx - 22} ${ey + 3} Q${rx} ${ey - 22}, ${rx + 22} ${ey + 3}`}
          fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      </>
    )
  }

  return wrap(
    <>
      <ellipse cx={lx} cy={ey} rx="26" ry="28" fill={`url(#${prefix}-eye-l)`} />
      <circle cx={lx + 3 + pupilDx} cy={ey + 4 + pupilDy} r="12" fill="#6D28D9" />
      <circle cx={lx + 5 + pupilDx} cy={ey + 1 + pupilDy} r="4.5" fill="#1E1B4B" />
      <circle cx={lx + 9 + pupilDx} cy={ey - 3 + pupilDy} r="2.8" fill="rgba(255,255,255,0.9)" />
      <ellipse cx={rx} cy={ey} rx="26" ry="28" fill={`url(#${prefix}-eye-r)`} />
      <circle cx={rx + 3 + pupilDx} cy={ey + 4 + pupilDy} r="12" fill="#6D28D9" />
      <circle cx={rx + 5 + pupilDx} cy={ey + 1 + pupilDy} r="4.5" fill="#1E1B4B" />
      <circle cx={rx + 9 + pupilDx} cy={ey - 3 + pupilDy} r="2.8" fill="rgba(255,255,255,0.9)" />
    </>
  )
}

const BLOB_COLORS = {
  tb: ['#C4B5FD', '#A78BFA', '#8B5CF6'],
  tr: ['#FDE68A', '#FBBF24', '#F59E0B'],
  bl: ['#6EE7B7', '#34D399', '#10B981'],
  bb: ['#FDA4AF', '#FB7185', '#F43F5E'],
}

const blobDefs = (prefix) => {
  const [c1, c2, c3] = BLOB_COLORS[prefix]
  return (
    <defs>
      <linearGradient id={`bl-${prefix}-grad`} x1="0%" y1="0%" x2="100%" y2="80%">
        <stop offset="0%" stopColor={c1} />
        <stop offset="40%" stopColor={c2} />
        <stop offset="100%" stopColor={c3} />
      </linearGradient>
      <radialGradient id={`bl-${prefix}-eye-l`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff" />
        <stop offset="100%" stopColor="#F0ECF9" />
      </radialGradient>
      <radialGradient id={`bl-${prefix}-eye-r`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff" />
        <stop offset="100%" stopColor="#F0ECF9" />
      </radialGradient>
    </defs>
  )
}

const MiniBlob = ({ prefix, expr, rotate, style, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 300, damping: 20 }}
    style={{ position: 'absolute', pointerEvents: 'none', lineHeight: 0, ...style }}
  >
    <svg viewBox="0 0 300 300" style={{ width: '100%', height: 'auto' }} aria-hidden="true">
      {blobDefs(prefix)}
      <circle cx="150" cy="150" r="145" fill={`url(#bl-${prefix}-grad)`} />
      <BlobEyes expr={expr} lx={115} rx={185} ey={140} prefix={`bl-${prefix}`} rotate={rotate} />
    </svg>
  </motion.div>
)

const BlobLoader = ({ text = 'Caricamento...', visible = true }) => {
  const { topExpr, bottomExpr } = useExpressions()

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={S.container}
        >
          <MiniBlob prefix="tb" expr={topExpr} rotate={-45} delay={0}
            style={{ top: '-8%', left: '-10%', width: 'clamp(100px, 28vw, 160px)' }} />
          <MiniBlob prefix="tr" expr={bottomExpr} rotate={45} delay={0.05}
            style={{ top: '-8%', right: '-10%', width: 'clamp(110px, 30vw, 170px)' }} />
          <MiniBlob prefix="bl" expr={topExpr} rotate={45} delay={0.1}
            style={{ bottom: '-8%', left: '-10%', width: 'clamp(110px, 30vw, 170px)' }} />
          <MiniBlob prefix="bb" expr={bottomExpr} rotate={-45} delay={0.15}
            style={{ bottom: '-8%', right: '-10%', width: 'clamp(100px, 28vw, 160px)' }} />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 22 }}
            style={S.center}
          >
            <Spinner size="lg" />
            <p style={S.text}>{text}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const S = {
  container: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    overflow: 'hidden',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    zIndex: 2,
  },
  text: {
    margin: 0,
    fontSize: 'clamp(14px, 1.8dvh, 17px)',
    fontWeight: 700,
    color: 'var(--muted)',
  },
}

export default BlobLoader

// Pulsante secondario "link-like" con un piccolo background.
// Usato come CTA secondaria nei footer (es. "Ho un codice", "← Indietro").

import { motion } from 'framer-motion'

const LinkCta = ({ children, onClick, style = {}, ...rest }) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    style={{
      background: 'var(--surface)',
      border: '1.5px solid var(--border-strong)',
      color: 'var(--text)',
      fontWeight: 700,
      fontSize: 'clamp(13px, 1.7dvh, 15px)',
      padding: 'clamp(10px, 1.5dvh, 14px) clamp(18px, 4vw, 26px)',
      borderRadius: 999,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      boxShadow: 'var(--shadow-sm)',
      letterSpacing: '-0.005em',
      ...style,
    }}
    {...rest}
  >
    {children}
  </motion.button>
)

export default LinkCta

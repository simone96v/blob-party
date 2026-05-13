// Bottone tondo per icone / azioni rapide.
// Usato in AppHeader (settings, help), etc.

import { motion } from 'framer-motion'

const SIZES = {
  sm: 'clamp(32px, 4.5dvh, 36px)',
  md: 'clamp(36px, 5.5dvh, 42px)',
  lg: 'clamp(42px, 6dvh, 48px)',
}

const FONTS = {
  sm: 'clamp(13px, 1.7dvh, 15px)',
  md: 'clamp(15px, 2dvh, 18px)',
  lg: 'clamp(17px, 2.3dvh, 20px)',
}

const IconButton = ({
  children,
  onClick,
  ariaLabel,
  size = 'md',
  disabled = false,
  style = {},
  ...rest
}) => {
  const dim = SIZES[size] ?? SIZES.md
  const font = FONTS[size] ?? FONTS.md

  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.92 }}
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        width: dim,
        height: dim,
        borderRadius: '50%',
        fontSize: font,
        cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)',
        padding: 0,
        lineHeight: 1,
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

export default IconButton

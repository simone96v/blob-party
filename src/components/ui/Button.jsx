// Bottone primario riusabile.
// Varianti:
//   primary   → gradiente accent → accent2, testo bianco
//   secondary → bg trasparente, border 1.5px --border, testo --muted
//   danger    → bg --danger, testo bianco
// `width="full"` → larghezza 100%.
// `disabled`    → opacity 0.4 + pointer-events none.
// Animazione: whileTap scale 0.96, transizione spring stiffness 400.

import { motion } from 'framer-motion'
import { haptic } from '../../utils/haptic'

const VARIANT_CLASS = {
  primary:   'text-white',
  secondary: 'text-muted',
  danger:    'bg-danger text-white',
}

const Button = ({
  variant = 'primary',
  width,
  disabled = false,
  onClick,
  children,
  type = 'button',
  className = '',
  style: styleProp,
  ...rest
}) => {
  const widthClass = width === 'full' ? 'w-full' : ''
  const disabledClass = disabled ? 'opacity-40 pointer-events-none' : ''
  const isSecondary = variant === 'secondary'

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : (e) => { haptic.tick(); onClick?.(e) }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400 }}
      className={[
        'inline-flex items-center justify-center font-semibold select-none rounded-sm',
        VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary,
        widthClass,
        disabledClass,
        className,
      ].join(' ')}
      style={{
        height: 'clamp(48px, 7dvh, 64px)',
        padding: '0 clamp(16px, 4vw, 24px)',
        fontSize: 'clamp(14px, 2dvh, 18px)',
        gap: '8px',
        borderRadius: 'var(--radius-sm)',
        background: variant === 'primary'
          ? 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)'
          : isSecondary
            ? 'var(--surface)'
            : undefined,
        color: isSecondary ? 'var(--text)' : undefined,
        border: isSecondary ? '1.5px solid var(--border-strong)' : 'none',
        boxShadow: variant === 'primary'
          ? '0 6px 18px rgba(124, 58, 237, 0.35)'
          : 'none',
        ...styleProp,
      }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

export default Button

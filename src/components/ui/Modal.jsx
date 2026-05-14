// Wrapper modale standard: backdrop blurato + card animata + chiusura ESC/click esterno.
// Tutti i modali dell'app usano questo (AgeModal, QRModal, SettingsModal, HelpModal).

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Modal = ({
  open = false,
  onClose,
  title = null,
  titleEmoji = null,
  children,
  maxWidth = 420,
  showClose = true,
  ariaLabelledBy,
}) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(31, 41, 55, 0.55)',
            backdropFilter: 'blur(6px)',
            padding: 'clamp(16px, 4vw, 28px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth,
              width: '100%',
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              padding: 'clamp(20px, 3dvh, 28px)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              maxHeight: '88dvh',
              overflowY: 'auto',
            }}
          >
            {title && (
              <div style={headerStyle}>
                <h2
                  id={ariaLabelledBy}
                  className="font-bold"
                  style={{ fontSize: 'clamp(18px, 2.5dvh, 22px)', letterSpacing: '-0.01em', margin: 0 }}
                >
                  {titleEmoji && <span style={{ marginRight: 6 }}>{titleEmoji}</span>}
                  {title}
                </h2>
                {showClose && (
                  <motion.button
                    onClick={onClose}
                    aria-label="Chiudi"
                    whileHover={{ scale: 1.1, boxShadow: '0 4px 12px rgba(0,0,0,0.10)' }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    style={closeBtnStyle}
                  >
                    ✕
                  </motion.button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 'clamp(14px, 2dvh, 20px)',
}

const closeBtnStyle = {
  background: 'var(--bg2)',
  border: 'none',
  width: 32,
  height: 32,
  borderRadius: '50%',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

export default Modal

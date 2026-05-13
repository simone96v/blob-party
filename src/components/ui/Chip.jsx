// Chip selezionabile (pill button).
// Usato per opzioni in SettingsModal e altrove.

const Chip = ({ children, active = false, onClick, disabled = false, style = {}, ...rest }) => (
  <button
    type="button"
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    style={{
      padding: '8px 16px',
      borderRadius: 22,
      border: active ? '1.5px solid transparent' : '1.5px solid var(--border-strong)',
      background: active
        ? 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)'
        : 'var(--surface)',
      color: active ? '#fff' : 'var(--text)',
      fontSize: 'clamp(13px, 1.5dvh, 15px)',
      fontWeight: 700,
      cursor: disabled ? 'default' : 'pointer',
      transition: 'all 0.15s',
      boxShadow: active ? '0 4px 12px rgba(124, 58, 237, 0.30)' : 'none',
      opacity: disabled ? 0.5 : 1,
      ...style,
    }}
    {...rest}
  >
    {children}
  </button>
)

export default Chip

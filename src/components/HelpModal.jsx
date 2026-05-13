// Modale tutorial / come si gioca.

import Modal from './ui/Modal'

const STEPS = [
  { icon: '⏱️', title: 'Rispondi in tempo', description: 'Hai pochi secondi per ogni domanda. Sii veloce!' },
  { icon: '🧠', title: 'Punteggio', description: '+10 corretta · −10 sbagliata · −5 se scade il tempo' },
  { icon: '👑', title: "L'host comanda", description: "L'host decide quando passare alla domanda successiva. Stategli simpatici 😅" },
  { icon: '🏆', title: 'Vince il migliore', description: 'Alla fine vince chi ha il punteggio più alto. O il più fortunato 🍀' },
]

const HelpModal = ({ open = false, onClose }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="Come si gioca"
    titleEmoji="❓"
    ariaLabelledBy="help-modal-title"
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.6dvh, 14px)' }}>
      {STEPS.map((s) => (
        <Step key={s.title} icon={s.icon} title={s.title} description={s.description} />
      ))}
    </div>
  </Modal>
)

const Step = ({ icon, title, description }) => (
  <div style={stepStyle}>
    <div style={stepIconStyle}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={stepTitleStyle}>{title}</div>
      <div style={stepDescStyle}>{description}</div>
    </div>
  </div>
)

const stepStyle = {
  display: 'flex',
  gap: 'clamp(10px, 2vw, 14px)',
  padding: 'clamp(12px, 1.8dvh, 16px)',
  background: 'var(--bg2)',
  borderRadius: 'var(--radius-sm)',
  alignItems: 'flex-start',
}

const stepIconStyle = {
  fontSize: 'clamp(24px, 3dvh, 30px)',
  lineHeight: 1,
  flexShrink: 0,
}

const stepTitleStyle = {
  fontSize: 'clamp(14px, 1.8dvh, 16px)',
  fontWeight: 800,
  color: 'var(--text)',
  marginBottom: 3,
}

const stepDescStyle = {
  fontSize: 'clamp(12px, 1.5dvh, 14px)',
  color: 'var(--muted)',
  lineHeight: 1.4,
}

export default HelpModal

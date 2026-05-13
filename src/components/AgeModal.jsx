// Modale 18+ per categorie con ageWarning.

import Modal from './ui/Modal'
import Button from './ui/Button'

const AgeModal = ({ open = false, onConfirm, onCancel }) => (
  <Modal
    open={open}
    onClose={onCancel}
    title="Roba per grandi"
    titleEmoji="🔞"
    showClose={false}
    ariaLabelledBy="age-modal-title"
    maxWidth={380}
  >
    <p
      style={{
        color: 'var(--muted)',
        fontSize: 'clamp(14px, 2dvh, 16px)',
        lineHeight: 1.45,
        marginTop: 0,
        marginBottom: 'clamp(16px, 2.5dvh, 24px)',
      }}
    >
      Qui si entra solo se sai già cosa succede quando si spegne la luce. Hai davvero 18 anni?
      Giura sul tuo drink. 🥂
    </p>
    <div className="flex" style={{ gap: 'clamp(8px, 1.5dvh, 12px)' }}>
      <Button variant="secondary" width="full" onClick={onCancel}>
        Sono innocente
      </Button>
      <Button variant="primary" width="full" onClick={onConfirm}>
        Ho 18+ 😈
      </Button>
    </div>
  </Modal>
)

export default AgeModal

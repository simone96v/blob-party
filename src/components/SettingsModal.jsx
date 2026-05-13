// Modale impostazioni partita (host).
// Domande e durata timer. La categoria viene scelta nella CategoryScreen.

import Modal from './ui/Modal'
import Chip from './ui/Chip'

const NUM_QUESTIONS_OPTIONS = [5, 10, 15, 20]
const TIMER_OPTIONS = [10, 15, 20, 30]

const SettingsModal = ({
  open = false,
  onClose,
  numQuestions,
  setNumQuestions,
  timerDuration,
  setTimerDuration,
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title="Impostazioni"
    titleEmoji="⚙️"
    ariaLabelledBy="settings-modal-title"
  >
    <Section label="Domande">
      {NUM_QUESTIONS_OPTIONS.map((n) => (
        <Chip key={n} active={numQuestions === n} onClick={() => setNumQuestions(n)}>
          {n}
        </Chip>
      ))}
    </Section>

    <Section label="Timer per domanda" last>
      {TIMER_OPTIONS.map((t) => (
        <Chip key={t} active={timerDuration === t} onClick={() => setTimerDuration(t)}>
          {t}s
        </Chip>
      ))}
    </Section>
  </Modal>
)

const Section = ({ label, children, last = false }) => (
  <div style={{ marginBottom: last ? 0 : 'clamp(14px, 2dvh, 18px)' }}>
    <div style={{
      fontSize: 'clamp(11px, 1.4dvh, 13px)',
      color: 'var(--muted)',
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      marginBottom: 'clamp(8px, 1.2dvh, 10px)',
    }}>
      {label}
    </div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {children}
    </div>
  </div>
)

export default SettingsModal

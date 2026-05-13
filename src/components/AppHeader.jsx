// Header standard dell'app: 3 slot orizzontali.
//   leading    | logo Blob Party (centro)    | actions
//   (sinistra)                                  (destra)
//
// Il logo è cliccabile e fa reset session → /.
// I caller passano `leading` (es. back btn host) e `actions` (es. counter/badge).

import { useNavigate } from 'react-router-dom'
import BlobLogo from './ui/BlobLogo'
import { useSession } from '../stores/useSession'

const AppHeader = ({ actions = null, leading = null }) => {
  const navigate = useNavigate()
  const resetSession = useSession((s) => s.resetSession)

  const handleLogoClick = () => {
    resetSession()
    navigate('/', { replace: true })
  }

  return (
    <header className="screen-header" style={{ position: 'relative' }}>
      {/* Slot sinistra (back btn / placeholder) */}
      <div style={slotStyle}>
        {leading || <div style={{ width: 36 }} />}
      </div>

      {/* Logo centrato */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
        <BlobLogo size="md" clickable onClick={handleLogoClick} />
      </div>

      {/* Slot destra (indicatori / actions) */}
      <div style={{ ...slotStyle, marginLeft: 'auto' }}>
        {actions || <div style={{ width: 36 }} />}
      </div>
    </header>
  )
}

const slotStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  zIndex: 1,
}

export default AppHeader

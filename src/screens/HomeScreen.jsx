import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppHeader from '../components/AppHeader'
import ErrorBanner from '../components/ErrorBanner'
import AgeModal from '../components/AgeModal'
import Card from '../components/ui/Card'
import { CATEGORIES } from '../data/categories'
import { useSettings } from '../stores/useSettings'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

const HomeScreen = () => {
  const navigate = useNavigate()
  const [pendingCategory, setPendingCategory] = useState(null)
  const setCategory = useSettings((s) => s.setCategory)
  const ageConfirmed = useSettings((s) => s.ageConfirmed)
  const confirmAge = useSettings((s) => s.confirmAge)

  const handleSelect = (cat) => {
    if (cat.ageWarning && !ageConfirmed) {
      setPendingCategory(cat)
      return
    }
    setCategory(cat.id)
    navigate('/mode')
  }

  const handleAgeConfirm = () => {
    confirmAge()
    if (pendingCategory) {
      setCategory(pendingCategory.id)
      setPendingCategory(null)
      navigate('/mode')
    }
  }

  return (
    <motion.div
      className="screen"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <AppHeader />
      <ErrorBanner />

      {/* Hero */}
      <div style={heroStyle}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={subtitleStyle}
        >
          Scegli la modalita
        </motion.p>
      </div>

      <motion.div
        className="screen-body scrollable-list"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ paddingTop: 0 }}
      >
        {CATEGORIES.map((cat) => (
          <motion.div key={cat.id} variants={itemVariants}>
            <Card onClick={() => handleSelect(cat)}>
              <div className="flex items-center" style={{ gap: 'clamp(10px, 2vw, 16px)' }}>
                <span style={{ fontSize: 'clamp(28px, 5dvh, 40px)' }}>{cat.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div
                    className="font-bold"
                    style={{ fontSize: 'clamp(16px, 2.5dvh, 22px)', color: cat.color }}
                  >
                    {cat.name}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 'clamp(13px, 1.8dvh, 15px)' }}>
                    {cat.tagline}
                  </div>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: 18, opacity: 0.4 }}>&#8250;</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="screen-footer" style={{ justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: 'clamp(11px, 1.3dvh, 13px)', opacity: 0.5 }}>
          GameNight v1.0
        </p>
      </div>

      <AgeModal
        open={!!pendingCategory}
        onConfirm={handleAgeConfirm}
        onCancel={() => setPendingCategory(null)}
      />
    </motion.div>
  )
}

const heroStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '0 clamp(16px, 4vw, 28px) clamp(8px, 1.5dvh, 16px)',
}

const subtitleStyle = {
  color: 'var(--muted)',
  fontSize: 'clamp(13px, 1.8dvh, 16px)',
  letterSpacing: '0.02em',
}

export default HomeScreen

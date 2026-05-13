// Legacy: la scelta categoria è ora in HomeScreen ("/"). Redirect.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const CategoryScreen = () => {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/', { replace: true })
  }, [navigate])
  return null
}

export default CategoryScreen

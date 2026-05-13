// Best-effort: chiude la room quando l'host chiude il tab.
// Usa sendBeacon per inviare la richiesta anche durante unload.

import { useEffect } from 'react'
import { useSession } from '../stores/useSession'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const useHostCleanup = () => {
  const mode = useSession((s) => s.mode)
  const isHost = useSession((s) => s.isHost)
  const roomCode = useSession((s) => s.roomCode)

  useEffect(() => {
    if (mode !== 'online' || !isHost || !roomCode) return

    const handleUnload = () => {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return
      const url = `${SUPABASE_URL}/rest/v1/rooms?code=eq.${roomCode}`
      const body = JSON.stringify({ phase: 'closed', updated_at: new Date().toISOString() })
      const headers = {
        type: 'application/json',
      }
      const blob = new Blob([body], headers)

      // sendBeacon non supporta headers custom, uso fetch keepalive come fallback
      try {
        fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=minimal',
          },
          body,
          keepalive: true,
        })
      } catch {
        // best-effort
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [mode, isHost, roomCode])
}

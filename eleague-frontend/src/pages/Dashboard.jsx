import { useEffect, useState } from 'react'
import PlayerDashboard from './PlayerDashboard'
import OrganizerDashboard from './OrganizerDashboard'

export default function Dashboard() {
  const [mode, setMode] = useState(
    localStorage.getItem('eLeague_mode') || 'player'
  )

  useEffect(() => {
    const handleModeChange = () => {
      setMode(
        localStorage.getItem('eLeague_mode') || 'player'
      )
    }

    window.addEventListener(
      'eLeague-mode-changed',
      handleModeChange
    )

    return () => {
      window.removeEventListener(
        'eLeague-mode-changed',
        handleModeChange
      )
    }
  }, [])

  if (mode === 'organizer') {
    return <OrganizerDashboard />
  }

  return <PlayerDashboard />
}
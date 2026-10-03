import { Navigate } from 'react-router-dom'
import { getUser } from '../services/auth'

function OrganizerRoute({ children }) {
  const user = getUser()

  const mode =
    localStorage.getItem('eLeague_mode') ||
    'player'

  const isOrganizer =
    user?.is_organizer === true ||
    user?.role === 'organizer' ||
    user?.role === 'admin'

  if (!isOrganizer) {
    return (
      <Navigate
        to="/tournaments"
        replace
      />
    )
  }

  if (mode !== 'organizer') {
    return (
      <Navigate
        to="/tournaments"
        replace
      />
    )
  }

  return children
}

export default OrganizerRoute
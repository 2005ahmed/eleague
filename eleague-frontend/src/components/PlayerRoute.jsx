import { Navigate } from 'react-router-dom'
import { getUser } from '../services/auth'

function PlayerRoute({ children }) {
  const user = getUser()

  const mode =
    localStorage.getItem('eLeague_mode') || 'player'

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (mode !== 'player') {
    return (
      <Navigate
        to="/tournaments"
        replace
      />
    )
  }

  return children
}

export default PlayerRoute
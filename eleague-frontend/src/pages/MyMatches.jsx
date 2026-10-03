import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Swords,
  Trophy,
  Clock,
  CheckCircle,
  ArrowRight,
  Gamepad2,
} from 'lucide-react'
import api from '../services/api'

function MyMatches() {
  const navigate = useNavigate()

  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/my-matches')

      setMatches(response.data.matches ?? [])
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
        'Impossible de récupérer vos matchs.'
      )
    } finally {
      setLoading(false)
    }
  }

  const getPlayerName = (player) => {
    if (!player) return 'TBD'

    return (
      player.nickname ||
      player.user?.name ||
      'Player'
    )
  }

  const currentPlayer = JSON.parse(
    localStorage.getItem('player')
  )

  const getOpponent = (match) => {
    if (!currentPlayer) return null

    if (match.player1_id === currentPlayer.id) {
      return match.player2
    }

    return match.player1
  }

  const getMyScore = (match) => {
    if (!currentPlayer) return '-'

    if (match.player1_id === currentPlayer.id) {
      return match.player1_score
    }

    return match.player2_score
  }

  const getOpponentScore = (match) => {
    if (!currentPlayer) return '-'

    if (match.player1_id === currentPlayer.id) {
      return match.player2_score
    }

    return match.player1_score
  }

  const isWinner = (match) => {
    return match.winner_id === currentPlayer?.id
  }

  const isCompleted = (match) => {
    return match.status === 'completed'
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">

          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />

          <p className="text-gray-400 mt-4">
            Loading your matches...
          </p>

        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <Swords
              size={25}
              className="text-blue-400"
            />
          </div>

          <div>

            <h1 className="text-3xl font-bold">
              My Matches
            </h1>

            <p className="text-gray-500 mt-1">
              Follow your tournament matches
            </p>

          </div>

        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <p className="text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* Empty */}
      {!error && matches.length === 0 && (
        <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-10 text-center">

          <Swords
            size={45}
            className="mx-auto text-gray-600"
          />

          <h2 className="text-xl font-semibold mt-4">
            No matches yet
          </h2>

          <p className="text-gray-500 mt-2">
            You don't have any matches at the moment.
          </p>

          <button
            onClick={() => navigate('/tournaments')}
            className="mt-5 bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-semibold transition"
          >
            Browse Tournaments
          </button>

        </div>
      )}

      {/* Matches */}
      <div className="space-y-4">

        {matches.map((match) => {

          const opponent = getOpponent(match)
          const myScore = getMyScore(match)
          const opponentScore =
            getOpponentScore(match)

          return (
            <div
              key={match.id}
              className="bg-[#0d0f15] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition"
            >

              {/* Tournament header */}
              <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                <div className="flex items-center gap-3">

                  <Trophy
                    size={18}
                    className="text-yellow-400"
                  />

                  <div>

                    <p className="font-semibold">
                      {match.tournament?.name ||
                        'Tournament'}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {match.tournament?.game?.name ||
                        'Football Game'}
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-2">

                  {isCompleted(match) ? (
                    <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
                      <CheckCircle size={14} />
                      Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                      <Clock size={14} />
                      Scheduled
                    </span>
                  )}

                </div>

              </div>

              {/* Match body */}
              <div className="p-5">

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">

                  {/* Me */}
                  <div className="text-center">

                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                      {(
                        currentPlayer?.nickname ||
                        'P'
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <p className="font-semibold mt-3">
                      {currentPlayer?.nickname ||
                        'You'}
                    </p>

                    {isWinner(match) && (
                      <p className="text-xs text-green-400 mt-1">
                        Winner
                      </p>
                    )}

                  </div>

                  {/* Score */}
                  <div className="text-center">

                    <p className="text-xs text-gray-600 uppercase mb-2">
                      Round {match.round}
                    </p>

                    <div className="flex items-center gap-3">

                      <span className="text-3xl font-black">
                        {isCompleted(match)
                          ? myScore
                          : '-'}
                      </span>

                      <span className="text-gray-600">
                        :
                      </span>

                      <span className="text-3xl font-black">
                        {isCompleted(match)
                          ? opponentScore
                          : '-'}
                      </span>

                    </div>

                  </div>

                  {/* Opponent */}
                  <div className="text-center">

                    <div className="w-12 h-12 mx-auto rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-400">
                      {(
                        getPlayerName(opponent)
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <p className="font-semibold mt-3">
                      {getPlayerName(opponent)}
                    </p>

                  </div>

                </div>

                {/* Button */}
                <div className="mt-6 flex justify-end">

                  <button
                    onClick={() =>
                      navigate(`/matches/${match.id}`)
                    }
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    View Match
                    <ArrowRight size={16} />
                  </button>

                </div>

              </div>

            </div>
          )
        })}

      </div>

    </div>
  )
}

export default MyMatches

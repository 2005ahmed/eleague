import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Trophy,
  Users,
  Plus,
} from 'lucide-react'

import api from '../services/api'
import { getUser } from '../services/auth'

function Tournaments() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  const user = getUser()

  const mode =
    localStorage.getItem('eLeague_mode') || 'player'

  const isOrganizer =
    user?.is_organizer === true ||
    user?.role === 'organizer' ||
    user?.role === 'admin'

  const canCreateTournament =
    mode === 'organizer' && isOrganizer

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response =
          await api.get('/tournaments')

        setTournaments(
          response.data.data ??
            response.data ??
            []
        )
      } catch (error) {
        console.error(
          'Error fetching tournaments:',
          error
        )
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  if (loading) {
    return (
      <div className="text-gray-400">
        Loading tournaments...
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold">
            Tournaments
          </h1>

          <p className="text-gray-500 mt-1">
            Discover and join esports tournaments.
          </p>
        </div>

        {/* =================================================
            CREATE TOURNAMENT
        ================================================= */}

        {canCreateTournament && (
          <button
            onClick={() =>
              navigate('/tournaments/create')
            }
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition"
          >
            <Plus size={19} />

            Create Tournament
          </button>
        )}
      </div>

      {/* =====================================================
          TOURNAMENTS GRID
      ===================================================== */}

      {tournaments.length === 0 ? (
        <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Trophy
              size={26}
              className="text-blue-500"
            />
          </div>

          <h2 className="text-lg font-semibold mt-4">
            No tournaments found
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            There are currently no tournaments available.
          </p>

          {canCreateTournament && (
            <button
              onClick={() =>
                navigate(
                  '/tournaments/create'
                )
              }
              className="mt-5 inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition"
            >
              <Plus size={18} />

              Create Tournament
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {tournaments.map(
            (tournament) => (
              <div
                key={tournament.id}
                className="bg-[#0d0f15] border border-white/10 rounded-2xl p-5 hover:border-blue-500/40 transition"
              >

                {/* =================================================
                    TOP
                ================================================= */}

                <div className="flex items-center justify-between">

                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Trophy className="text-blue-500" />
                  </div>

                  <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 capitalize">
                    {tournament.status}
                  </span>

                </div>

                {/* =================================================
                    NAME
                ================================================= */}

                <h2 className="text-xl font-semibold mt-5">
                  {tournament.name}
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  {tournament.game?.name ||
                    'Unknown Game'}
                </p>

                {/* =================================================
                    INFO
                ================================================= */}

                <div className="flex justify-between mt-6 text-sm">

                  <div className="flex items-center gap-2 text-gray-400">
                    <Users size={17} />

                    {tournament.max_players ||
                      0}{' '}
                    Players
                  </div>

                  <div>
                    <span className="text-gray-500">
                      Prize
                    </span>

                    <span className="ml-2 font-semibold text-green-400">
                      $
                      {tournament.prize ||
                        '0.00'}
                    </span>
                  </div>

                </div>

                {/* =================================================
                    VIEW BUTTON
                ================================================= */}

                <button
                  onClick={() =>
                    navigate(
                      `/tournaments/${tournament.id}`
                    )
                  }
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition"
                >
                  View Tournament
                </button>

              </div>
            )
          )}

        </div>
      )}

    </div>
  )
}

export default Tournaments
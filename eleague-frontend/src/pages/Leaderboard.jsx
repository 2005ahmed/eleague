import { useEffect, useState } from 'react'
import {
  Trophy,
  Medal,
  Crown,
  Swords,
  Target,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import api from '../services/api'

export default function Leaderboard() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/leaderboard')
        setPlayers(response.data.leaderboard || [])
      } catch (err) {
        console.error(err)
        setError('Impossible de charger le classement.')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  const getRankStyle = (rank) => {
    if (rank === 1) {
      return 'border-yellow-400/40 bg-yellow-400/10'
    }

    if (rank === 2) {
      return 'border-slate-300/30 bg-slate-300/10'
    }

    if (rank === 3) {
      return 'border-orange-400/30 bg-orange-400/10'
    }

    return 'border-white/10 bg-white/[0.03]'
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />

    return (
      <span className="text-sm font-bold text-gray-400">
        #{rank}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          Chargement du classement...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-400">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-yellow-400/10 border border-yellow-400/20">
            <Trophy className="w-7 h-7 text-yellow-400" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white">
              Leaderboard
            </h1>

            <p className="text-gray-400 mt-1">
              Les meilleurs joueurs de eLeague
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 */}
      {players.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {players.slice(0, 3).map((player) => (
            <div
              key={player.player_id}
              className={`rounded-3xl border p-6 ${getRankStyle(
                player.rank
              )}`}
            >
              <div className="flex justify-between items-start">

                <div className="flex items-center gap-3">
                  {getRankIcon(player.rank)}

                  <div>
                    <h2 className="font-bold text-white text-lg">
                      {player.nickname}
                    </h2>

                    <p className="text-xs text-gray-500">
                      {player.name || 'Player'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-white">
                    {player.points}
                  </p>

                  <p className="text-xs text-gray-500">
                    points
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6">

                <div className="rounded-xl bg-black/20 p-3">
                  <p className="text-xs text-gray-500">
                    Matchs
                  </p>
                  <p className="font-bold text-white mt-1">
                    {player.matches}
                  </p>
                </div>

                <div className="rounded-xl bg-black/20 p-3">
                  <p className="text-xs text-gray-500">
                    Victoires
                  </p>
                  <p className="font-bold text-green-400 mt-1">
                    {player.wins}
                  </p>
                </div>

                <div className="rounded-xl bg-black/20 p-3">
                  <p className="text-xs text-gray-500">
                    Win Rate
                  </p>
                  <p className="font-bold text-blue-400 mt-1">
                    {player.win_rate}%
                  </p>
                </div>

              </div>
            </div>
          ))}

        </div>
      )}

      {/* Full leaderboard */}
      <div className="rounded-3xl border border-white/10 bg-[#111827]/70 overflow-hidden">

        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-400" />

            <div>
              <h2 className="text-xl font-bold text-white">
                Classement général
              </h2>

              <p className="text-sm text-gray-500">
                3 points par victoire
              </p>
            </div>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">

          <table className="w-full">

            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-6 py-4 text-xs uppercase text-gray-500">
                  #
                </th>

                <th className="px-6 py-4 text-xs uppercase text-gray-500">
                  Joueur
                </th>

                <th className="px-6 py-4 text-xs uppercase text-gray-500">
                  Matchs
                </th>

                <th className="px-6 py-4 text-xs uppercase text-gray-500">
                  Victoires
                </th>

                <th className="px-6 py-4 text-xs uppercase text-gray-500">
                  Défaites
                </th>

                <th className="px-6 py-4 text-xs uppercase text-gray-500">
                  Win Rate
                </th>

                <th className="px-6 py-4 text-xs uppercase text-gray-500 text-right">
                  Points
                </th>
              </tr>
            </thead>

            <tbody>
              {players.map((player) => (
                <tr
                  key={player.player_id}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition"
                >
                  <td className="px-6 py-5">
                    {getRankIcon(player.rank)}
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <span className="font-bold text-blue-400">
                          {player.nickname?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <p className="font-semibold text-white">
                          {player.nickname}
                        </p>

                        <p className="text-xs text-gray-500">
                          {player.name || 'Player'}
                        </p>
                      </div>

                    </div>
                  </td>

                  <td className="px-6 py-5 text-gray-300">
                    {player.matches}
                  </td>

                  <td className="px-6 py-5 text-green-400 font-semibold">
                    {player.wins}
                  </td>

                  <td className="px-6 py-5 text-red-400 font-semibold">
                    {player.losses}
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">

                      <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              player.win_rate,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="text-sm text-gray-300">
                        {player.win_rate}%
                      </span>

                    </div>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <span className="font-black text-white">
                      {player.points}
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-white/5">

          {players.map((player) => (
            <div
              key={player.player_id}
              className="p-5"
            >
              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="w-9 flex justify-center">
                    {getRankIcon(player.rank)}
                  </div>

                  <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <span className="font-bold text-blue-400">
                      {player.nickname?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <p className="font-semibold text-white">
                      {player.nickname}
                    </p>

                    <p className="text-xs text-gray-500">
                      {player.matches} matchs
                    </p>
                  </div>

                </div>

                <div className="text-right">
                  <p className="font-black text-white">
                    {player.points}
                  </p>

                  <p className="text-xs text-gray-500">
                    points
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">

                <div className="bg-white/[0.03] rounded-xl p-3">
                  <p className="text-xs text-gray-500">
                    W
                  </p>
                  <p className="font-bold text-green-400">
                    {player.wins}
                  </p>
                </div>

                <div className="bg-white/[0.03] rounded-xl p-3">
                  <p className="text-xs text-gray-500">
                    L
                  </p>
                  <p className="font-bold text-red-400">
                    {player.losses}
                  </p>
                </div>

                <div className="bg-white/[0.03] rounded-xl p-3">
                  <p className="text-xs text-gray-500">
                    WR
                  </p>
                  <p className="font-bold text-blue-400">
                    {player.win_rate}%
                  </p>
                </div>

              </div>

            </div>
          ))}

        </div>

        {players.length === 0 && (
          <div className="p-12 text-center">
            <Swords className="w-10 h-10 text-gray-600 mx-auto mb-3" />

            <p className="text-gray-400">
              Aucun joueur dans le classement.
            </p>
          </div>
        )}

      </div>

    </div>
  )
}
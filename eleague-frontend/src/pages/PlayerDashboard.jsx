import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Trophy,
  Gamepad2,
  Target,
  TrendingUp,
  ArrowRight,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import api from '../services/api'

export default function PlayerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)

        const response = await api.get('/dashboard')

        setData(response.data)
        setError('')
      } catch (err) {
        console.error(err)

        setError(
          err.response?.data?.message ||
            'Impossible de charger le dashboard.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />

          <p>Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />

          <h2 className="text-lg font-semibold text-white mb-2">
            Erreur
          </h2>

          <p className="text-sm text-red-300">
            {error}
          </p>
        </div>
      </div>
    )
  }

  const player = data?.player
  const stats = data?.stats || {}
  const upcomingMatch = data?.upcoming_match
  const recentMatches = data?.recent_matches || []
  const tournaments = data?.tournaments || []

  const getOpponent = (match) => {
    if (!player) return null

    if (match.player1_id === player.id) {
      return match.player2
    }

    return match.player1
  }

  const getMyScore = (match) => {
    if (match.player1_id === player?.id) {
      return match.player1_score
    }

    return match.player2_score
  }

  const getOpponentScore = (match) => {
    if (match.player1_id === player?.id) {
      return match.player2_score
    }

    return match.player1_score
  }

  const getMatchResult = (match) => {
    if (match.winner_id === player?.id) {
      return 'win'
    }

    return 'loss'
  }

  const formatStatus = (status) => {
    const statuses = {
      registration: 'Inscriptions',
      in_progress: 'En cours',
      completed: 'Terminé',
      draft: 'Brouillon',
      cancelled: 'Annulé',
    }

    return statuses[status] || status
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-sm text-cyan-400 font-medium mb-1">
            eLeague
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold">
            Bienvenue, {player?.nickname || 'Player'} 👋
          </h1>

          <p className="text-slate-400 mt-2">
            Voici un aperçu de tes performances et de tes tournois.
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Tournois"
            value={stats.tournaments ?? 0}
          />

          <StatCard
            icon={<Gamepad2 className="w-5 h-5" />}
            label="Matchs"
            value={stats.matches ?? 0}
          />

          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Victoires"
            value={stats.wins ?? 0}
          />

          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Win Rate"
            value={`${stats.win_rate ?? 0}%`}
          />

        </div>

        {/* UPCOMING MATCH */}
        <section className="mb-8">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold">
              Prochain match
            </h2>
          </div>

          {upcomingMatch ? (
            <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-5 sm:p-7">

              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full" />

              <div className="relative">

                <div className="flex flex-wrap items-center gap-2 mb-6">

                  <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs text-cyan-300">
                    <Gamepad2 className="w-3.5 h-3.5" />

                    {upcomingMatch.tournament?.game?.name ||
                      'Game'}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    <Clock className="w-3.5 h-3.5" />

                    Round {upcomingMatch.round}
                  </span>

                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">

                  {/* PLAYER 1 */}
                  <div className="text-center">

                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg sm:text-2xl font-bold">
                        {upcomingMatch.player1?.nickname
                          ?.charAt(0)
                          ?.toUpperCase() || '?'}
                      </span>
                    </div>

                    <p className="font-semibold text-sm sm:text-base truncate">
                      {upcomingMatch.player1?.nickname ||
                        'TBD'}
                    </p>

                  </div>

                  {/* VS */}
                  <div className="text-center">
                    <span className="text-xl sm:text-3xl font-black text-cyan-400">
                      VS
                    </span>
                  </div>

                  {/* PLAYER 2 */}
                  <div className="text-center">

                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg sm:text-2xl font-bold">
                        {upcomingMatch.player2?.nickname
                          ?.charAt(0)
                          ?.toUpperCase() || '?'}
                      </span>
                    </div>

                    <p className="font-semibold text-sm sm:text-base truncate">
                      {upcomingMatch.player2?.nickname ||
                        'TBD'}
                    </p>

                  </div>

                </div>

                <div className="mt-7 flex justify-center">

                  <Link
                    to={`/matches/${upcomingMatch.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-5 py-3 transition"
                  >
                    Voir le match

                    <ArrowRight className="w-4 h-4" />
                  </Link>

                </div>

              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">

              <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />

              <h3 className="font-semibold text-slate-200">
                Aucun match à venir
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Tu n'as pas encore de match programmé.
              </p>

              <Link
                to="/tournaments"
                className="inline-flex items-center gap-2 mt-5 text-sm font-medium text-cyan-400 hover:text-cyan-300"
              >
                Voir les tournois

                <ArrowRight className="w-4 h-4" />
              </Link>

            </div>
          )}

        </section>

        {/* RECENT + TOURNAMENTS */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* RECENT MATCHES */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">

              <div>
                <h2 className="font-bold">
                  Matchs récents
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Tes dernières performances
                </p>
              </div>

              <Link
                to="/matches"
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Voir tout
              </Link>

            </div>

            {recentMatches.length > 0 ? (
              <div className="divide-y divide-slate-800">

                {recentMatches.map((match) => {

                  const result = getMatchResult(match)
                  const opponent = getOpponent(match)

                  return (
                    <Link
                      key={match.id}
                      to={`/matches/${match.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-800/40 transition"
                    >

                      <div className="flex items-center gap-3 min-w-0">

                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            result === 'win'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {result === 'win' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0">

                          <p className="text-sm font-semibold truncate">
                            vs {opponent?.nickname || 'Unknown'}
                          </p>

                          <p className="text-xs text-slate-500 truncate">
                            {match.tournament?.name ||
                              'Tournament'}
                          </p>

                        </div>

                      </div>

                      <div className="text-right shrink-0">

                        <p className="font-bold">
                          {getMyScore(match)} -{' '}
                          {getOpponentScore(match)}
                        </p>

                        <p
                          className={`text-xs ${
                            result === 'win'
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {result === 'win'
                            ? 'Victoire'
                            : 'Défaite'}
                        </p>

                      </div>

                    </Link>
                  )
                })}

              </div>
            ) : (
              <div className="p-8 text-center">

                <Target className="w-8 h-8 text-slate-700 mx-auto mb-3" />

                <p className="text-sm text-slate-500">
                  Aucun match terminé.
                </p>

              </div>
            )}

          </section>

          {/* MY TOURNAMENTS */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">

              <div>
                <h2 className="font-bold">
                  Mes tournois
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Les compétitions auxquelles tu participes
                </p>
              </div>

              <Link
                to="/tournaments"
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Explorer
              </Link>

            </div>

            {tournaments.length > 0 ? (
              <div className="divide-y divide-slate-800">

                {tournaments.slice(0, 5).map((tournament) => (

                  <Link
                    key={tournament.id}
                    to={`/tournaments/${tournament.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/40 transition"
                  >

                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="font-semibold text-sm truncate">
                        {tournament.name}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {tournament.game?.name || 'Game'}
                      </p>

                    </div>

                    <div className="text-right shrink-0">

                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-300">
                        {formatStatus(tournament.status)}
                      </span>

                    </div>

                  </Link>

                ))}

              </div>
            ) : (
              <div className="p-8 text-center">

                <Trophy className="w-8 h-8 text-slate-700 mx-auto mb-3" />

                <p className="text-sm text-slate-500">
                  Tu ne participes à aucun tournoi.
                </p>

                <Link
                  to="/tournaments"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Rejoindre un tournoi

                  <ArrowRight className="w-4 h-4" />
                </Link>

              </div>
            )}

          </section>

        </div>

        {/* QUICK ACTIONS */}
        <section className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <Link
            to="/tournaments"
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-cyan-500/30 transition"
          >

            <Trophy className="w-6 h-6 text-cyan-400 mb-4" />

            <h3 className="font-semibold">
              Explorer les tournois
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Trouve une compétition et inscris-toi.
            </p>

            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 mt-4 transition" />

          </Link>

          <Link
            to="/matches"
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-cyan-500/30 transition"
          >

            <Gamepad2 className="w-6 h-6 text-cyan-400 mb-4" />

            <h3 className="font-semibold">
              Mes matchs
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Consulte tes matchs et leurs résultats.
            </p>

            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 mt-4 transition" />

          </Link>

          <Link
            to="/tournaments"
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-cyan-500/30 transition"
          >

            <CalendarDays className="w-6 h-6 text-cyan-400 mb-4" />

            <h3 className="font-semibold">
              Prochains tournois
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Découvre les prochaines compétitions.
            </p>

            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 mt-4 transition" />

          </Link>

        </section>

      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">

      <div className="flex items-center justify-between mb-4">

        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
          {icon}
        </div>

      </div>

      <p className="text-2xl sm:text-3xl font-bold">
        {value}
      </p>

      <p className="text-sm text-slate-500 mt-1">
        {label}
      </p>

    </div>
  )
}
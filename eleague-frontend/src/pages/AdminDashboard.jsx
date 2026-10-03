import { useEffect, useState } from 'react'
import {
  Users,
  Trophy,
  Swords,
  Flag,
  ClipboardCheck,
  AlertTriangle,
  Gamepad2,
  Activity,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import api from '../services/api'

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
}) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/10',
    green: 'bg-green-500/10 text-green-400 border-green-500/10',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/10',
    red: 'bg-red-500/10 text-red-400 border-red-500/10',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/10',
  }

  return (
    <div className="bg-[#11141c] border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h3 className="text-3xl font-black mt-2">
            {value}
          </h3>

          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center border ${colors[color]}`}
        >
          <Icon size={21} />
        </div>

      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    draft:
      'bg-gray-500/10 text-gray-400',
    registration:
      'bg-blue-500/10 text-blue-400',
    in_progress:
      'bg-yellow-500/10 text-yellow-400',
    completed:
      'bg-green-500/10 text-green-400',
    cancelled:
      'bg-red-500/10 text-red-400',
  }

  const labels = {
    draft: 'Draft',
    registration: 'Registration',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
        styles[status] ||
        'bg-white/5 text-gray-400'
      }`}
    >
      {labels[status] || status}
    </span>
  )
}

function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = async () => {
    try {
      setLoading(true)

      const response = await api.get(
        '/admin/dashboard'
      )

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

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-gray-400">
          Chargement du dashboard...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-red-400">
        {error}
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="space-y-8">

      {/* =========================
          Header
      ========================= */}

      <div>
        <p className="text-sm text-blue-400 font-medium mb-2">
          Administration
        </p>

        <h1 className="text-3xl sm:text-4xl font-black">
          Admin Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          Vue globale de la plateforme eLeague.
        </p>
      </div>

      {/* =========================
          Main Stats
      ========================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          title="Utilisateurs"
          value={stats?.users?.total || 0}
          subtitle={`${stats?.users?.players || 0} joueurs`}
          icon={Users}
          color="blue"
        />

        <StatCard
          title="Tournois"
          value={stats?.tournaments?.total || 0}
          subtitle={`${stats?.tournaments?.active || 0} actifs`}
          icon={Trophy}
          color="purple"
        />

        <StatCard
          title="Matchs"
          value={stats?.matches?.total || 0}
          subtitle={`${stats?.matches?.completed || 0} terminés`}
          icon={Swords}
          color="green"
        />

        <StatCard
          title="Jeux"
          value={stats?.games?.total || 0}
          subtitle={`${stats?.games?.active || 0} actifs`}
          icon={Gamepad2}
          color="yellow"
        />

      </div>

      {/* =========================
          Attention Cards
      ========================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-[#11141c] border border-yellow-500/10 rounded-2xl p-5">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
              <ClipboardCheck size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Résultats en attente
              </p>

              <p className="text-2xl font-black">
                {stats?.results?.pending || 0}
              </p>
            </div>

          </div>

        </div>

        <div className="bg-[#11141c] border border-red-500/10 rounded-2xl p-5">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Reports en attente
              </p>

              <p className="text-2xl font-black">
                {stats?.reports?.pending || 0}
              </p>
            </div>

          </div>

        </div>

        <div className="bg-[#11141c] border border-green-500/10 rounded-2xl p-5">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Tournois terminés
              </p>

              <p className="text-2xl font-black">
                {stats?.tournaments?.completed || 0}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* =========================
          Overview
      ========================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Tournaments */}

        <div className="bg-[#11141c] border border-white/10 rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Trophy size={20} />
            </div>

            <div>
              <h2 className="font-bold">
                Tournois
              </h2>

              <p className="text-xs text-gray-500">
                État des tournois
              </p>
            </div>

          </div>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span className="text-gray-400">
                Draft
              </span>

              <span className="font-bold">
                {stats?.tournaments?.draft || 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Actifs
              </span>

              <span className="font-bold text-blue-400">
                {stats?.tournaments?.active || 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Terminés
              </span>

              <span className="font-bold text-green-400">
                {stats?.tournaments?.completed || 0}
              </span>
            </div>

          </div>

        </div>

        {/* Reports */}

        <div className="bg-[#11141c] border border-white/10 rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <Flag size={20} />
            </div>

            <div>
              <h2 className="font-bold">
                Reports
              </h2>

              <p className="text-xs text-gray-500">
                État des signalements
              </p>
            </div>

          </div>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span className="text-gray-400">
                Pending
              </span>

              <span className="font-bold text-red-400">
                {stats?.reports?.pending || 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Resolved
              </span>

              <span className="font-bold text-green-400">
                {stats?.reports?.resolved || 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Rejected
              </span>

              <span className="font-bold text-gray-400">
                {stats?.reports?.rejected || 0}
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* =========================
          Recent Users
      ========================= */}

      <div className="bg-[#11141c] border border-white/10 rounded-2xl overflow-hidden">

        <div className="p-6 border-b border-white/10">

          <h2 className="font-bold">
            Derniers utilisateurs
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            Les derniers comptes créés
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-white/10">

                <th className="px-6 py-4">
                  Utilisateur
                </th>

                <th className="px-6 py-4">
                  Email
                </th>

                <th className="px-6 py-4">
                  Rôle
                </th>

                <th className="px-6 py-4">
                  Date
                </th>

              </tr>
            </thead>

            <tbody>

              {data?.recent_users?.map(
                (user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/[0.02]"
                  >

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                          {user.name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <span className="font-medium">
                          {user.name}
                        </span>

                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.email}
                    </td>

                    <td className="px-6 py-4">

                      <span className="px-2.5 py-1 rounded-lg bg-white/5 text-xs">
                        {user.role}
                      </span>

                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(
                        user.created_at
                      ).toLocaleDateString(
                        'fr-FR'
                      )}
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =========================
          Recent Tournaments
      ========================= */}

      <div className="bg-[#11141c] border border-white/10 rounded-2xl overflow-hidden">

        <div className="p-6 border-b border-white/10">

          <h2 className="font-bold">
            Derniers tournois
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            Les derniers tournois créés
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-white/10">

                <th className="px-6 py-4">
                  Tournoi
                </th>

                <th className="px-6 py-4">
                  Jeu
                </th>

                <th className="px-6 py-4">
                  Organisateur
                </th>

                <th className="px-6 py-4">
                  Joueurs
                </th>

                <th className="px-6 py-4">
                  Statut
                </th>

              </tr>
            </thead>

            <tbody>

              {data?.recent_tournaments?.map(
                (tournament) => (
                  <tr
                    key={tournament.id}
                    className="border-b border-white/5 hover:bg-white/[0.02]"
                  >

                    <td className="px-6 py-4">

                      <div className="font-medium">
                        {tournament.name}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        #{tournament.id}
                      </div>

                    </td>

                    <td className="px-6 py-4 text-sm text-gray-400">
                      {tournament.game?.name ||
                        'Unknown'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-400">
                      {tournament.organizer?.name ||
                        'Unknown'}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {tournament.max_players}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge
                        status={
                          tournament.status
                        }
                      />
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}

export default AdminDashboard
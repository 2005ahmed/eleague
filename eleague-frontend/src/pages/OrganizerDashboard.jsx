import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Trophy,
  Plus,
  FileText,
  Users,
  PlayCircle,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
  Loader2,
  AlertCircle,
  CalendarDays,
  Gamepad2,
  Eye,
} from 'lucide-react'
import api from '../services/api'

export default function OrganizerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)

        const response = await api.get('/organizer/dashboard')

        setData(response.data)
        setError('')
      } catch (err) {
        console.error(err)

        setError(
          err.response?.data?.message ||
            'Impossible de charger le dashboard organisateur.'
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

          <p>Chargement du dashboard organisateur...</p>
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

  const organizer = data?.organizer
  const stats = data?.stats || {}
  const tournaments = data?.tournaments || []

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 lg:px-8 py-6">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

          <div>

            <p className="text-sm text-cyan-400 font-medium mb-1">
              eLeague • Organizer
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold">
              Bienvenue, {organizer?.name || 'Organizer'} 👋
            </h1>

            <p className="text-slate-400 mt-2">
              Gère tes tournois, les inscriptions et les résultats.
            </p>

          </div>

          <Link
            to="/tournaments/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-5 py-3 transition"
          >
            <Plus className="w-5 h-5" />

            Créer un tournoi
          </Link>

        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">

          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Tournois"
            value={stats.total_tournaments ?? 0}
          />

          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Brouillons"
            value={stats.drafts ?? 0}
          />

          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Inscriptions"
            value={stats.registration ?? 0}
          />

          <StatCard
            icon={<PlayCircle className="w-5 h-5" />}
            label="En cours"
            value={stats.in_progress ?? 0}
          />

          <StatCard
            icon={<ClipboardCheck className="w-5 h-5" />}
            label="À vérifier"
            value={stats.pending_results ?? 0}
          />

          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Reports"
            value={stats.pending_reports ?? 0}
          />

        </div>

        {/* QUICK ACTIONS */}
        <section className="mb-8">

          <h2 className="text-lg font-bold mb-4">
            Actions rapides
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <QuickAction
              to="/tournaments/create"
              icon={<Plus className="w-6 h-6" />}
              title="Créer un tournoi"
              description="Lance une nouvelle compétition."
            />

            <QuickAction
              to="/organizer/results"
              icon={<ClipboardCheck className="w-6 h-6" />}
              title="Vérifier les résultats"
              description="Consulte les résultats en attente."
              badge={stats.pending_results}
            />

            <QuickAction
              to="/reports"
              icon={<AlertTriangle className="w-6 h-6" />}
              title="Voir les reports"
              description="Gère les problèmes signalés."
              badge={stats.pending_reports}
            />

          </div>

        </section>

        {/* TOURNAMENTS */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">

            <div>

              <h2 className="font-bold">
                Mes tournois
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Les derniers tournois que tu organises
              </p>

            </div>

            <Link
              to="/tournaments"
              className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              Voir tout

              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

          </div>

          {tournaments.length > 0 ? (
            <div className="divide-y divide-slate-800">

              {tournaments.slice(0, 8).map((tournament) => (

                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-slate-800/40 transition"
                >

                  {/* ICON */}
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">

                    <Trophy className="w-5 h-5" />

                  </div>

                  {/* NAME */}
                  <div className="min-w-0 flex-1">

                    <p className="font-semibold truncate">
                      {tournament.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-1">

                      <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                        <Gamepad2 className="w-3.5 h-3.5" />

                        {tournament.game?.name || 'Game'}
                      </span>

                      <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />

                        {tournament.registered_players ?? 0}/
                        {tournament.max_players ?? 0}
                      </span>

                      {tournament.start_date && (
                        <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />

                          {formatDate(tournament.start_date)}
                        </span>
                      )}

                    </div>

                  </div>

                  {/* STATUS */}
                  <div className="flex items-center gap-3 shrink-0">

                    <StatusBadge
                      status={tournament.status}
                    />

                    <Eye className="w-4 h-4 text-slate-600" />

                  </div>

                </Link>

              ))}

            </div>
          ) : (
            <div className="p-10 text-center">

              <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />

              <h3 className="font-semibold text-slate-300">
                Aucun tournoi
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Tu n'as pas encore créé de tournoi.
              </p>

              <Link
                to="/tournaments/create"
                className="inline-flex items-center gap-2 mt-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2.5 transition"
              >
                <Plus className="w-4 h-4" />

                Créer mon premier tournoi
              </Link>

            </div>
          )}

        </section>

        {/* BOTTOM ACTIONS */}
        <section className="mt-6 grid sm:grid-cols-2 gap-4">

          <Link
            to="/organizer/results"
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-cyan-500/30 transition"
          >

            <ClipboardCheck className="w-6 h-6 text-cyan-400 mb-4" />

            <div className="flex items-center justify-between">

              <h3 className="font-semibold">
                Vérification des résultats
              </h3>

              {Number(stats.pending_results || 0) > 0 && (
                <span className="rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 text-xs">
                  {stats.pending_results}
                </span>
              )}

            </div>

            <p className="text-sm text-slate-500 mt-1">
              Vérifie et valide les résultats soumis par les joueurs.
            </p>

            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 mt-4 transition" />

          </Link>

          <Link
            to="/reports"
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-red-500/30 transition"
          >

            <AlertTriangle className="w-6 h-6 text-red-400 mb-4" />

            <div className="flex items-center justify-between">

              <h3 className="font-semibold">
                Reports
              </h3>

              {Number(stats.pending_reports || 0) > 0 && (
                <span className="rounded-full bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 text-xs">
                  {stats.pending_reports}
                </span>
              )}

            </div>

            <p className="text-sm text-slate-500 mt-1">
              Consulte les problèmes signalés sur tes tournois.
            </p>

            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 mt-4 transition" />

          </Link>

        </section>

      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">

      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
        {icon}
      </div>

      <p className="text-2xl font-bold">
        {value}
      </p>

      <p className="text-xs text-slate-500 mt-1">
        {label}
      </p>

    </div>
  )
}

function QuickAction({
  to,
  icon,
  title,
  description,
  badge,
}) {
  return (
    <Link
      to={to}
      className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-cyan-500/30 transition"
    >

      {Number(badge || 0) > 0 && (
        <span className="absolute top-4 right-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-1 text-xs">
          {badge}
        </span>
      )}

      <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
        {icon}
      </div>

      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-1">
        {description}
      </p>

      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 mt-4 transition" />

    </Link>
  )
}

function StatusBadge({ status }) {
  const statuses = {
    draft: {
      label: 'Brouillon',
      className:
        'bg-slate-800 text-slate-300 border-slate-700',
    },

    registration: {
      label: 'Inscriptions',
      className:
        'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    },

    in_progress: {
      label: 'En cours',
      className:
        'bg-amber-500/10 text-amber-300 border-amber-500/20',
    },

    completed: {
      label: 'Terminé',
      className:
        'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    },

    cancelled: {
      label: 'Annulé',
      className:
        'bg-red-500/10 text-red-300 border-red-500/20',
    },
  }

  const current = statuses[status] || {
    label: status || 'Inconnu',
    className:
      'bg-slate-800 text-slate-300 border-slate-700',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium whitespace-nowrap ${current.className}`}
    >
      {current.label}
    </span>
  )
}

function formatDate(date) {
  if (!date) return ''

  const value = String(date)
    .replace('T', ' ')
    .replace('Z', '')

  const [datePart] = value.split(' ')

  if (!datePart) return ''

  const [year, month, day] = datePart.split('-')

  if (!year || !month || !day) {
    return ''
  }
 
  return `${day}/${month}/${year}`
}
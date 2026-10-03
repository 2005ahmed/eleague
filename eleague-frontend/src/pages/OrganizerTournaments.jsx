import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Trophy,
  Users,
  CalendarDays,
  Eye,
  Pencil,
  XCircle,
  Loader2,
} from 'lucide-react'

import api from '../services/api'

function formatDate(date) {
  if (!date) return 'Non défini'

  const value = String(date)
    .replace('T', ' ')
    .replace('Z', '')

  const [datePart, timePart = '00:00:00'] =
    value.split(' ')

  const [year, month, day] =
    datePart.split('-')

  const [hour, minute] =
    timePart.split(':')

  return `${day}/${month}/${year} à ${hour}:${minute}`
}

function StatusBadge({ status }) {
  const labels = {
    draft: 'Draft',
    registration: 'Registration',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {labels[status] || status}
    </span>
  )
}

function TournamentCard({ tournament }) {
  const registered =
    tournament.registered_players ?? 0

  const maxPlayers =
    tournament.max_players ?? 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">

        <div className="flex items-start gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
            <Trophy className="h-6 w-6 text-indigo-600" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {tournament.name}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {tournament.game?.name || 'Game'}
            </p>
          </div>

        </div>

        <StatusBadge status={tournament.status} />

      </div>

      {/* Info */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users className="h-4 w-4" />
            Players
          </div>

          <p className="mt-1 font-semibold text-slate-900">
            {registered} / {maxPlayers}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4" />
            Start date
          </div>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatDate(tournament.start_date)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Trophy className="h-4 w-4" />
            Format
          </div>

          <p className="mt-1 font-semibold text-slate-900">
            {tournament.format || 'Tournament'}
          </p>
        </div>

      </div>

      {/* Progress */}
      <div className="mt-5">

        <div className="mb-2 flex justify-between text-xs text-slate-500">
          <span>Registration</span>

          <span>
            {registered} / {maxPlayers}
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{
              width: `${
                maxPlayers > 0
                  ? Math.min(
                      (registered / maxPlayers) * 100,
                      100
                    )
                  : 0
              }%`,
            }}
          />
        </div>

      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2">

        <Link
          to={`/tournaments/${tournament.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Eye className="h-4 w-4" />
          Manage
        </Link>

        {tournament.status === 'draft' && (
          <Link
            to={`/tournaments/${tournament.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        )}

        {(tournament.status === 'draft' ||
          tournament.status === 'registration') && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>
        )}

      </div>

    </div>
  )
}

export default function OrganizerTournaments() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTournaments()
  }, [])

  async function loadTournaments() {
    try {
      setLoading(true)
      setError('')

      const response = await api.get(
        '/organizer/tournaments'
      )

      setTournaments(response.data || [])
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
          'Impossible de charger les tournaments.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Tournaments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage all your tournaments from one place.
          </p>
        </div>

        <Link
          to="/tournaments/create"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" />
          Create Tournament
        </Link>

      </div>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[250px] items-center justify-center">

          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading tournaments...
          </div>

        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        tournaments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

            <Trophy className="mx-auto h-12 w-12 text-slate-300" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No tournaments yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Create your first tournament to get started.
            </p>

            <Link
              to="/tournaments/create"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create Tournament
            </Link>

          </div>
        )}

      {/* Tournaments */}
      {!loading &&
        !error &&
        tournaments.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">

            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
              />
            ))}

          </div>
        )}

    </div>
  )
}
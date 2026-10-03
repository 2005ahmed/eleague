import { useEffect, useState } from 'react'
import {
  User,
  Mail,
  Trophy,
  Target,
  TrendingUp,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import api from '../services/api'

export default function Profile() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    nickname: '',
    country: 'MA',
    bio: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)

      const response = await api.get('/profile')

      setData(response.data)

      const user = response.data.user
      const player = response.data.player

      setForm({
        name: user?.name || '',
        email: user?.email || '',
        nickname: player?.nickname || '',
        country: player?.country || 'MA',
        bio: player?.bio || '',
      })

      setError('')
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
        'Impossible de charger le profil.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await api.put('/profile', {
        ...form,
        country: form.country.toUpperCase(),
      })

      setData((previous) => ({
        ...previous,
        user: response.data.user,
        player: response.data.player,
      }))

      setSuccess('Profil mis à jour avec succès.')
    } catch (err) {
      console.error(err)

      if (err.response?.data?.errors) {
        const firstError = Object.values(
          err.response.data.errors
        )[0]?.[0]

        setError(firstError || 'Erreur de validation.')
      } else {
        setError(
          err.response?.data?.message ||
          'Impossible de mettre à jour le profil.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p>Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
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

  const user = data?.user
  const player = data?.player
  const stats = data?.stats || {}

  const initials =
    player?.nickname?.slice(0, 2)?.toUpperCase() ||
    user?.name?.slice(0, 2)?.toUpperCase() ||
    'PL'

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-sm text-cyan-400 font-medium mb-1">
            eLeague
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold">
            Mon profil
          </h1>

          <p className="text-slate-400 mt-2">
            Gère tes informations et consulte tes statistiques.
          </p>
        </div>

        {/* PROFILE HEADER */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">

            <div className="w-24 h-24 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-cyan-400">
                {initials}
              </span>
            </div>

            <div className="flex-1 min-w-0">

              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold truncate">
                  {player?.nickname || 'Player'}
                </h2>

                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                  Player
                </span>
              </div>

              <p className="text-slate-400 mt-1">
                {user?.name}
              </p>

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">

                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {player?.country || 'MA'}
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          <StatCard
            icon={<GameIcon />}
            label="Matchs"
            value={stats.matches ?? 0}
          />

          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Victoires"
            value={stats.wins ?? 0}
          />

          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Défaites"
            value={stats.losses ?? 0}
          />

          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Win Rate"
            value={`${stats.win_rate ?? 0}%`}
          />

        </div>

        {/* CONTENT */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* FORM */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">

            <div className="mb-6">
              <h2 className="text-lg font-bold">
                Informations personnelles
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Modifie les informations de ton profil.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid sm:grid-cols-2 gap-5">

                <Input
                  label="Nom complet"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ahmed El Ibriki"
                />

                <Input
                  label="Nickname"
                  name="nickname"
                  value={form.nickname}
                  onChange={handleChange}
                  placeholder="PlayerOne"
                />

              </div>

              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@example.com"
              />

              <div className="grid sm:grid-cols-2 gap-5">

                <Input
                  label="Pays"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="MA"
                  maxLength={2}
                />

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Rôle
                  </label>

                  <div className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-400">
                    {user?.role || 'player'}
                  </div>
                </div>

              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bio
                </label>

                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={5}
                  maxLength={1000}
                  placeholder="Parle un peu de toi..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                />

                <p className="text-xs text-slate-600 mt-2 text-right">
                  {form.bio.length}/1000
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-5 py-3 transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </>
                )}
              </button>

            </form>

          </div>

          {/* SIDE INFO */}
          <div className="space-y-6">

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Profil joueur
                  </h3>

                  <p className="text-xs text-slate-500">
                    Informations eLeague
                  </p>
                </div>
              </div>

              <div className="space-y-4">

                <InfoRow
                  label="Nickname"
                  value={player?.nickname || '-'}
                />

                <InfoRow
                  label="Pays"
                  value={player?.country || '-'}
                />

                <InfoRow
                  label="ID joueur"
                  value={`#${player?.id || '-'}`}
                />

                <InfoRow
                  label="Compte"
                  value={user?.role || 'player'}
                />

              </div>

            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">

              <Trophy className="w-7 h-7 text-cyan-400 mb-4" />

              <h3 className="font-semibold">
                Continue à jouer
              </h3>

              <p className="text-sm text-slate-500 mt-2 leading-6">
                Participe à plus de tournois pour améliorer ton
                classement et ton Win Rate.
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  maxLength,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
      />
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-medium text-slate-200 truncate">
        {value}
      </span>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">

      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
        {icon}
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

function GameIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-5 h-5"
    >
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M8 12h4" />
      <path d="M10 10v4" />
      <circle cx="16.5" cy="11" r=".5" fill="currentColor" />
      <circle cx="18" cy="13" r=".5" fill="currentColor" />
    </svg>
  )
}
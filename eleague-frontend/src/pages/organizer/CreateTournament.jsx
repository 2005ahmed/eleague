import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trophy,
  Users,
  Calendar,
  FileText,
  Gamepad2,
  DollarSign,
  ArrowLeft,
} from 'lucide-react'
import api from '../../services/api'

function CreateTournament() {
  const navigate = useNavigate()

  const [games, setGames] = useState([])

  const [form, setForm] = useState({
    game_id: '',
    name: '',
    description: '',
    format: 'knockout',
    max_players: 16,
    entry_fee: 0,
    prize: 0,
    start_date: '',
    rules: '',
  })

  const [loadingGames, setLoadingGames] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    try {
      const response = await api.get('/games')

      const data = response.data

      if (Array.isArray(data)) {
        setGames(data)
      } else if (Array.isArray(data.data)) {
        setGames(data.data)
      } else {
        setGames([])
      }
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les jeux.')
    } finally {
      setLoadingGames(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!form.game_id) {
      setError('Veuillez sélectionner un jeu.')
      return
    }

    if (!form.name.trim()) {
      setError('Le nom du tournoi est obligatoire.')
      return
    }

    if (!form.start_date) {
      setError('La date de début est obligatoire.')
      return
    }

    setSubmitting(true)

    try {
      const response = await api.post('/tournaments', {
        game_id: Number(form.game_id),
        name: form.name,
        description: form.description || null,
        format: form.format,
        max_players: Number(form.max_players),
        entry_fee: Number(form.entry_fee || 0),
        prize: Number(form.prize || 0),
        start_date: form.start_date,
        rules: form.rules || null,
      })

      setSuccess('Tournoi créé avec succès.')

      const tournamentId = response.data?.tournament?.id

      if (tournamentId) {
        setTimeout(() => {
          navigate(`/tournaments/${tournamentId}`)
        }, 700)
      }
    } catch (err) {
      console.error(err)

      if (err.response?.data?.errors) {
        const errors = err.response.data.errors

        const firstError = Object.values(errors)
          .flat()
          .find(Boolean)

        setError(firstError || 'Erreur de validation.')
      } else {
        setError(
          err.response?.data?.message ||
          'Une erreur est survenue.'
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      <div className="max-w-4xl mx-auto">

        {/* Header */}

        <div className="flex items-center gap-4 mb-8">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-3xl font-bold">
              Créer un tournoi
            </h1>

            <p className="text-slate-400 mt-1">
              Configurez votre nouveau tournoi
            </p>
          </div>

        </div>

        {/* Messages */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-300">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* General information */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center gap-3 mb-6">

              <Trophy className="text-yellow-400" size={22} />

              <div>
                <h2 className="text-xl font-semibold">
                  Informations du tournoi
                </h2>

                <p className="text-sm text-slate-400">
                  Les informations principales
                </p>
              </div>

            </div>

            <div className="space-y-5">

              {/* Name */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Nom du tournoi
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex: eLeague Championship"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              {/* Game */}

              <div>

                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Gamepad2 size={17} />
                  Jeu
                </label>

                <select
                  name="game_id"
                  value={form.game_id}
                  onChange={handleChange}
                  disabled={loadingGames}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
                >

                  <option value="">
                    {loadingGames
                      ? 'Chargement...'
                      : 'Sélectionner un jeu'}
                  </option>

                  {games.map((game) => (
                    <option
                      key={game.id}
                      value={game.id}
                    >
                      {game.name}
                    </option>
                  ))}

                </select>

              </div>

              {/* Description */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Décrivez votre tournoi..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500 resize-none"
                />

              </div>

            </div>

          </div>

          {/* Tournament system */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center gap-3 mb-6">

              <Trophy className="text-blue-400" size={22} />

              <div>
                <h2 className="text-xl font-semibold">
                  Système du tournoi
                </h2>

                <p className="text-sm text-slate-400">
                  Choisissez le format de compétition
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  format: 'knockout',
                }))
              }
              className={`w-full rounded-xl border p-5 text-left transition ${
                form.format === 'knockout'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
            >

              <div className="flex items-start gap-4">

                <div className="rounded-lg bg-slate-700 p-3">
                  <Trophy size={22} />
                </div>

                <div>

                  <h3 className="font-semibold text-lg">
                    Knockout
                  </h3>

                  <p className="text-sm text-slate-400 mt-1">
                    Élimination directe. Les joueurs
                    s'affrontent jusqu'à la finale.
                  </p>

                  <p className="text-xs text-blue-400 mt-3">
                    Disponible
                  </p>

                </div>

              </div>

            </button>

          </div>

          {/* Players / date */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center gap-3 mb-6">

              <Users
                className="text-green-400"
                size={22}
              />

              <div>

                <h2 className="text-xl font-semibold">
                  Configuration
                </h2>

                <p className="text-sm text-slate-400">
                  Joueurs et date de début
                </p>

              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Players */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Nombre de joueurs
                </label>

                <select
                  name="max_players"
                  value={form.max_players}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
                >

                  {[4, 8, 16, 32, 64, 128].map(
                    (number) => (
                      <option
                        key={number}
                        value={number}
                      >
                        {number} joueurs
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* Date */}

              <div>

                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Calendar size={17} />
                  Date de début
                </label>

                <input
                  type="datetime-local"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

            </div>

          </div>

          {/* Financial */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center gap-3 mb-6">

              <DollarSign
                className="text-yellow-400"
                size={22}
              />

              <div>

                <h2 className="text-xl font-semibold">
                  Prix
                </h2>

                <p className="text-sm text-slate-400">
                  Frais d'inscription et récompense
                </p>

              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>

                <label className="block text-sm font-medium mb-2">
                  Frais d'inscription
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="entry_fee"
                  value={form.entry_fee}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="block text-sm font-medium mb-2">
                  Prize
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="prize"
                  value={form.prize}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

            </div>

          </div>

          {/* Rules */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center gap-3 mb-6">

              <FileText
                className="text-purple-400"
                size={22}
              />

              <div>

                <h2 className="text-xl font-semibold">
                  Règles
                </h2>

                <p className="text-sm text-slate-400">
                  Les règles que les joueurs doivent respecter
                </p>

              </div>

            </div>

            <textarea
              name="rules"
              value={form.rules}
              onChange={handleChange}
              rows={7}
              placeholder="Écrivez les règles du tournoi..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500 resize-none"
            />

          </div>

          {/* Actions */}

          <div className="flex flex-col sm:flex-row gap-3 justify-end">

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-700 px-6 py-3 hover:bg-slate-800 transition"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting
                ? 'Création...'
                : 'Créer le tournoi'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}

export default CreateTournament
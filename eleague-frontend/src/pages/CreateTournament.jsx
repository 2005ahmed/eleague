import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy } from 'lucide-react'

import api from '../services/api'

function CreateTournament() {
  const navigate = useNavigate()

  const [games, setGames] = useState([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    game_id: '',
    name: '',
    description: '',
    format: 'knockout',
    max_players: 8,
    entry_fee: 0,
    prize: 0,
    start_date: '',
    rules: '',
  })

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await api.get('/games')

        setGames(
          response.data.data ??
          response.data ??
          []
        )
      } catch (err) {
        console.error('Error fetching games:', err)
        setError('Unable to load games.')
      } finally {
        setLoadingGames(false)
      }
    }

    fetchGames()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')

    if (!form.game_id) {
      setError('Please select a game.')
      return
    }

    if (!form.name.trim()) {
      setError('Tournament name is required.')
      return
    }

    if (Number(form.max_players) < 2) {
      setError('Maximum players must be at least 2.')
      return
    }

    try {
      setSaving(true)

      const response = await api.post('/tournaments', {
        game_id: Number(form.game_id),
        name: form.name.trim(),
        description: form.description.trim() || null,
        format: form.format,
        max_players: Number(form.max_players),
        entry_fee: Number(form.entry_fee || 0),
        prize: Number(form.prize || 0),
        start_date: form.start_date || null,
        rules: form.rules.trim() || null,
      })

      const tournament =
        response.data.tournament ??
        response.data.data ??
        response.data

      navigate(`/tournaments/${tournament.id}`)
    } catch (err) {
      console.error('Error creating tournament:', err)

      const message =
        err.response?.data?.message ||
        'Failed to create tournament.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">

        <button
          onClick={() => navigate('/tournaments')}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h1 className="text-3xl font-bold">
            Create Tournament
          </h1>

          <p className="text-gray-500 mt-1">
            Create and configure your esports tournament.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#0d0f15] border border-white/10 rounded-2xl p-6 md:p-8 space-y-8"
      >

        {/* Basic Information */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Trophy
                size={20}
                className="text-blue-500"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Basic Information
              </h2>

              <p className="text-sm text-gray-500">
                Enter the main information about your tournament.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Game */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Game
              </label>

              <select
                name="game_id"
                value={form.game_id}
                onChange={handleChange}
                disabled={loadingGames}
                className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
              >
                <option value="">
                  {loadingGames
                    ? 'Loading games...'
                    : 'Select a game'}
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

            {/* Name */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Tournament Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. eLeague FC Mobile Cup #2"
                className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Format
              </label>

              <select
                name="format"
                value={form.format}
                onChange={handleChange}
                className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
              >
                <option value="knockout">
                  Knockout
                </option>

                <option value="round_robin">
                  Round Robin
                </option>
              </select>
            </div>

            {/* Max Players */}
            <div>
  <label className="block text-sm font-medium mb-2">
    Nombre de joueurs
  </label>

  <select
    value={form.max_players}
    onChange={(e) =>
      setForm({
        ...form,
        max_players: e.target.value,
      })
    }
    className="w-full rounded-lg border px-4 py-3"
  >
    <option value="4">4 joueurs</option>
    <option value="8">8 joueurs</option>
    <option value="16">16 joueurs</option>
    <option value="32">32 joueurs</option>
    <option value="64">64 joueurs</option>
    <option value="128">128 joueurs</option>
  </select>
</div>

          </div>

          {/* Description */}
          <div className="mt-5">
            <label className="block text-sm text-gray-400 mb-2">
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your tournament..."
              className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition resize-none"
            />
          </div>
        </div>

        {/* Tournament Settings */}
        <div>
          <h2 className="text-lg font-semibold mb-5">
            Tournament Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Entry Fee */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Entry Fee
              </label>

              <input
                type="number"
                name="entry_fee"
                min="0"
                step="0.01"
                value={form.entry_fee}
                onChange={handleChange}
                className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Prize */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Prize
              </label>

              <input
                type="number"
                name="prize"
                min="0"
                step="0.01"
                value={form.prize}
                onChange={handleChange}
                className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Start Date */}
            <div>
  <label className="block text-sm font-medium mb-2">
    Date et heure de début
  </label>

  <input
    type="datetime-local"
    value={form.start_date}
    onChange={(e) =>
      setForm({
        ...form,
        start_date: e.target.value,
      })
    }
    required
    className="w-full rounded-lg border px-4 py-3"
  />
</div>

          </div>
        </div>

        {/* Rules */}
        <div>
          <h2 className="text-lg font-semibold mb-5">
            Tournament Rules
          </h2>

          <textarea
            name="rules"
            value={form.rules}
            onChange={handleChange}
            rows="6"
            placeholder="Write the rules of your tournament..."
            className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/10">

          <button
            type="button"
            onClick={() => navigate('/tournaments')}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || loadingGames}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
          >
            {saving
              ? 'Creating...'
              : 'Create Tournament'}
          </button>

        </div>

      </form>
    </div>
  )
}

export default CreateTournament
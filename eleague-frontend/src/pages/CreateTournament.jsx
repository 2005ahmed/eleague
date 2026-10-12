import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Trophy,
  Swords,
  Users,
  ListOrdered,
  CheckCircle2,
  Info,
  GitBranch,
  Shield,
} from 'lucide-react'

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
        console.error(
          'Error fetching games:',
          err
        )

        setError(
          'Unable to load games.'
        )
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

  const handleFormatChange = (format) => {
    setForm((prev) => ({
      ...prev,
      format,
      max_players:
        format === 'group_knockout'
          ? 8
          : prev.max_players,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')

    const maxPlayers = Number(
      form.max_players
    )

    if (!form.game_id) {
      setError(
        'Please select a game.'
      )
      return
    }

    if (!form.name.trim()) {
      setError(
        'Tournament name is required.'
      )
      return
    }

    if (maxPlayers < 2) {
      setError(
        'Maximum players must be at least 2.'
      )
      return
    }

    if (
      form.format === 'knockout' &&
      ![4, 8, 16, 32, 64, 128].includes(
        maxPlayers
      )
    ) {
      setError(
        'For Knockout, the number of players must be 4, 8, 16, 32, 64 or 128.'
      )
      return
    }

    if (
      form.format === 'round_robin' &&
      (maxPlayers < 2 ||
        maxPlayers > 128 ||
        maxPlayers % 2 !== 0)
    ) {
      setError(
        'For Round Robin, the number of players must be an even number between 2 and 128.'
      )
      return
    }

    if (
      form.format === 'group_knockout' &&
      ![8, 16, 32, 64, 128].includes(
        maxPlayers
      )
    ) {
      setError(
        'For Group Stage → Knockout, the number of players must be 8, 16, 32, 64 or 128.'
      )
      return
    }

    if (
      form.format === 'double_elimination' &&
      ![4, 8, 16, 32, 64, 128].includes(
        maxPlayers
      )
    ) {
      setError(
        'For Double Elimination, the number of players must be 4, 8, 16, 32, 64 or 128.'
      )
      return
    }

    if (!form.start_date) {
      setError(
        'Start date and time are required.'
      )
      return
    }

    try {
      setSaving(true)

      const response = await api.post(
        '/tournaments',
        {
          game_id: Number(form.game_id),
          name: form.name.trim(),
          description:
            form.description.trim() || null,
          format: form.format,
          max_players: maxPlayers,
          entry_fee:
            Number(form.entry_fee || 0),
          prize:
            Number(form.prize || 0),
          start_date:
            form.start_date
              ? `${form.start_date.replace("T", " ")}:00`
              : null,
          rules:
            form.rules.trim() || null,
        }
      )

      const tournament =
        response.data.tournament ??
        response.data.data ??
        response.data

      navigate(
        `/tournaments/${tournament.id}`
      )
    } catch (err) {
      console.error(
        'Error creating tournament:',
        err
      )

      const message =
        err.response?.data?.message ||
        'Failed to create tournament.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const isKnockout =
    form.format === 'knockout'

  const isRoundRobin =
    form.format === 'round_robin'

  const isGroupKnockout =
    form.format === 'group_knockout'

  const isDoubleElimination =
    form.format === 'double_elimination'

  const groupCount =
    Number(form.max_players) >= 4
      ? Number(form.max_players) / 4
      : 0

  const getGroupNames = () => {
    return Array.from(
      { length: groupCount },
      (_, index) =>
        `Group ${String.fromCharCode(
          65 + index
        )}`
    )
  }

  const playerOptions = isGroupKnockout
    ? [8, 16, 32, 64, 128]
    : [4, 8, 16, 32, 64, 128]

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="flex items-center gap-4">

        <button
          type="button"
          onClick={() =>
            navigate('/tournaments')
          }
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition"
        >
          <ArrowLeft size={19} />
        </button>

        <div>

          <h1 className="text-3xl font-bold">
            Create Tournament
          </h1>

          <p className="text-gray-500 mt-1">
            Create and configure your
            esports tournament.
          </p>

        </div>

      </div>

      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* ================================================== */}
      {/* FORM */}
      {/* ================================================== */}

      <form
        onSubmit={handleSubmit}
        className="bg-[#0d0f15] border border-white/10 rounded-2xl p-6 md:p-8 space-y-10"
      >

        {/* ================================================== */}
        {/* BASIC INFORMATION */}
        {/* ================================================== */}

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
                Enter the main information
                about your tournament.
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* GAME */}

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

            {/* NAME */}

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

          </div>

          {/* DESCRIPTION */}

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

        {/* ================================================== */}
        {/* TOURNAMENT FORMAT */}
        {/* ================================================== */}

        <div>

          <div className="flex items-center justify-between gap-4 mb-5">

            <div>

              <h2 className="text-lg font-semibold">
                Tournament Format
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Choose how your tournament
                will be played.
              </p>

            </div>

            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-purple-500/10 items-center justify-center">

              <Swords
                size={20}
                className="text-purple-400"
              />

            </div>

          </div>

          {/* FORMAT CARDS */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ================================================== */}
            {/* KNOCKOUT */}
            {/* ================================================== */}

            <button
              type="button"
              onClick={() =>
                handleFormatChange(
                  'knockout'
                )
              }
              className={`relative text-left rounded-2xl border p-5 transition-all ${
                isKnockout
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5'
                  : 'border-white/10 bg-[#080a0f] hover:border-white/20'
              }`}
            >

              {isKnockout && (
                <div className="absolute top-4 right-4">

                  <CheckCircle2
                    size={20}
                    className="text-blue-400"
                  />

                </div>
              )}

              <div className="flex items-start gap-4">

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isKnockout
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/5 text-gray-500'
                  }`}
                >

                  <Swords size={23} />

                </div>

                <div className="pr-6">

                  <h3
                    className={`font-bold text-lg ${
                      isKnockout
                        ? 'text-blue-300'
                        : 'text-gray-200'
                    }`}
                  >
                    Knockout
                  </h3>

                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    Les joueurs s'affrontent
                    directement. Le perdant est
                    éliminé et le gagnant passe
                    au tour suivant.
                  </p>

                </div>

              </div>

              <div className="mt-5 flex flex-wrap gap-2">

                {[
                  '4',
                  '8',
                  '16',
                  '32',
                  '64',
                  '128',
                ].map((number) => (
                  <span
                    key={number}
                    className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-gray-500"
                  >
                    {number} joueurs
                  </span>
                ))}

              </div>

            </button>

            {/* ================================================== */}
            {/* ROUND ROBIN */}
            {/* ================================================== */}

            <button
              type="button"
              onClick={() =>
                handleFormatChange(
                  'round_robin'
                )
              }
              className={`relative text-left rounded-2xl border p-5 transition-all ${
                isRoundRobin
                  ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5'
                  : 'border-white/10 bg-[#080a0f] hover:border-white/20'
              }`}
            >

              {isRoundRobin && (
                <div className="absolute top-4 right-4">

                  <CheckCircle2
                    size={20}
                    className="text-purple-400"
                  />

                </div>
              )}

              <div className="flex items-start gap-4">

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isRoundRobin
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-white/5 text-gray-500'
                  }`}
                >

                  <ListOrdered size={23} />

                </div>

                <div className="pr-6">

                  <h3
                    className={`font-bold text-lg ${
                      isRoundRobin
                        ? 'text-purple-300'
                        : 'text-gray-200'
                    }`}
                  >
                    Round Robin
                  </h3>

                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    Chaque joueur affronte les
                    autres joueurs. Le classement
                    final détermine le champion.
                  </p>

                </div>

              </div>

              <div className="mt-5 flex flex-wrap gap-2">

                {[
                  '4',
                  '8',
                  '16',
                  '32',
                  '64',
                  '128',
                ].map((number) => (
                  <span
                    key={number}
                    className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-gray-500"
                  >
                    {number} joueurs
                  </span>
                ))}

              </div>

            </button>

            {/* ================================================== */}
            {/* GROUP STAGE → KNOCKOUT */}
            {/* ================================================== */}

            <button
              type="button"
              onClick={() =>
                handleFormatChange(
                  'group_knockout'
                )
              }
              className={`relative text-left rounded-2xl border p-5 transition-all ${
                isGroupKnockout
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
                  : 'border-white/10 bg-[#080a0f] hover:border-white/20'
              }`}
            >

              {isGroupKnockout && (
                <div className="absolute top-4 right-4">

                  <CheckCircle2
                    size={20}
                    className="text-emerald-400"
                  />

                </div>
              )}

              <div className="flex items-start gap-4">

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isGroupKnockout
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/5 text-gray-500'
                  }`}
                >

                  <GitBranch size={23} />

                </div>

                <div className="pr-6">

                  <h3
                    className={`font-bold text-lg ${
                      isGroupKnockout
                        ? 'text-emerald-300'
                        : 'text-gray-200'
                    }`}
                  >
                    Group Stage → Knockout
                  </h3>

                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    Les joueurs sont répartis en
                    groupes. Les deux meilleurs de
                    chaque groupe passent ensuite
                    à la phase éliminatoire.
                  </p>

                </div>

              </div>

              <div className="mt-5 flex flex-wrap gap-2">

                {[
                  '8',
                  '16',
                  '32',
                  '64',
                  '128',
                ].map((number) => (
                  <span
                    key={number}
                    className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-gray-500"
                  >
                    {number} joueurs
                  </span>
                ))}

              </div>

            </button>

            {/* ================================================== */}
            {/* DOUBLE ELIMINATION */}
            {/* ================================================== */}

            <button
              type="button"
              onClick={() =>
                handleFormatChange(
                  'double_elimination'
                )
              }
              className={`relative text-left rounded-2xl border p-5 transition-all ${
                isDoubleElimination
                  ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/5'
                  : 'border-white/10 bg-[#080a0f] hover:border-white/20'
              }`}
            >

              {isDoubleElimination && (
                <div className="absolute top-4 right-4">

                  <CheckCircle2
                    size={20}
                    className="text-orange-400"
                  />

                </div>
              )}

              <div className="flex items-start gap-4">

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isDoubleElimination
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-white/5 text-gray-500'
                  }`}
                >

                  <Shield size={23} />

                </div>

                <div className="pr-6">

                  <h3
                    className={`font-bold text-lg ${
                      isDoubleElimination
                        ? 'text-orange-300'
                        : 'text-gray-200'
                    }`}
                  >
                    Double Elimination
                  </h3>

                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    Chaque joueur dispose de deux
                    chances. Après une première
                    défaite, il passe dans le Losers
                    Bracket. Deux défaites éliminent
                    le joueur.
                  </p>

                </div>

              </div>

              <div className="mt-5 flex flex-wrap gap-2">

                {[
                  '4',
                  '8',
                  '16',
                  '32',
                  '64',
                  '128',
                ].map((number) => (
                  <span
                    key={number}
                    className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-gray-500"
                  >
                    {number} joueurs
                  </span>
                ))}

              </div>

            </button>

          </div>

          {/* ================================================== */}
          {/* FORMAT INFO */}
          {/* ================================================== */}

          <div
            className={`mt-4 rounded-xl border px-4 py-4 ${
              isKnockout
                ? 'border-blue-500/20 bg-blue-500/5'
                : isRoundRobin
                  ? 'border-purple-500/20 bg-purple-500/5'
                  : isGroupKnockout
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-orange-500/20 bg-orange-500/5'
            }`}
          >

            <div className="flex items-start gap-3">

              <Info
                size={18}
                className={
                  isKnockout
                    ? 'text-blue-400 mt-0.5'
                    : isRoundRobin
                      ? 'text-purple-400 mt-0.5'
                      : isGroupKnockout
                        ? 'text-emerald-400 mt-0.5'
                        : 'text-orange-400 mt-0.5'
                }
              />

              <div>

                {isKnockout ? (
                  <>
                    <p className="text-sm font-semibold text-blue-300">
                      Knockout sélectionné
                    </p>

                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Le nombre de joueurs doit être
                      une puissance de 2 : 4, 8, 16,
                      32, 64 ou 128.
                    </p>
                  </>
                ) : isRoundRobin ? (
                  <>
                    <p className="text-sm font-semibold text-purple-300">
                      Round Robin sélectionné
                    </p>

                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Chaque joueur rencontrera les
                      autres joueurs. Le classement
                      utilise les points, la différence
                      de buts puis les buts marqués.
                    </p>
                  </>
                ) : isGroupKnockout ? (
                  <>
                    <p className="text-sm font-semibold text-emerald-300">
                      Group Stage → Knockout sélectionné
                    </p>

                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Les joueurs seront répartis en
                      groupes de 4. Chaque joueur
                      affrontera les autres joueurs de
                      son groupe. Les deux premiers de
                      chaque groupe seront qualifiés
                      pour la phase éliminatoire.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-orange-300">
                      Double Elimination sélectionné
                    </p>

                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Le tournoi possède un Winners
                      Bracket et un Losers Bracket.
                      Une première défaite ne vous
                      élimine pas. Une deuxième défaite
                      vous élimine définitivement.
                      La finale oppose le champion du
                      Winners Bracket au champion du
                      Losers Bracket.
                    </p>
                  </>
                )}

              </div>

            </div>

          </div>

          {/* ================================================== */}
          {/* GROUP PREVIEW */}
          {/* ================================================== */}

          {isGroupKnockout && (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">

                  <Users
                    size={18}
                    className="text-emerald-400"
                  />

                </div>

                <div>

                  <h3 className="font-semibold text-emerald-300">
                    Group Configuration
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Chaque groupe contient 4 joueurs.
                  </p>

                </div>

              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">

                {getGroupNames().map(
                  (groupName) => (
                    <div
                      key={groupName}
                      className="rounded-xl border border-white/10 bg-[#080a0f] p-3"
                    >

                      <div className="text-sm font-semibold text-gray-200">
                        {groupName}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        4 joueurs
                      </div>

                    </div>
                  )
                )}

              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">

                <div className="rounded-xl bg-white/5 p-3">

                  <p className="text-xs text-gray-500">
                    Groupes
                  </p>

                  <p className="text-lg font-bold text-white mt-1">
                    {groupCount}
                  </p>

                </div>

                <div className="rounded-xl bg-white/5 p-3">

                  <p className="text-xs text-gray-500">
                    Joueurs / groupe
                  </p>

                  <p className="text-lg font-bold text-white mt-1">
                    4
                  </p>

                </div>

                <div className="rounded-xl bg-white/5 p-3">

                  <p className="text-xs text-gray-500">
                    Qualifiés / groupe
                  </p>

                  <p className="text-lg font-bold text-emerald-400 mt-1">
                    2
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* ================================================== */}
          {/* DOUBLE ELIMINATION PREVIEW */}
          {/* ================================================== */}

          {isDoubleElimination && (
            <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">

                  <Shield
                    size={18}
                    className="text-orange-400"
                  />

                </div>

                <div>

                  <h3 className="font-semibold text-orange-300">
                    Double Elimination Structure
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Les joueurs peuvent perdre une fois
                    sans être éliminés.
                  </p>

                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                <div className="rounded-xl bg-white/5 p-4">

                  <p className="text-xs text-gray-500">
                    Winners Bracket
                  </p>

                  <p className="text-sm font-bold text-orange-300 mt-2">
                    Main Bracket
                  </p>

                  <p className="text-xs text-gray-600 mt-1">
                    Les gagnants continuent
                    directement.
                  </p>

                </div>

                <div className="rounded-xl bg-white/5 p-4">

                  <p className="text-xs text-gray-500">
                    Losers Bracket
                  </p>

                  <p className="text-sm font-bold text-orange-300 mt-2">
                    Second Chance
                  </p>

                  <p className="text-xs text-gray-600 mt-1">
                    Les joueurs ayant perdu
                    une fois continuent.
                  </p>

                </div>

                <div className="rounded-xl bg-white/5 p-4">

                  <p className="text-xs text-gray-500">
                    Grand Final
                  </p>

                  <p className="text-sm font-bold text-orange-300 mt-2">
                    Winners vs Losers
                  </p>

                  <p className="text-xs text-gray-600 mt-1">
                    Les deux brackets se
                    rencontrent.
                  </p>

                </div>

                <div className="rounded-xl bg-white/5 p-4">

                  <p className="text-xs text-gray-500">
                    Reset Final
                  </p>

                  <p className="text-sm font-bold text-orange-300 mt-2">
                    Possible
                  </p>

                  <p className="text-xs text-gray-600 mt-1">
                    Activée si le champion
                    des Losers gagne la Grand
                    Final.
                  </p>

                </div>

              </div>

              <div className="mt-4 rounded-xl border border-orange-500/10 bg-orange-500/5 px-4 py-3">

                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="text-orange-300 font-semibold">
                    Important :
                  </span>{' '}
                  le nombre de joueurs doit être une
                  puissance de 2 : 4, 8, 16, 32, 64
                  ou 128.
                </p>

              </div>

            </div>
          )}

          <input
            type="hidden"
            name="format"
            value={form.format}
          />

        </div>

        {/* ================================================== */}
        {/* TOURNAMENT SETTINGS */}
        {/* ================================================== */}

        <div>

          <div className="flex items-center gap-3 mb-5">

            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">

              <Users
                size={20}
                className="text-green-400"
              />

            </div>

            <div>

              <h2 className="text-lg font-semibold">
                Tournament Settings
              </h2>

              <p className="text-sm text-gray-500">
                Configure players, fees, prize
                and start date.
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* MAX PLAYERS */}

            <div>

              <label className="block text-sm text-gray-400 mb-2">
                Nombre de joueurs
              </label>

              <select
                name="max_players"
                value={form.max_players}
                onChange={handleChange}
                className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
              >

                {playerOptions.map(
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

              {isGroupKnockout && (
                <p className="text-xs text-emerald-500/70 mt-2">
                  Les joueurs seront répartis en
                  groupes de 4.
                </p>
              )}

              {isDoubleElimination && (
                <p className="text-xs text-orange-500/70 mt-2">
                  Le nombre de joueurs doit être
                  une puissance de 2.
                </p>
              )}

            </div>

            {/* ENTRY FEE */}

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

              <p className="text-xs text-gray-600 mt-1">
                0 = gratuit
              </p>

            </div>

            {/* PRIZE */}

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

          </div>

          {/* START DATE */}

          <div className="mt-5 max-w-md">

            <label className="block text-sm text-gray-400 mb-2">
              Date et heure de début
            </label>

            <input
              type="datetime-local"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              required
              className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
            />

          </div>

        </div>

        {/* ================================================== */}
        {/* RULES */}
        {/* ================================================== */}

        <div>

          <div className="flex items-center gap-3 mb-5">

            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">

              <ListOrdered
                size={20}
                className="text-yellow-400"
              />

            </div>

            <div>

              <h2 className="text-lg font-semibold">
                Tournament Rules
              </h2>

              <p className="text-sm text-gray-500">
                Define the rules players must follow.
              </p>

            </div>

          </div>

          <textarea
            name="rules"
            value={form.rules}
            onChange={handleChange}
            rows="7"
            placeholder="Write the rules of your tournament..."
            className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition resize-none"
          />

        </div>

        {/* ================================================== */}
        {/* SUMMARY */}
        {/* ================================================== */}

        <div className="rounded-2xl border border-white/10 bg-[#080a0f] p-5">

          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Tournament Summary
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div>

              <p className="text-xs text-gray-600">
                Format
              </p>

              <p
                className={`text-sm font-semibold mt-1 ${
                  isKnockout
                    ? 'text-blue-300'
                    : isRoundRobin
                      ? 'text-purple-300'
                      : isGroupKnockout
                        ? 'text-emerald-300'
                        : 'text-orange-300'
                }`}
              >
                {isKnockout
                  ? 'Knockout'
                  : isRoundRobin
                    ? 'Round Robin'
                    : isGroupKnockout
                      ? 'Group Stage → Knockout'
                      : 'Double Elimination'}
              </p>

            </div>

            <div>

              <p className="text-xs text-gray-600">
                Players
              </p>

              <p className="text-sm font-semibold text-gray-200 mt-1">
                {form.max_players}
              </p>

            </div>

            <div>

              <p className="text-xs text-gray-600">
                Entry
              </p>

              <p className="text-sm font-semibold text-gray-200 mt-1">
                {form.entry_fee || 0}
              </p>

            </div>

            <div>

              <p className="text-xs text-gray-600">
                Prize
              </p>

              <p className="text-sm font-semibold text-gray-200 mt-1">
                {form.prize || 0}
              </p>

            </div>

          </div>

          {isGroupKnockout && (
            <div className="mt-5 pt-5 border-t border-white/10">

              <div className="flex items-center gap-2 text-emerald-400 mb-2">

                <GitBranch size={16} />

                <span className="text-sm font-semibold">
                  Group Stage
                </span>

              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                {groupCount} groupes de 4 joueurs.
                Les 2 premiers de chaque groupe
                seront qualifiés pour le Knockout.
              </p>

            </div>
          )}

          {isDoubleElimination && (
            <div className="mt-5 pt-5 border-t border-white/10">

              <div className="flex items-center gap-2 text-orange-400 mb-2">

                <Shield size={16} />

                <span className="text-sm font-semibold">
                  Double Elimination
                </span>

              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Winners Bracket + Losers Bracket +
                Grand Final. Une deuxième défaite
                élimine définitivement le joueur.
              </p>

            </div>
          )}

        </div>

        {/* ================================================== */}
        {/* ACTIONS */}
        {/* ================================================== */}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-5 border-t border-white/10">

          <button
            type="button"
            onClick={() =>
              navigate('/tournaments')
            }
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              loadingGames
            }
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
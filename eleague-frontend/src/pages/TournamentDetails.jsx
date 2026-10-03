import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Gamepad2,
  Loader2,
  Trophy,
  Users,
  XCircle,
  Shield,
  DollarSign,
  Swords,
  RefreshCw,
} from 'lucide-react'

import api from '../services/api'
import { getUser, getPlayer } from '../services/auth'

function TournamentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const user = getUser()
  const player = getPlayer()

  const [tournament, setTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [champion, setChampion] = useState(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const [isRegistered, setIsRegistered] = useState(false)

  const isOrganizer =
    user?.is_organizer === true ||
    user?.role === 'organizer' ||
    user?.role === 'admin'

  const isAdmin = user?.role === 'admin'

  const isOwner =
    tournament?.organizer_id === user?.id

  const canManage =
    isOrganizer &&
    (isAdmin || isOwner)

  // ============================================================
  // LOAD TOURNAMENT
  // ============================================================

  const loadTournament = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      setError('')

      const tournamentResponse = await api.get(
        `/tournaments/${id}`
      )

      const tournamentData =
        tournamentResponse.data

      setTournament(tournamentData)

      // ----------------------------------------------------------
      // PLAYERS
      // ----------------------------------------------------------

      try {
        const playersResponse = await api.get(
          `/tournaments/${id}/players`
        )

        const tournamentPlayers =
          playersResponse.data?.players || []

        setPlayers(tournamentPlayers)

        if (player?.id) {
          const registered =
            tournamentPlayers.some(
              (item) =>
                Number(item.id) === Number(player.id)
            )

          setIsRegistered(registered)
        } else {
          setIsRegistered(false)
        }
      } catch (playersError) {
        console.error(
          'Error fetching players:',
          playersError
        )

        setPlayers([])
        setIsRegistered(false)
      }

      // ----------------------------------------------------------
      // MATCHES
      // ----------------------------------------------------------

      try {
        const matchesResponse = await api.get(
          `/tournaments/${id}/matches`
        )

        const matchesData =
          matchesResponse.data

        if (Array.isArray(matchesData)) {
          setMatches(matchesData)
        } else {
          setMatches(
            matchesData?.matches || []
          )
        }
      } catch (matchesError) {
        console.error(
          'Error fetching matches:',
          matchesError
        )

        setMatches([])
      }

      // ----------------------------------------------------------
      // CHAMPION
      // ----------------------------------------------------------

      if (
        tournamentData.status === 'completed'
      ) {
        try {
          const championResponse =
            await api.get(
              `/tournaments/${id}/champion`
            )

          setChampion(
            championResponse.data?.champion || null
          )
        } catch (championError) {
          console.error(
            'Error fetching champion:',
            championError
          )

          setChampion(null)
        }
      } else {
        setChampion(null)
      }

    } catch (requestError) {
      console.error(
        'Error fetching tournament:',
        requestError
      )

      setError(
        requestError.response?.data?.message ||
        'Impossible de charger le tournoi.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadTournament()
  }, [id])

  // ============================================================
  // PUBLISH
  // ============================================================

  const handlePublish = async () => {
    const confirmed = window.confirm(
      'Voulez-vous publier ce tournoi et ouvrir les inscriptions ?'
    )

    if (!confirmed) {
      return
    }

    try {
      setActionLoading(true)
      setActionError('')

      await api.put(
        `/tournaments/${id}/publish`
      )

      await loadTournament(false)
    } catch (requestError) {
      console.error(
        'Error publishing tournament:',
        requestError
      )

      setActionError(
        requestError.response?.data?.message ||
        'Impossible de publier le tournoi.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ============================================================
  // CANCEL
  // ============================================================

  const handleCancel = async () => {
    const confirmed = window.confirm(
      'Voulez-vous vraiment annuler ce tournoi ?'
    )

    if (!confirmed) {
      return
    }

    try {
      setActionLoading(true)
      setActionError('')

      await api.put(
        `/tournaments/${id}/cancel`
      )

      await loadTournament(false)
    } catch (requestError) {
      console.error(
        'Error cancelling tournament:',
        requestError
      )

      setActionError(
        requestError.response?.data?.message ||
        "Impossible d'annuler le tournoi."
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ============================================================
  // JOIN
  // ============================================================

  const handleJoin = async () => {
    try {
      setActionLoading(true)
      setActionError('')

      await api.post(
        `/tournaments/${id}/register`
      )

      await loadTournament(false)
    } catch (requestError) {
      console.error(
        'Error joining tournament:',
        requestError
      )

      setActionError(
        requestError.response?.data?.message ||
        'Impossible de rejoindre le tournoi.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ============================================================
  // LEAVE
  // ============================================================

  const handleLeave = async () => {
    const confirmed = window.confirm(
      'Voulez-vous vraiment quitter ce tournoi ?'
    )

    if (!confirmed) {
      return
    }

    try {
      setActionLoading(true)
      setActionError('')

      await api.delete(
        `/tournaments/${id}/register`
      )

      await loadTournament(false)
    } catch (requestError) {
      console.error(
        'Error leaving tournament:',
        requestError
      )

      setActionError(
        requestError.response?.data?.message ||
        'Impossible de quitter le tournoi.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">

          <Loader2
            size={24}
            className="animate-spin"
          />

          <span>
            Chargement du tournoi...
          </span>

        </div>
      </div>
    )
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white px-4 py-8">

        <div className="max-w-6xl mx-auto">

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
          >
            <ArrowLeft size={18} />
            Retour
          </button>

          <div className="bg-[#111827] border border-red-500/20 rounded-2xl p-6">

            <p className="text-red-400">
              {error || 'Tournoi introuvable.'}
            </p>

          </div>

        </div>

      </div>
    )
  }

  // ============================================================
  // DATA
  // ============================================================

  const status = tournament.status

  const playersCount =
    players.length

  const maxPlayers =
    Number(tournament.max_players || 0)

  const isFull =
    playersCount >= maxPlayers

  const progress =
    maxPlayers > 0
      ? Math.min(
          100,
          (playersCount / maxPlayers) * 100
        )
      : 0

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ================================================== */}
        {/* TOP BAR */}
        {/* ================================================== */}

        <div className="flex items-center justify-between mb-8">

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            Retour
          </button>

          <button
            onClick={() => loadTournament(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111827] border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            Actualiser
          </button>

        </div>

        {/* ================================================== */}
        {/* ACTION ERROR */}
        {/* ================================================== */}

        {actionError && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4">

            <div className="flex items-center gap-3">

              <XCircle
                size={20}
                className="text-red-400"
              />

              <p className="text-red-300">
                {actionError}
              </p>

            </div>

          </div>
        )}

        {/* ================================================== */}
        {/* HERO */}
        {/* ================================================== */}

        <div className="relative overflow-hidden rounded-3xl border border-gray-800 bg-[#111827] shadow-2xl">

          <div className="absolute inset-0 pointer-events-none">

            <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />

            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />

          </div>

          <div className="relative p-6 md:p-8 lg:p-10">

            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8">

              {/* Tournament title */}

              <div className="flex-1">

                <div className="flex flex-wrap items-center gap-3 mb-5">

                  {tournament.game && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">

                      <Gamepad2 size={16} />

                      {tournament.game.name}

                    </span>
                  )}

                  <StatusBadge
                    status={status}
                  />

                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                  {tournament.name}
                </h1>

                {tournament.description && (
                  <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">
                    {tournament.description}
                  </p>
                )}

                {/* Organizer */}

                {tournament.organizer && (
                  <div className="flex items-center gap-3 mt-6">

                    <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">

                      <Shield
                        size={18}
                        className="text-gray-400"
                      />

                    </div>

                    <div>

                      <p className="text-xs text-gray-500">
                        Organisé par
                      </p>

                      <p className="text-sm font-medium text-gray-200">
                        {tournament.organizer.name ||
                          tournament.organizer.nickname ||
                          tournament.organizer.email}
                      </p>

                    </div>

                  </div>
                )}

              </div>

              {/* Organizer actions */}

              {canManage && (
                <div className="flex flex-wrap gap-3 xl:pt-2">

                  {status === 'draft' && (
                    <>
                      <button
                        onClick={() =>
                          navigate(
                            `/tournaments/${id}/edit`
                          )
                        }
                        disabled={actionLoading}
                        className="px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 font-semibold hover:bg-gray-700 transition disabled:opacity-50"
                      >
                        Modifier
                      </button>

                      <button
                        onClick={handlePublish}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition disabled:opacity-50"
                      >

                        {actionLoading ? (
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <CheckCircle2
                            size={18}
                          />
                        )}

                        Publier

                      </button>

                      <button
                        onClick={handleCancel}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 font-semibold hover:bg-red-600/20 transition disabled:opacity-50"
                      >

                        <XCircle size={18} />

                        Annuler

                      </button>
                    </>
                  )}

                  {status === 'registration' && (
                    <>
                      <button
                        onClick={() =>
                          navigate(
                            `/tournaments/${id}/edit`
                          )
                        }
                        disabled={actionLoading}
                        className="px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 font-semibold hover:bg-gray-700 transition disabled:opacity-50"
                      >
                        Modifier
                      </button>

                      <button
                        onClick={handleCancel}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 font-semibold hover:bg-red-600/20 transition disabled:opacity-50"
                      >

                        <XCircle size={18} />

                        Annuler

                      </button>
                    </>
                  )}

                </div>
              )}

            </div>

          </div>

          {/* ================================================== */}
          {/* STATS */}
          {/* ================================================== */}

          <div className="relative border-t border-gray-800 bg-[#0d1422]/80">

            <div className="grid grid-cols-2 lg:grid-cols-4">

              <StatBox
                icon={<Users size={20} />}
                label="Joueurs"
                value={`${playersCount}/${maxPlayers}`}
              />

              <StatBox
                icon={<Swords size={20} />}
                label="Format"
                value={formatFormat(
                  tournament.format
                )}
              />

              <StatBox
                icon={<Calendar size={20} />}
                label="Début"
                value={
                  tournament.start_date
                    ? formatDate(
                        tournament.start_date
                      )
                    : 'Non défini'
                }
              />

              <StatBox
                icon={<DollarSign size={20} />}
                label="Prize"
                value={`${tournament.prize ?? 0} DH`}
              />

            </div>

          </div>

        </div>

        {/* ================================================== */}
        {/* REGISTRATION */}
        {/* ================================================== */}

        {status === 'registration' && (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-[#111827] p-6">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              <div className="flex-1">

                <div className="flex items-center justify-between mb-3">

                  <div>

                    <h2 className="text-lg font-bold text-white">
                      Inscriptions
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      {isFull
                        ? 'Le tournoi est complet.'
                        : `${playersCount} joueur${playersCount > 1 ? 's' : ''} inscrit${playersCount > 1 ? 's' : ''}`}
                    </p>

                  </div>

                  <span className="text-sm font-semibold text-gray-300">
                    {playersCount}/{maxPlayers}
                  </span>

                </div>

                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

                {tournament.start_date && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">

                    <Clock size={16} />

                    <span>
                      Début prévu :
                    </span>

                    <span className="text-gray-300">
                      {formatDate(
                        tournament.start_date
                      )}
                    </span>

                  </div>
                )}

              </div>

              {/* ================================================== */}
              {/* PLAYER BUTTONS */}
              {/* ================================================== */}

              {user && player && (
                <div className="shrink-0">

                  {!isRegistered && !isFull && (
                    <button
                      onClick={handleJoin}
                      disabled={actionLoading}
                      className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition disabled:opacity-50"
                    >
                      {actionLoading
                        ? 'Inscription...'
                        : 'Rejoindre le tournoi'}
                    </button>
                  )}

                  {isRegistered && (
                    <button
                      onClick={handleLeave}
                      disabled={actionLoading}
                      className="px-6 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 font-semibold hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      {actionLoading
                        ? 'Traitement...'
                        : 'Quitter le tournoi'}
                    </button>
                  )}

                  {isFull && !isRegistered && (
                    <div className="px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-400">
                      Tournoi complet
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        )}

        {/* ================================================== */}
        {/* DRAFT */}
        {/* ================================================== */}

        {status === 'draft' && (
          <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">

            <div className="flex gap-4">

              <div className="w-11 h-11 shrink-0 rounded-xl bg-yellow-500/10 flex items-center justify-center">

                <Clock
                  size={22}
                  className="text-yellow-400"
                />

              </div>

              <div>

                <h2 className="font-bold text-yellow-300">
                  Tournoi en brouillon
                </h2>

                <p className="mt-1 text-sm text-gray-400 leading-relaxed">
                  Le tournoi n'est pas encore ouvert
                  aux inscriptions. Vous pouvez modifier
                  les informations puis le publier.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ================================================== */}
        {/* FULL / WAITING */}
        {/* ================================================== */}

        {status === 'registration' &&
          isFull && (
            <div className="mt-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">

              <div className="flex gap-4">

                <div className="w-11 h-11 shrink-0 rounded-xl bg-indigo-500/10 flex items-center justify-center">

                  <Clock
                    size={22}
                    className="text-indigo-400"
                  />

                </div>

                <div>

                  <h2 className="font-bold text-indigo-300">
                    Tournoi complet
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    Tous les joueurs sont inscrits.
                    Le bracket sera généré
                    automatiquement lorsque la date
                    de début sera atteinte.
                  </p>

                </div>

              </div>

            </div>
          )}

        {/* ================================================== */}
        {/* IN PROGRESS */}
        {/* ================================================== */}

        {status === 'in_progress' && (
          <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/5 p-6">

            <div className="flex items-center gap-4">

              <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center">

                <CheckCircle2
                  size={22}
                  className="text-green-400"
                />

              </div>

              <div>

                <h2 className="font-bold text-green-300">
                  Tournoi en cours
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Les matchs sont maintenant en cours.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ================================================== */}
        {/* CANCELLED */}
        {/* ================================================== */}

        {status === 'cancelled' && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">

            <div className="flex items-center gap-4">

              <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center">

                <XCircle
                  size={22}
                  className="text-red-400"
                />

              </div>

              <div>

                <h2 className="font-bold text-red-300">
                  Tournoi annulé
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Ce tournoi a été annulé et les
                  inscriptions sont fermées.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ================================================== */}
        {/* CHAMPION */}
        {/* ================================================== */}

        {status === 'completed' && (
          <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-transparent p-6">

            <div className="flex items-center gap-5">

              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">

                <Trophy
                  size={28}
                  className="text-yellow-400"
                />

              </div>

              <div>

                <p className="text-xs uppercase tracking-wider text-yellow-500/70">
                  Champion
                </p>

                <h2 className="mt-1 text-2xl font-bold text-white">
                  {champion?.nickname ||
                    champion?.name ||
                    'Champion déterminé'}
                </h2>

              </div>

            </div>

          </div>
        )}

        {/* ================================================== */}
        {/* PLAYERS */}
        {/* ================================================== */}

        <div className="mt-8 rounded-2xl border border-gray-800 bg-[#111827] overflow-hidden">

          <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">

            <div>

              <h2 className="text-xl font-bold text-white">
                Joueurs inscrits
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {playersCount} / {maxPlayers}
              </p>

            </div>

            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">

              <Users
                size={20}
                className="text-indigo-400"
              />

            </div>

          </div>

          <div className="p-6">

            {players.length === 0 ? (
              <div className="py-8 text-center">

                <Users
                  size={32}
                  className="mx-auto text-gray-700"
                />

                <p className="mt-3 text-gray-500">
                  Aucun joueur inscrit pour le moment.
                </p>

              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {players.map(
                  (item, index) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-[#0d1422] hover:border-gray-700 transition"
                    >

                      <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-gray-300">
                        {index + 1}
                      </div>

                      <div className="min-w-0">

                        <p className="font-semibold text-gray-200 truncate">
                          {item.nickname ||
                            item.name ||
                            `Player ${index + 1}`}
                        </p>

                        {item.country && (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.country}
                          </p>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>

        {/* ================================================== */}
        {/* MATCHES */}
        {/* ================================================== */}

        {(status === 'in_progress' ||
          status === 'completed') && (
          <div className="mt-8 rounded-2xl border border-gray-800 bg-[#111827] overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-white">
                  Matchs
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Résultats et rencontres
                </p>

              </div>

              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">

                <Swords
                  size={20}
                  className="text-purple-400"
                />

              </div>

            </div>

            <div className="p-6">

              {matches.length === 0 ? (
                <div className="py-8 text-center">

                  <Swords
                    size={32}
                    className="mx-auto text-gray-700"
                  />

                  <p className="mt-3 text-gray-500">
                    Aucun match disponible.
                  </p>

                </div>
              ) : (
                <div className="space-y-3">

                  {matches.map(
                    (match) => (
                      <div
                        key={match.id}
                        className="rounded-xl border border-gray-800 bg-[#0d1422] p-5 hover:border-gray-700 transition"
                      >

                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                          <div>

                            <div className="flex items-center gap-2 mb-3">

                              <span className="px-2.5 py-1 rounded-lg bg-gray-800 text-xs text-gray-400">
                                Round {match.round}
                              </span>

                              <span className="px-2.5 py-1 rounded-lg bg-gray-800 text-xs text-gray-500">
                                {match.status}
                              </span>

                            </div>

                            <div className="flex items-center gap-3 text-sm md:text-base">

                              <span className="font-semibold text-gray-200">
                                {match.player1?.nickname ||
                                  'TBD'}
                              </span>

                              <span className="text-gray-600">
                                VS
                              </span>

                              <span className="font-semibold text-gray-200">
                                {match.player2?.nickname ||
                                  'TBD'}
                              </span>

                            </div>

                          </div>

                          <div className="flex items-center gap-4">

                            <div className="text-2xl font-bold text-white tracking-wider">

                              {match.player1_score ?? 0}

                              <span className="text-gray-600 mx-2">
                                -
                              </span>

                              {match.player2_score ?? 0}

                            </div>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

          </div>
        )}

        {/* ================================================== */}
        {/* RULES */}
        {/* ================================================== */}

        {tournament.rules && (
          <div className="mt-8 rounded-2xl border border-gray-800 bg-[#111827] overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-800">

              <h2 className="text-xl font-bold text-white">
                Règlement
              </h2>

            </div>

            <div className="p-6">

              <p className="whitespace-pre-wrap text-gray-400 leading-relaxed">
                {tournament.rules}
              </p>

            </div>

          </div>
        )}

      </div>
    </div>
  )
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  const config = {
    draft: {
      label: 'Draft',
      className:
        'bg-gray-500/10 border-gray-500/20 text-gray-400',
    },

    registration: {
      label: 'Registration',
      className:
        'bg-blue-500/10 border-blue-500/20 text-blue-400',
    },

    in_progress: {
      label: 'In Progress',
      className:
        'bg-green-500/10 border-green-500/20 text-green-400',
    },

    completed: {
      label: 'Completed',
      className:
        'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    },

    cancelled: {
      label: 'Cancelled',
      className:
        'bg-red-500/10 border-red-500/20 text-red-400',
    },
  }

  const current =
    config[status] || {
      label: status,
      className:
        'bg-gray-500/10 border-gray-500/20 text-gray-400',
    }

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  )
}

// ============================================================
// STAT BOX
// ============================================================

function StatBox({
  icon,
  label,
  value,
}) {
  return (
    <div className="px-5 py-5 border-r border-gray-800 last:border-r-0">

      <div className="flex items-center gap-3">

        <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-xs text-gray-500">
            {label}
          </p>

          <p className="mt-1 font-semibold text-gray-200 truncate">
            {value}
          </p>

        </div>

      </div>

    </div>
  )
}

// ============================================================
// FORMAT
// ============================================================

function formatFormat(format) {
  if (format === 'knockout') {
    return 'Knockout'
  }

  return format || '—'
}

// ============================================================
// DATE
// ============================================================

function formatDate(date) {
  if (!date) {
    return 'Non défini'
  }

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

export default TournamentDetails
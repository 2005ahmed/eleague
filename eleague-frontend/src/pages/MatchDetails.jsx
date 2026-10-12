import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Trophy,
  Gamepad2,
  Clock,
  CheckCircle,
  Swords,
  Send,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  X,
} from 'lucide-react'
import api from '../services/api'
import MatchChat from '../components/MatchChat'

function MatchDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [match, setMatch] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Report states
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportEvidence, setReportEvidence] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')
  const [reportSuccess, setReportSuccess] = useState('')

  useEffect(() => {
    fetchMatch()
  }, [id])

  const fetchMatch = async () => {
    try {
      setLoading(true)
      setError('')

      const [matchResponse, userResponse] = await Promise.all([
        api.get(`/matches/${id}`),
        api.get('/auth/me'),
      ])

      setMatch(matchResponse.data.match ?? matchResponse.data)
      setUser(userResponse.data.user ?? userResponse.data)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
        'Impossible de récupérer le match.'
      )
    } finally {
      setLoading(false)
    }
  }

  const getPlayerName = (player) => {
    if (!player) return 'TBD'

    return (
      player.nickname ||
      player.user?.name ||
      'Player'
    )
  }

  const getPlayerInitial = (player) => {
    const name = getPlayerName(player)

    if (!player) {
      return '?'
    }

    return name.charAt(0).toUpperCase()
  }

  const getStatusLabel = () => {
    if (match?.status === 'completed') {
      return 'Completed'
    }

    if (match?.status === 'pending') {
      return 'Pending verification'
    }

    if (match?.status === 'scheduled') {
      return 'Scheduled'
    }

    return match?.status || 'Scheduled'
  }

  const getStatusIcon = () => {
    if (match?.status === 'completed') {
      return <CheckCircle size={17} />
    }

    if (match?.status === 'pending') {
      return <ShieldCheck size={17} />
    }

    return <Clock size={17} />
  }

  const isCurrentPlayer = (player) => {
    if (!user || !player) return false

    return (
      player.user_id === user.id ||
      player.user?.id === user.id
    )
  }

  const isParticipant =
    isCurrentPlayer(match?.player1) ||
    isCurrentPlayer(match?.player2)

  /*
   * Knockout bracket support:
   *
   * Future matches are pre-created by the backend with
   * player1_id/player2_id equal to null.
   *
   * Such a match must not be playable until both players
   * are known.
   */
  const hasPlayer1 = Boolean(
    match?.player1_id || match?.player1?.id
  )

  const hasPlayer2 = Boolean(
    match?.player2_id || match?.player2?.id
  )

  const hasBothPlayers = hasPlayer1 && hasPlayer2

  const isWaitingForPlayers =
    match?.status === 'scheduled' &&
    !hasBothPlayers

  const hasPendingResult =
    match?.results?.some(
      (result) => result.verified === false
    ) || false

  const openReportModal = () => {
    setReportError('')
    setReportSuccess('')
    setReportReason('')
    setReportDescription('')
    setReportEvidence('')
    setShowReportModal(true)
  }

  const closeReportModal = () => {
    if (reportLoading) return

    setShowReportModal(false)
    setReportError('')
    setReportSuccess('')
  }

  const submitReport = async (e) => {
    e.preventDefault()

    if (!reportReason.trim()) {
      setReportError('Veuillez sélectionner un motif.')
      return
    }

    try {
      setReportLoading(true)
      setReportError('')
      setReportSuccess('')

      const response = await api.post(
        `/matches/${match.id}/reports`,
        {
          reason: reportReason,
          description: reportDescription || null,
          evidence: reportEvidence || null,
        }
      )

      console.log('Report created:', response.data)

      setReportSuccess(
        'Votre signalement a été envoyé à l’organisateur.'
      )

      setTimeout(() => {
        setShowReportModal(false)
        setReportSuccess('')
      }, 1800)
    } catch (err) {
      console.error(err)

      setReportError(
        err.response?.data?.message ||
        'Impossible d’envoyer le signalement.'
      )
    } finally {
      setReportLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />

          <p className="text-gray-400 mt-4">
            Chargement du match...
          </p>
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="space-y-6">

        <button
          onClick={() => navigate('/matches')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={18} />
          Retour à mes matchs
        </button>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-400">
            {error || 'Match introuvable.'}
          </p>
        </div>

      </div>
    )
  }

  const player1 = match.player1
  const player2 = match.player2

  const player1Name = getPlayerName(player1)
  const player2Name = getPlayerName(player2)

  return (
    <div className="space-y-8">

      {/* Back navigation */}
      <div className="flex flex-wrap items-center gap-3">

        <button
          onClick={() => navigate('/matches')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={18} />
          Mes matchs
        </button>

        {match.tournament?.id && (
          <>
            <span className="text-gray-700">
              /
            </span>

            <button
              onClick={() =>
                navigate(`/tournaments/${match.tournament.id}`)
              }
              className="text-gray-400 hover:text-white transition"
            >
              {match.tournament.name}
            </button>
          </>
        )}

      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <Swords
              size={24}
              className="text-blue-400"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Match #{match.id}
            </h1>

            <p className="text-gray-500 mt-1">
              {match.tournament?.name || 'Tournament'}
            </p>
          </div>

        </div>

        {/* Status */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold w-fit ${
            match.status === 'completed'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : match.status === 'pending'
                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                : isWaitingForPlayers
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}
        >
          {isWaitingForPlayers ? (
            <Clock size={17} />
          ) : (
            getStatusIcon()
          )}

          {isWaitingForPlayers
            ? 'Waiting for players'
            : getStatusLabel()}
        </div>

      </div>

      {/* Match Card */}
      <div className="bg-[#0d0f15] border border-white/10 rounded-3xl overflow-hidden">

        {/* Top bar */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-2 text-gray-400">
            <Clock size={17} />
            Round {match.round}
          </div>

          {match.scheduled_at && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <CalendarDays size={16} />

              {new Date(match.scheduled_at).toLocaleString(
                'fr-FR',
                {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }
              )}
            </div>
          )}

          <MatchChat match={match} />

        </div>

        {/* Players */}
        <div className="p-8 md:p-12">

          <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-10">

            {/* Player 1 */}
            <div className="text-center">

              <div
                className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold ${
                  player1
                    ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400'
                    : 'bg-white/[0.03] border border-dashed border-white/10 text-gray-600'
                }`}
              >
                {getPlayerInitial(player1)}
              </div>

              <h2 className="text-2xl font-bold mt-5">
                {player1Name}
              </h2>

              {player1?.country && (
                <p className="text-gray-500 text-sm mt-1">
                  {player1.country}
                </p>
              )}

              {isCurrentPlayer(player1) && (
                <span className="inline-block mt-3 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold">
                  YOU
                </span>
              )}

              {match.winner_id === player1?.id && (
                <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm mt-3">
                  <Trophy size={15} />
                  Winner
                </div>
              )}

            </div>

            {/* Score */}
            <div className="text-center">

              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                {isWaitingForPlayers ? 'VS' : 'Score'}
              </p>

              <div className="flex items-center gap-4">

                <span className="text-5xl font-black">
                  {match.status === 'completed'
                    ? match.player1_score
                    : '-'}
                </span>

                <span className="text-gray-600 text-3xl">
                  :
                </span>

                <span className="text-5xl font-black">
                  {match.status === 'completed'
                    ? match.player2_score
                    : '-'}
                </span>

              </div>

              {match.status === 'completed' && (
                <p className="text-xs text-gray-500 mt-3">
                  Final score
                </p>
              )}

              {isWaitingForPlayers && (
                <p className="text-xs text-yellow-500/70 mt-3">
                  Waiting for both players
                </p>
              )}

            </div>

            {/* Player 2 */}
            <div className="text-center">

              <div
                className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold ${
                  player2
                    ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400'
                    : 'bg-white/[0.03] border border-dashed border-white/10 text-gray-600'
                }`}
              >
                {getPlayerInitial(player2)}
              </div>

              <h2 className="text-2xl font-bold mt-5">
                {player2Name}
              </h2>

              {player2?.country && (
                <p className="text-gray-500 text-sm mt-1">
                  {player2.country}
                </p>
              )}

              {isCurrentPlayer(player2) && (
                <span className="inline-block mt-3 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold">
                  YOU
                </span>
              )}

              {match.winner_id === player2?.id && (
                <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm mt-3">
                  <Trophy size={15} />
                  Winner
                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* Waiting for players */}
      {isWaitingForPlayers && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">

          <div className="flex items-start gap-4">

            <div className="w-11 h-11 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Clock
                size={22}
                className="text-yellow-400"
              />
            </div>

            <div>
              <h2 className="font-bold text-yellow-400">
                Waiting for players
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                This match is waiting for the qualified players
                from the previous round.
              </p>

              <p className="text-gray-600 text-xs mt-2">
                The match will become available automatically
                once both player slots are filled.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Pending verification */}
      {hasPendingResult && match.status !== 'completed' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">

          <div className="flex items-start gap-4">

            <div className="w-11 h-11 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
              <ShieldCheck
                size={22}
                className="text-yellow-400"
              />
            </div>

            <div>
              <h2 className="font-bold text-yellow-400">
                Result pending verification
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Le résultat a été envoyé et attend la
                vérification de l'organisateur.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Winner */}
      {match.winner && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Trophy
                size={25}
                className="text-yellow-400"
              />
            </div>

            <div>
              <p className="text-xs text-yellow-500 uppercase tracking-wider">
                Winner
              </p>

              <h3 className="text-xl font-bold mt-1">
                {getPlayerName(match.winner)}
              </h3>
            </div>

          </div>

        </div>
      )}

      {/* Game */}
      {match.tournament?.game && (
        <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-6">

          <div className="flex items-center gap-4">

            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Gamepad2
                size={24}
                className="text-blue-400"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Game
              </p>

              <p className="font-semibold mt-1">
                {match.tournament.game.name}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Submit Result */}
      {match.status === 'scheduled' &&
        hasBothPlayers &&
        isParticipant &&
        !hasPendingResult && (
          <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-6">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div>

                <div className="flex items-center gap-2">
                  <Send
                    size={19}
                    className="text-blue-400"
                  />

                  <h2 className="text-xl font-bold">
                    Match terminé ?
                  </h2>
                </div>

                <p className="text-gray-500 mt-2">
                  Envoyez votre score et une capture
                  d'écran du résultat.
                </p>

              </div>

              <button
                onClick={() =>
                  navigate(`/matches/${match.id}/result`)
                }
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold transition"
              >
                <Send size={17} />
                Submit Result
              </button>

            </div>

          </div>
        )}

      {/* Scheduled match but current user is not participant */}
      {match.status === 'scheduled' &&
        hasBothPlayers &&
        !isParticipant &&
        user && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">

            <p className="text-gray-400">
              Vous n'êtes pas un participant de ce match.
            </p>

          </div>
        )}

      {/* Report / Dispute */}
      {match.status === 'completed' &&
        isParticipant && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div>

                <div className="flex items-center gap-2">
                  <AlertTriangle
                    size={19}
                    className="text-red-400"
                  />

                  <h2 className="text-xl font-bold">
                    Un problème avec ce résultat ?
                  </h2>
                </div>

                <p className="text-gray-500 mt-2">
                  Si le score ou le résultat du match est incorrect,
                  vous pouvez envoyer un signalement à l'organisateur.
                </p>

              </div>

              <button
                onClick={openReportModal}
                className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-semibold transition"
              >
                <AlertTriangle size={17} />
                Signaler un problème
              </button>

            </div>

          </div>
        )}

      {/* Tournament navigation */}
      {match.tournament?.id && (
        <div className="flex justify-center pt-2">

          <button
            onClick={() =>
              navigate(`/tournaments/${match.tournament.id}`)
            }
            className="text-gray-400 hover:text-white transition text-sm"
          >
            ← Voir le tournoi et le bracket
          </button>

        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeReportModal}
        >

          <div
            className="w-full max-w-lg bg-[#0d0f15] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle
                    size={21}
                    className="text-red-400"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Signaler un problème
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    Match #{match.id}
                  </p>
                </div>

              </div>

              <button
                onClick={closeReportModal}
                disabled={reportLoading}
                className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>

            {/* Modal body */}
            <form
              onSubmit={submitReport}
              className="p-6 space-y-5"
            >

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Motif du signalement
                </label>

                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-[#151821] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500/50 transition"
                  disabled={reportLoading}
                >
                  <option value="">
                    Sélectionnez un motif
                  </option>

                  <option value="Résultat incorrect">
                    Résultat incorrect
                  </option>

                  <option value="Score incorrect">
                    Score incorrect
                  </option>

                  <option value="Triche / comportement suspect">
                    Triche / comportement suspect
                  </option>

                  <option value="Problème avec le joueur">
                    Problème avec le joueur
                  </option>

                  <option value="Autre">
                    Autre
                  </option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Description
                </label>

                <textarea
                  value={reportDescription}
                  onChange={(e) =>
                    setReportDescription(e.target.value)
                  }
                  placeholder="Expliquez le problème..."
                  rows={4}
                  maxLength={2000}
                  disabled={reportLoading}
                  className="w-full bg-[#151821] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-red-500/50 transition resize-none"
                />

                <p className="text-xs text-gray-600 mt-1 text-right">
                  {reportDescription.length}/2000
                </p>
              </div>

              {/* Evidence */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Preuve / lien
                  <span className="text-gray-600 font-normal ml-1">
                    (optionnel)
                  </span>
                </label>

                <input
                  type="url"
                  value={reportEvidence}
                  onChange={(e) =>
                    setReportEvidence(e.target.value)
                  }
                  placeholder="https://..."
                  maxLength={2000}
                  disabled={reportLoading}
                  className="w-full bg-[#151821] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-red-500/50 transition"
                />

                <p className="text-xs text-gray-600 mt-1">
                  Ajoutez un lien vers une preuve si nécessaire.
                </p>
              </div>

              {/* Error */}
              {reportError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={18}
                      className="text-red-400 mt-0.5 shrink-0"
                    />

                    <p className="text-sm text-red-400">
                      {reportError}
                    </p>
                  </div>
                </div>
              )}

              {/* Success */}
              {reportSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle
                      size={18}
                      className="text-green-400"
                    />

                    <p className="text-sm text-green-400">
                      {reportSuccess}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeReportModal}
                  disabled={reportLoading}
                  className="flex-1 px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-semibold transition disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={reportLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 px-5 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reportLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={17} />
                      Envoyer le signalement
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  )
}

export default MatchDetails
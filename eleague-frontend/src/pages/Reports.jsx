import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  User,
  Swords,
  X,
} from 'lucide-react'
import api from '../services/api'

function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedReport, setSelectedReport] = useState(null)
  const [action, setAction] = useState(null)
  const [resolution, setResolution] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const [player1Score, setPlayer1Score] = useState('')
const [player2Score, setPlayer2Score] = useState('')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/reports')

      setReports(response.data.reports || [])
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
        'Impossible de récupérer les signalements.'
      )
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'resolved':
        return {
          label: 'Résolu',
          icon: CheckCircle,
          className:
            'bg-green-500/10 text-green-400 border-green-500/20',
        }

      case 'rejected':
        return {
          label: 'Rejeté',
          icon: XCircle,
          className:
            'bg-gray-500/10 text-gray-400 border-gray-500/20',
        }

      default:
        return {
          label: 'En attente',
          icon: Clock,
          className:
            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        }
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

 const openActionModal = (report, type) => {
  setSelectedReport(report)
  setAction(type)
  setResolution('')
  setActionError('')

  if (type === 'correct-score') {
    setPlayer1Score(
      String(report.match?.player1_score ?? 0)
    )

    setPlayer2Score(
      String(report.match?.player2_score ?? 0)
    )
  } else {
    setPlayer1Score('')
    setPlayer2Score('')
  }
}

  const closeActionModal = () => {
  if (actionLoading) return

  setSelectedReport(null)
  setAction(null)
  setResolution('')
  setActionError('')
  setPlayer1Score('')
  setPlayer2Score('')
}
  const submitAction = async (e) => {
  e.preventDefault()

  if (action === 'correct-score') {
    if (
      player1Score === '' ||
      player2Score === ''
    ) {
      setActionError(
        'Veuillez saisir les deux scores.'
      )
      return
    }

    const score1 = Number(player1Score)
    const score2 = Number(player2Score)

    if (
      !Number.isInteger(score1) ||
      !Number.isInteger(score2) ||
      score1 < 0 ||
      score2 < 0
    ) {
      setActionError(
        'Les scores doivent être des nombres entiers positifs.'
      )
      return
    }

    if (score1 === score2) {
      setActionError(
        'Un match ne peut pas se terminer par un nul.'
      )
      return
    }
  }

  if (!resolution.trim()) {
    setActionError(
      'Veuillez expliquer la décision prise.'
    )
    return
  }

  try {
    setActionLoading(true)
    setActionError('')

    let endpoint = ''
    let payload = {
      resolution,
    }

    if (action === 'resolve') {
      endpoint = `/reports/${selectedReport.id}/resolve`
    }

    if (action === 'reject') {
      endpoint = `/reports/${selectedReport.id}/reject`
    }

    if (action === 'correct-score') {
      endpoint = `/reports/${selectedReport.id}/correct-score`

      payload = {
        player1_score: Number(player1Score),
        player2_score: Number(player2Score),
        resolution,
      }
    }

    const response = await api.put(
      endpoint,
      payload
    )

    const updatedReport = response.data.report

    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === updatedReport.id
          ? updatedReport
          : report
      )
    )

    closeActionModal()

  } catch (err) {
    console.error(err)

    setActionError(
      err.response?.data?.message ||
      'Impossible de traiter ce signalement.'
    )
  } finally {
    setActionLoading(false)
  }
}

  const pendingCount = reports.filter(
    (report) => report.status === 'pending'
  ).length

  const resolvedCount = reports.filter(
    (report) => report.status === 'resolved'
  ).length

  const rejectedCount = reports.filter(
    (report) => report.status === 'rejected'
  ).length

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">

          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />

          <p className="text-gray-400 mt-4">
            Chargement des signalements...
          </p>

        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle
              size={24}
              className="text-red-400"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Reports & Disputes
            </h1>

            <p className="text-gray-500 mt-1">
              Gérez les signalements envoyés par les joueurs.
            </p>
          </div>

        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3">

            <AlertTriangle
              size={20}
              className="text-red-400"
            />

            <p className="text-red-400">
              {error}
            </p>

          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Pending */}
        <div className="bg-[#0d0f15] border border-yellow-500/20 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                En attente
              </p>

              <p className="text-3xl font-black text-yellow-400 mt-2">
                {pendingCount}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Clock
                size={21}
                className="text-yellow-400"
              />
            </div>

          </div>

        </div>

        {/* Resolved */}
        <div className="bg-[#0d0f15] border border-green-500/20 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Résolus
              </p>

              <p className="text-3xl font-black text-green-400 mt-2">
                {resolvedCount}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle
                size={21}
                className="text-green-400"
              />
            </div>

          </div>

        </div>

        {/* Rejected */}
        <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Rejetés
              </p>

              <p className="text-3xl font-black text-gray-300 mt-2">
                {rejectedCount}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center">
              <XCircle
                size={21}
                className="text-gray-400"
              />
            </div>

          </div>

        </div>

      </div>

      {/* Reports */}
      <div className="space-y-4">

        {reports.length === 0 ? (
          <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-10 text-center">

            <AlertTriangle
              size={35}
              className="text-gray-600 mx-auto"
            />

            <h2 className="text-lg font-bold mt-4">
              Aucun signalement
            </h2>

            <p className="text-gray-500 mt-2">
              Aucun report n'a encore été envoyé.
            </p>

          </div>
        ) : (
          reports.map((report) => {

            const status = getStatusConfig(report.status)
            const StatusIcon = status.icon

            const player1 =
              report.match?.player1

            const player2 =
              report.match?.player2

            return (
              <div
                key={report.id}
                className="bg-[#0d0f15] border border-white/10 rounded-2xl overflow-hidden"
              >

                {/* Top */}
                <div className="px-6 py-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle
                        size={19}
                        className="text-red-400"
                      />
                    </div>

                    <div>

                      <p className="font-bold">
                        Report #{report.id}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Match #{report.match_id}
                      </p>

                    </div>

                  </div>

                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold w-fit ${status.className}`}
                  >
                    <StatusIcon size={14} />
                    {status.label}
                  </div>

                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                  {/* Match */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">

                    <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-3">
                      <Swords size={14} />
                      Match
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                      <div>
                        <p className="font-semibold">
                          {getPlayerName(player1)}
                        </p>

                        <p className="text-gray-600 text-xs mt-1">
                          vs
                        </p>

                        <p className="font-semibold mt-1">
                          {getPlayerName(player2)}
                        </p>
                      </div>

                      <div className="text-left md:text-right">

                        <p className="text-xs text-gray-500">
                          Score
                        </p>

                        <p className="text-2xl font-black mt-1">
                          {report.match?.player1_score}
                          <span className="text-gray-600 mx-2">
                            :
                          </span>
                          {report.match?.player2_score}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* Players */}
                  <div className="grid md:grid-cols-2 gap-4">

                    {/* Reported by */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">

                      <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-3">
                        <User size={14} />
                        Signalé par
                      </div>

                      <p className="font-semibold">
                        {report.reported_by?.name ||
  'Unknown user'}
                      </p>

                      <p className="text-gray-500 text-sm mt-1">
                        {report.reported_by?.email || ''}
                      </p>

                    </div>

                    {/* Against */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">

                      <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-3">
                        <User size={14} />
                        Concerné
                      </div>

                      <p className="font-semibold">
                        {getPlayerName(
  report.against_player
)}
                      </p>

                    </div>

                  </div>

                  {/* Reason */}
                  <div>

                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Motif
                    </p>

                    <p className="font-semibold mt-2">
                      {report.reason}
                    </p>

                  </div>

                  {/* Description */}
                  {report.description && (
                    <div>

                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        Description
                      </p>

                      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mt-2">

                        <p className="text-gray-300 text-sm leading-relaxed">
                          {report.description}
                        </p>

                      </div>

                    </div>
                  )}

                  {/* Evidence */}
                  {report.evidence && (
                    <div>

                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        Preuve
                      </p>

                      <a
                        href={report.evidence}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 text-blue-400 hover:text-blue-300 text-sm transition break-all"
                      >
                        <ExternalLink size={15} />
                        Voir la preuve
                      </a>

                    </div>
                  )}

                  {/* Resolution */}
                  {report.resolution && (
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">

                      <p className="text-xs text-blue-400 uppercase tracking-wider">
                        Décision
                      </p>

                      <p className="text-gray-300 text-sm mt-2">
                        {report.resolution}
                      </p>

                    </div>
                  )}

                  {/* Actions */}
                  {report.status === 'pending' && (
  <div className="flex flex-col sm:flex-row gap-3 pt-2">

    {/* Resolve */}
    <button
      onClick={() =>
        openActionModal(report, 'resolve')
      }
      className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 px-5 py-3 rounded-xl font-semibold transition"
    >
      <CheckCircle size={17} />
      Résoudre
    </button>

    {/* Correct Score */}
    {report.match?.tournament?.status !== 'completed' && (
      <button
        onClick={() =>
          openActionModal(report, 'correct-score')
        }
        className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-semibold transition"
      >
        <Swords size={17} />
        Corriger le score
      </button>
    )}

    {/* Reject */}
    <button
      onClick={() =>
        openActionModal(report, 'reject')
      }
      className="flex-1 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-xl font-semibold transition"
    >
      <XCircle size={17} />
      Rejeter
    </button>

  </div>
)}

                </div>

              </div>
            )
          })
        )}

      </div>

      {/* Action Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeActionModal}
        >

          <div
            className="w-full max-w-lg bg-[#0d0f15] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">

              <div>

                <h2 className="text-xl font-bold">
                  {action === 'resolve'
                    ? 'Résoudre le signalement'
                    : 'Rejeter le signalement'}
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Report #{selectedReport.id}
                </p>

              </div>

              <button
                onClick={closeActionModal}
                disabled={actionLoading}
                className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                <X size={19} />
              </button>

            </div>

            {/* Form */}
            <form
  onSubmit={submitAction}
  className="p-6 space-y-5"
>

  {/* Correct Score */}
  {action === 'correct-score' && (
    <div className="space-y-5">

      {/* Current score */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">

        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Score actuel
        </p>

        <div className="flex items-center justify-between">

          <div>
            <p className="font-semibold">
              {getPlayerName(
                selectedReport.match?.player1
              )}
            </p>

            <p className="text-gray-500 text-sm">
              {selectedReport.match?.player1_score}
            </p>
          </div>

          <span className="text-gray-600 font-bold">
            :
          </span>

          <div className="text-right">
            <p className="font-semibold">
              {getPlayerName(
                selectedReport.match?.player2
              )}
            </p>

            <p className="text-gray-500 text-sm">
              {selectedReport.match?.player2_score}
            </p>
          </div>

        </div>

      </div>

      {/* New score */}
      <div>

        <label className="block text-sm font-semibold text-gray-300 mb-3">
          Nouveau score
        </label>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="block text-xs text-gray-500 mb-2">
              {getPlayerName(
                selectedReport.match?.player1
              )}
            </label>

            <input
              type="number"
              min="0"
              value={player1Score}
              onChange={(e) =>
                setPlayer1Score(e.target.value)
              }
              disabled={actionLoading}
              className="w-full bg-[#151821] border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl font-bold outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">
              {getPlayerName(
                selectedReport.match?.player2
              )}
            </label>

            <input
              type="number"
              min="0"
              value={player2Score}
              onChange={(e) =>
                setPlayer2Score(e.target.value)
              }
              disabled={actionLoading}
              className="w-full bg-[#151821] border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl font-bold outline-none focus:border-blue-500/50"
            />
          </div>

        </div>

      </div>

    </div>
  )}

  {/* Resolution */}
  <div>

    <label className="block text-sm font-semibold text-gray-300 mb-2">
      {action === 'correct-score'
        ? 'Raison de la correction'
        : 'Décision'}
    </label>

    <textarea
      value={resolution}
      onChange={(e) =>
        setResolution(e.target.value)
      }
      placeholder={
        action === 'correct-score'
          ? 'Expliquez pourquoi le score a été corrigé...'
          : action === 'resolve'
            ? 'Expliquez comment le signalement a été résolu...'
            : 'Expliquez pourquoi le signalement est rejeté...'
      }
      rows={5}
      maxLength={2000}
      disabled={actionLoading}
      className="w-full bg-[#151821] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition resize-none"
    />

    <p className="text-xs text-gray-600 mt-1 text-right">
      {resolution.length}/2000
    </p>

  </div>

  {/* Error */}
  {actionError && (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">

      <p className="text-sm text-red-400">
        {actionError}
      </p>

    </div>
  )}

  {/* Buttons */}
  <div className="flex flex-col-reverse sm:flex-row gap-3">

    <button
      type="button"
      onClick={closeActionModal}
      disabled={actionLoading}
      className="flex-1 px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-semibold transition"
    >
      Annuler
    </button>

    <button
      type="submit"
      disabled={actionLoading}
      className={`flex-1 px-5 py-3 rounded-xl font-semibold transition disabled:opacity-50 ${
        action === 'resolve'
          ? 'bg-green-600 hover:bg-green-500'
          : action === 'correct-score'
            ? 'bg-blue-600 hover:bg-blue-500'
            : 'bg-gray-600 hover:bg-gray-500'
      }`}
    >
      {actionLoading
        ? 'Traitement...'
        : action === 'resolve'
          ? 'Confirmer la résolution'
          : action === 'correct-score'
            ? 'Confirmer la correction'
            : 'Confirmer le rejet'}
    </button>

  </div>

</form>

          </div>

        </div>
      )}

    </div>
  )
}

export default Reports
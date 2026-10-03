import { useEffect, useState } from 'react'
import {
  CheckCircle,
  XCircle,
  Trophy,
  Clock,
  Image as ImageIcon,
  ZoomIn,
  RefreshCw,
  User,
} from 'lucide-react'
import api from '../services/api'

function OrganizerResults() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/organizer/results')

      setResults(response.data.results || [])
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
          'Impossible de récupérer les résultats.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (resultId) => {
    try {
      setProcessing(resultId)
      setError('')

      await api.post(`/results/${resultId}/verify`)

      setResults((current) =>
        current.filter((result) => result.id !== resultId)
      )
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
          'Impossible de vérifier le résultat.'
      )
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (resultId) => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir rejeter ce résultat ?'
    )

    if (!confirmed) {
      return
    }

    try {
      setProcessing(resultId)
      setError('')

      await api.post(`/results/${resultId}/reject`)

      setResults((current) =>
        current.filter((result) => result.id !== resultId)
      )
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
          'Impossible de rejeter le résultat.'
      )
    } finally {
      setProcessing(null)
    }
  }

  const getPlayerName = (player) => {
    if (!player) return 'TBD'

    return player.nickname || player.user?.name || 'Player'
  }

  const getSubmitterName = (result) => {
    return (
      result.submitted_by?.name ||
      result.submittedBy?.name ||
      result.user?.name ||
      'Player'
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />

          <p className="text-gray-400 mt-4">
            Chargement des résultats...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
              <Trophy
                size={24}
                className="text-blue-400"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                Organizer Verification
              </h1>

              <p className="text-gray-500 mt-1">
                Review submitted match results
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchResults}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
        >
          <RefreshCw size={17} />
          Refresh
        </button>

      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <p className="text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* EMPTY */}
      {results.length === 0 ? (
        <div className="bg-[#0d0f15] border border-white/10 rounded-3xl p-12 text-center">

          <CheckCircle
            size={48}
            className="text-green-400 mx-auto"
          />

          <h2 className="text-xl font-bold mt-4">
            No Pending Results
          </h2>

          <p className="text-gray-500 mt-2">
            All submitted results have been processed.
          </p>

        </div>
      ) : (

        <div className="space-y-6">

          {results.map((result) => {

            const match = result.match

            const player1 = match?.player1
            const player2 = match?.player2

            const player1Name = getPlayerName(player1)
            const player2Name = getPlayerName(player2)

            return (
              <div
                key={result.id}
                className="bg-[#0d0f15] border border-white/10 rounded-3xl overflow-hidden shadow-xl"
              >

                {/* MATCH HEADER */}
                <div className="p-6 border-b border-white/10">

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div>

                      <p className="text-sm text-blue-400 font-semibold">
                        {match?.tournament?.name || 'Tournament'}
                      </p>

                      <p className="text-gray-500 text-sm mt-1">
                        {match?.tournament?.game?.name || 'Game'}
                      </p>

                    </div>

                    <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/10 px-3 py-2 rounded-lg">
                      <Clock size={16} />
                      Pending verification
                    </div>

                  </div>

                </div>

                <div className="p-6">

                  {/* PLAYERS + SCORE */}
                  <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-6">

                    {/* PLAYER 1 */}
                    <div className="text-center">

                      <div className="w-20 h-20 mx-auto rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-2xl font-bold text-blue-400">
                        {player1Name.charAt(0).toUpperCase()}
                      </div>

                      <p className="font-semibold mt-3">
                        {player1Name}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Player 1
                      </p>

                    </div>

                    {/* SCORE */}
                    <div className="text-center">

                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Submitted Score
                      </p>

                      <div className="flex items-center justify-center gap-4">

                        <span className="text-5xl font-black">
                          {result.player1_score}
                        </span>

                        <span className="text-gray-600 text-2xl">
                          :
                        </span>

                        <span className="text-5xl font-black">
                          {result.player2_score}
                        </span>

                      </div>

                    </div>

                    {/* PLAYER 2 */}
                    <div className="text-center">

                      <div className="w-20 h-20 mx-auto rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-2xl font-bold text-purple-400">
                        {player2Name.charAt(0).toUpperCase()}
                      </div>

                      <p className="font-semibold mt-3">
                        {player2Name}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Player 2
                      </p>

                    </div>

                  </div>

                  {/* SUBMITTED BY */}
                  <div className="mt-8 flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-4">

                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
                      <User
                        size={17}
                        className="text-gray-400"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Result submitted by
                      </p>

                      <p className="text-sm font-semibold">
                        {getSubmitterName(result)}
                      </p>
                    </div>

                  </div>

                  {/* SCREENSHOT */}
                  {result.screenshot && (
                    <div className="mt-8">

                      <div className="flex items-center justify-between mb-3">

                        <div className="flex items-center gap-2">

                          <ImageIcon
                            size={18}
                            className="text-blue-400"
                          />

                          <p className="text-sm font-semibold">
                            Match Screenshot
                          </p>

                        </div>

                        <span className="text-xs text-gray-500">
                          Click to enlarge
                        </span>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImage(result.screenshot)
                        }
                        className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                      >

                        <img
                          src={result.screenshot}
                          alt="Match result screenshot"
                          className="w-full max-h-[500px] object-contain mx-auto transition duration-300 group-hover:scale-[1.01]"
                        />

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">

                          <div className="opacity-0 group-hover:opacity-100 transition bg-black/70 rounded-full p-4">

                            <ZoomIn
                              size={24}
                              className="text-white"
                            />

                          </div>

                        </div>

                      </button>

                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">

                    <button
                      onClick={() => handleVerify(result.id)}
                      disabled={processing === result.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 px-5 py-3 rounded-xl font-semibold transition"
                    >

                      <CheckCircle size={18} />

                      {processing === result.id
                        ? 'Processing...'
                        : 'Verify Result'}

                    </button>

                    <button
                      onClick={() => handleReject(result.id)}
                      disabled={processing === result.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 disabled:opacity-50 text-red-400 px-5 py-3 rounded-xl font-semibold transition"
                    >

                      <XCircle size={18} />

                      Reject Result

                    </button>

                  </div>

                </div>

              </div>
            )
          })}

        </div>
      )}

      {/* IMAGE MODAL */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >

          <div
            className="relative max-w-6xl max-h-[90vh]"
            onClick={(event) => event.stopPropagation()}
          >

            <img
              src={selectedImage}
              alt="Match screenshot enlarged"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />

            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-xl"
            >
              <XCircle size={22} />
            </button>

          </div>

        </div>
      )}

    </div>
  )
}

export default OrganizerResults
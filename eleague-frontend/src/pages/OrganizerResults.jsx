import React, { useEffect, useState } from 'react'
import { Check, X, Trophy, Image as ImageIcon, RefreshCw } from 'lucide-react'
import api from '../services/api'

export default function OrganizerResults() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/organizer/results')

      const data = response.data

      if (Array.isArray(data)) {
        setResults(data)
      } else if (Array.isArray(data.results)) {
        setResults(data.results)
      } else if (Array.isArray(data.data)) {
        setResults(data.data)
      } else {
        setResults([])
      }
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
          'Unable to load pending results.'
      )
    } finally {
      setLoading(false)
    }
  }

  const verifyResult = async (resultId) => {
    try {
      setProcessingId(resultId)
      setError('')
      setMessage('')

      await api.post(`/results/${resultId}/verify`)

      setResults((current) =>
        current.filter((result) => result.id !== resultId)
      )

      setMessage(
        'Result verified successfully. The winner has been advanced in the bracket.'
      )
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
          'Unable to verify this result.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  const rejectResult = async (resultId) => {
    const confirmed = window.confirm(
      'Are you sure you want to reject this result?'
    )

    if (!confirmed) {
      return
    }

    try {
      setProcessingId(resultId)
      setError('')
      setMessage('')

      await api.post(`/results/${resultId}/reject`)

      setResults((current) =>
        current.filter((result) => result.id !== resultId)
      )

      setMessage(
        'Result rejected. The match is available for a new submission.'
      )
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
          'Unable to reject this result.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  const getPlayerName = (player) => {
    if (!player) {
      return 'Unknown player'
    }

    return (
      player.user?.name ||
      player.name ||
      player.username ||
      `Player #${player.id}`
    )
  }

  const getTournamentName = (result) => {
    return (
      result.match?.tournament?.name ||
      result.tournament?.name ||
      'Tournament'
    )
  }

  const getGameName = (result) => {
    return (
      result.match?.tournament?.game?.name ||
      result.match?.tournament?.game?.title ||
      result.tournament?.game?.name ||
      'Game'
    )
  }

  const getPlayer1 = (result) => {
    return (
      result.match?.player1 ||
      result.match?.player_1 ||
      null
    )
  }

  const getPlayer2 = (result) => {
    return (
      result.match?.player2 ||
      result.match?.player_2 ||
      null
    )
  }

  const getScore1 = (result) => {
    return (
      result.match?.player1_score ??
      result.player1_score ??
      0
    )
  }

  const getScore2 = (result) => {
    return (
      result.match?.player2_score ??
      result.player2_score ??
      0
    )
  }

  const getScreenshot = (result) => {
    return (
      result.screenshot_url ||
      result.screenshot ||
      null
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <RefreshCw
              size={24}
              className="animate-spin text-gray-500"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Result Verification
            </h1>

            <p className="text-gray-500 mt-1">
              Review and verify results submitted by players.
            </p>
          </div>

          <button
            onClick={loadResults}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* Empty */}
        {results.length === 0 && (
          <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
            <Trophy
              size={48}
              className="mx-auto mb-4 text-gray-300"
            />

            <h2 className="text-xl font-semibold text-gray-900">
              No Pending Results
            </h2>

            <p className="text-gray-500 mt-2">
              There are no match results waiting for verification.
            </p>
          </div>
        )}

        {/* Results */}
        <div className="space-y-6">
          {results.map((result) => {
            const player1 = getPlayer1(result)
            const player2 = getPlayer2(result)

            const score1 = getScore1(result)
            const score2 = getScore2(result)

            const screenshot = getScreenshot(result)

            const isProcessing =
              processingId === result.id

            return (
              <div
                key={result.id}
                className="rounded-2xl border bg-white shadow-sm overflow-hidden"
              >
                {/* Tournament info */}
                <div className="border-b bg-gray-50 px-6 py-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {getTournamentName(result)}
                      </h2>

                      <p className="text-sm text-gray-500">
                        {getGameName(result)}
                      </p>
                    </div>

                    <span className="inline-flex w-fit items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                      Pending Verification
                    </span>
                  </div>
                </div>

                <div className="p-6">

                  {/* Match */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">

                    {/* Player 1 */}
                    <div className="text-center md:text-right">
                      <div className="font-semibold text-lg text-gray-900">
                        {getPlayerName(player1)}
                      </div>

                      <div className="text-sm text-gray-500 mt-1">
                        Player 1
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {score1}
                        <span className="mx-2 text-gray-400">
                          -
                        </span>
                        {score2}
                      </div>

                      {result.match?.round && (
                        <div className="text-xs text-gray-500 mt-1">
                          Round {result.match.round}
                        </div>
                      )}
                    </div>

                    {/* Player 2 */}
                    <div className="text-center md:text-left">
                      <div className="font-semibold text-lg text-gray-900">
                        {getPlayerName(player2)}
                      </div>

                      <div className="text-sm text-gray-500 mt-1">
                        Player 2
                      </div>
                    </div>
                  </div>

                  {/* Screenshot */}
                  {screenshot && (
                    <div className="mt-6 border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
                        <ImageIcon size={17} />
                        Submitted Screenshot
                      </div>

                      <a
                        href={screenshot}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block"
                      >
                        <img
                          src={screenshot}
                          alt="Match result screenshot"
                          className="max-h-80 max-w-full rounded-lg border object-contain"
                        />
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t">

                    <button
                      onClick={() =>
                        verifyResult(result.id)
                      }
                      disabled={isProcessing}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check size={18} />

                      {isProcessing
                        ? 'Processing...'
                        : 'Verify Result'}
                    </button>

                    <button
                      onClick={() =>
                        rejectResult(result.id)
                      }
                      disabled={isProcessing}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-3 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={18} />

                      Reject Result
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
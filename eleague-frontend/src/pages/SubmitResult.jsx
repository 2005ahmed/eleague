import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../services/api'

export default function SubmitResult() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [match, setMatch] = useState(null)
  const [player, setPlayer] = useState(null)

  const [player1Score, setPlayer1Score] = useState('')
  const [player2Score, setPlayer2Score] = useState('')
  const [screenshot, setScreenshot] = useState(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [matchResponse, meResponse] = await Promise.all([
        api.get(`/matches/${id}`),
        api.get('/auth/me'),
      ])

      const matchData = matchResponse.data.match ?? matchResponse.data
      const playerData =
        meResponse.data.player ?? meResponse.data.user?.player

      setMatch(matchData)
      setPlayer(playerData)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
          'Unable to load match information.'
      )
    } finally {
      setLoading(false)
    }
  }

  const hasPlayer1 = Boolean(
    match?.player1_id || match?.player1?.id
  )

  const hasPlayer2 = Boolean(
    match?.player2_id || match?.player2?.id
  )

  const hasBothPlayers = hasPlayer1 && hasPlayer2

  const playerId = player?.id

  const isParticipant =
    hasBothPlayers &&
    playerId &&
    (
      Number(match?.player1_id || match?.player1?.id) === Number(playerId) ||
      Number(match?.player2_id || match?.player2?.id) === Number(playerId)
    )

  /*
  |--------------------------------------------------------------------------
  | Tournament format
  |--------------------------------------------------------------------------
  */

  const tournamentFormat =
    match?.tournament?.format ||
    match?.tournament?.data?.format ||
    null

  const isRoundRobin =
    tournamentFormat === 'round_robin'

  const isKnockout =
    tournamentFormat === 'knockout'

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      setScreenshot(null)
      return
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Screenshot must be JPG, PNG or WEBP.')
      event.target.value = ''
      setScreenshot(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot must be smaller than 5MB.')
      event.target.value = ''
      setScreenshot(null)
      return
    }

    setError('')
    setScreenshot(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (!match) {
      setError('Match information is not available.')
      return
    }

    if (!hasBothPlayers) {
      setError(
        'This match is not ready yet. Both players must be assigned before submitting a result.'
      )
      return
    }

    if (!isParticipant) {
      setError('You are not a participant in this match.')
      return
    }

    if (match.status !== 'scheduled') {
      setError('This match is not available for result submission.')
      return
    }

    const score1 = Number(player1Score)
    const score2 = Number(player2Score)

    if (
      player1Score === '' ||
      player2Score === '' ||
      Number.isNaN(score1) ||
      Number.isNaN(score2)
    ) {
      setError('Please enter both scores.')
      return
    }

    if (score1 < 0 || score2 < 0) {
      setError('Scores cannot be negative.')
      return
    }

    /*
    |--------------------------------------------------------------------------
    | Draw validation
    |--------------------------------------------------------------------------
    |
    | Knockout -> draw forbidden
    | Round Robin -> draw allowed
    |
    */

    if (
      isKnockout &&
      score1 === score2
    ) {
      setError(
        'Draws are not allowed in knockout tournaments.'
      )
      return
    }

    try {
      setSubmitting(true)

      const formData = new FormData()

      formData.append('player1_score', score1)
      formData.append('player2_score', score2)

      if (screenshot) {
        formData.append('screenshot', screenshot)
      }

      await api.post(`/matches/${id}/result`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setSuccess(true)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
          'Unable to submit the result.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">
          Loading match...
        </div>
      </div>
    )
  }

  if (error && !match) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(`/matches/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={18} />
            Back to match
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <CheckCircle
              size={56}
              className="mx-auto mb-4 text-green-500"
            />

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Result Submitted
            </h1>

            <p className="text-gray-600 mb-6">
              Your result has been submitted and is waiting for organizer verification.
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => navigate(`/matches/${id}`)}
                className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
              >
                Back to Match
              </button>

              <button
                onClick={() => navigate('/matches')}
                className="px-5 py-3 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                My Matches
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!hasBothPlayers) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(`/matches/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={18} />
            Back to match
          </button>

          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <AlertCircle
              size={52}
              className="mx-auto mb-4 text-yellow-500"
            />

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Waiting for Players
            </h1>

            <p className="text-gray-600">
              This match is not ready yet. Both players must be assigned
              before a result can be submitted.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isParticipant) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(`/matches/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={18} />
            Back to match
          </button>

          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <AlertCircle
              size={52}
              className="mx-auto mb-4 text-red-500"
            />

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Not a Participant
            </h1>

            <p className="text-gray-600">
              Only players participating in this match can submit a result.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(`/matches/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={18} />
          Back to match
        </button>

        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Submit Match Result
            </h1>

            <p className="text-gray-500 mt-1">
              Enter the final score and optionally provide a screenshot.
            </p>

            {/* Round Robin information */}
            {isRoundRobin && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                Draws are allowed in Round Robin tournaments.
                A draw gives each player 1 point.
              </div>
            )}

            {/* Knockout information */}
            {isKnockout && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                This is a knockout match. A draw is not allowed.
              </div>
            )}
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border rounded-xl p-5">
              <div className="text-sm text-gray-500 mb-2">
                Player 1
              </div>

              <div className="font-semibold text-gray-900 mb-4">
                {match.player1?.user?.name ||
                  match.player1?.name ||
                  'Player 1'}
              </div>

              <input
                type="number"
                min="0"
                value={player1Score}
                onChange={(e) => setPlayer1Score(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-lg"
                placeholder="Score"
              />
            </div>

            <div className="border rounded-xl p-5">
              <div className="text-sm text-gray-500 mb-2">
                Player 2
              </div>

              <div className="font-semibold text-gray-900 mb-4">
                {match.player2?.user?.name ||
                  match.player2?.name ||
                  'Player 2'}
              </div>

              <input
                type="number"
                min="0"
                value={player2Score}
                onChange={(e) => setPlayer2Score(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-lg"
                placeholder="Score"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Screenshot
              <span className="font-normal text-gray-400">
                {' '}
                (optional)
              </span>
            </label>

            <label className="flex items-center justify-center gap-3 border-2 border-dashed rounded-xl p-6 cursor-pointer hover:bg-gray-50">
              <Upload size={20} />

              <span className="text-sm text-gray-600">
                {screenshot
                  ? screenshot.name
                  : 'Upload JPG, PNG or WEBP — max 5MB'}
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleScreenshotChange}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-gray-900 text-white py-3 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? 'Submitting...'
              : 'Submit Result'}
          </button>
        </div>
      </div>
    </div>
  )
}
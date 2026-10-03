import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  X,
  ShieldCheck,
} from 'lucide-react'
import api from '../services/api'

export default function SubmitResult() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [match, setMatch] = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState(null)

  const [myScore, setMyScore] = useState('')
  const [opponentScore, setOpponentScore] = useState('')

  const [screenshotFile, setScreenshotFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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

      const loadedMatch =
        matchResponse.data.match ?? matchResponse.data

      const player =
        meResponse.data.player ?? null

      setMatch(loadedMatch)
      setCurrentPlayer(player)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
          'Impossible de charger les informations du match.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const isPlayer1 =
    match &&
    currentPlayer &&
    match.player1_id === currentPlayer.id

  const isPlayer2 =
    match &&
    currentPlayer &&
    match.player2_id === currentPlayer.id

  const isParticipant = isPlayer1 || isPlayer2

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setError('')

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 MB.")
      event.target.value = ''
      return
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Format invalide. Utilisez JPG, PNG ou WEBP.')
      event.target.value = ''
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setScreenshotFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const removeScreenshot = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setScreenshotFile(null)
    setPreviewUrl(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (!match || !currentPlayer) {
      setError('Informations du match introuvables.')
      return
    }

    if (match.status !== 'scheduled') {
      setError(
        'Ce match n’est plus disponible pour envoyer un résultat.'
      )
      return
    }

    if (!isParticipant) {
      setError('Vous ne participez pas à ce match.')
      return
    }

    if (myScore === '' || opponentScore === '') {
      setError('Veuillez saisir les deux scores.')
      return
    }

    const myScoreNumber = Number(myScore)
    const opponentScoreNumber = Number(opponentScore)

    if (
      !Number.isInteger(myScoreNumber) ||
      !Number.isInteger(opponentScoreNumber)
    ) {
      setError('Les scores doivent être des nombres entiers.')
      return
    }

    if (myScoreNumber < 0 || opponentScoreNumber < 0) {
      setError('Les scores ne peuvent pas être négatifs.')
      return
    }

    if (myScoreNumber === opponentScoreNumber) {
      setError(
        'Un match à élimination directe ne peut pas être nul.'
      )
      return
    }

    try {
      setSubmitting(true)

      const formData = new FormData()

      const player1Score = isPlayer1
        ? myScoreNumber
        : opponentScoreNumber

      const player2Score = isPlayer2
        ? myScoreNumber
        : opponentScoreNumber

      formData.append('player1_score', player1Score)
      formData.append('player2_score', player2Score)

      if (screenshotFile) {
        formData.append('screenshot', screenshotFile)
      }

      const response = await api.post(
        `/matches/${id}/result`,
        formData,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      )

      console.log('Result submitted:', response.data)

      setSuccess(true)
    } catch (err) {
      console.error(err)

      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.screenshot?.[0] ||
        err.response?.data?.errors?.player1_score?.[0] ||
        err.response?.data?.errors?.player2_score?.[0] ||
        'Une erreur est survenue lors de l’envoi du résultat.'

      setError(message)
    } finally {
      setSubmitting(false)
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

  if (!match || !currentPlayer) {
    return (
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
        >
          <ArrowLeft size={18} />
          Retour
        </button>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-red-400">
          {error || 'Match introuvable.'}
        </div>

      </div>
    )
  }

  if (!isParticipant) {
    return (
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => navigate(`/matches/${id}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
        >
          <ArrowLeft size={18} />
          Retour au match
        </button>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">

          <h1 className="text-xl font-bold text-red-400">
            Accès refusé
          </h1>

          <p className="text-gray-400 mt-2">
            Vous ne participez pas à ce match.
          </p>

        </div>

      </div>
    )
  }

  if (match.status !== 'scheduled') {
    return (
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => navigate(`/matches/${id}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
        >
          <ArrowLeft size={18} />
          Retour au match
        </button>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">

          <div className="flex items-start gap-4">

            <ShieldCheck
              size={24}
              className="text-yellow-400 mt-1"
            />

            <div>
              <h1 className="text-xl font-bold text-yellow-400">
                Résultat déjà envoyé
              </h1>

              <p className="text-gray-400 mt-2">
                Ce match n’est plus disponible pour envoyer un
                nouveau résultat.
              </p>
            </div>

          </div>

        </div>

      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto pt-8">

        <div className="bg-[#11131a] border border-white/10 rounded-3xl p-8 text-center">

          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2
              size={34}
              className="text-green-400"
            />
          </div>

          <h1 className="text-2xl font-bold mb-3">
            Résultat envoyé !
          </h1>

          <p className="text-gray-400 mb-8">
            Votre résultat a été envoyé et attend maintenant
            la vérification de l’organisateur.
          </p>

          <div className="bg-[#08090d] border border-white/10 rounded-2xl p-5 mb-6">

            <div className="text-sm text-gray-500 mb-3">
              Score envoyé
            </div>

            <div className="text-2xl font-bold">
              {match.player1?.nickname || 'Player 1'}

              <span className="text-gray-500 mx-3">
                {isPlayer1
                  ? `${myScore} - ${opponentScore}`
                  : `${opponentScore} - ${myScore}`}
              </span>

              {match.player2?.nickname || 'Player 2'}
            </div>

          </div>

          <div className="grid sm:grid-cols-2 gap-3">

            <button
              onClick={() => navigate(`/matches/${id}`)}
              className="border border-white/10 hover:bg-white/5 transition rounded-xl py-3 font-semibold"
            >
              Voir le match
            </button>

            <button
              onClick={() => navigate('/matches')}
              className="bg-blue-600 hover:bg-blue-500 transition rounded-xl py-3 font-semibold"
            >
              Mes matchs
            </button>

          </div>

        </div>

      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <button
        onClick={() => navigate(`/matches/${id}`)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
      >
        <ArrowLeft size={18} />
        Retour au match
      </button>

      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          Soumettre le résultat
        </h1>

        <p className="text-gray-400 mt-2">
          Entrez le score final et ajoutez une preuve du match.
        </p>

      </div>

      {/* Match information */}
      <div className="bg-[#11131a] border border-white/10 rounded-3xl p-6 mb-6">

        <div className="text-xs uppercase tracking-wider text-gray-500 mb-5">
          {match.tournament?.name || 'Tournoi'}
        </div>

        <div className="flex items-center justify-between gap-4">

          {/* Player 1 */}
          <div className="flex-1 text-center">

            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">

              <span className="text-blue-400 font-bold text-xl">
                {match.player1?.nickname
                  ?.charAt(0)
                  ?.toUpperCase() || 'P'}
              </span>

            </div>

            <p className="font-semibold">
              {match.player1?.nickname || 'Player 1'}
            </p>

            {isPlayer1 && (
              <span className="inline-block mt-2 px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">
                Vous
              </span>
            )}

          </div>

          <div className="text-gray-500 font-bold">
            VS
          </div>

          {/* Player 2 */}
          <div className="flex-1 text-center">

            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-500/10 flex items-center justify-center">

              <span className="text-purple-400 font-bold text-xl">
                {match.player2?.nickname
                  ?.charAt(0)
                  ?.toUpperCase() || 'P'}
              </span>

            </div>

            <p className="font-semibold">
              {match.player2?.nickname || 'Player 2'}
            </p>

            {isPlayer2 && (
              <span className="inline-block mt-2 px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs">
                Vous
              </span>
            )}

          </div>

        </div>

      </div>

      <form onSubmit={handleSubmit}>

        {/* Score */}
        <div className="bg-[#11131a] border border-white/10 rounded-3xl p-6 mb-6">

          <h2 className="text-lg font-semibold mb-5">
            Score final
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <div>

              <label className="block text-sm text-gray-400 mb-2">
                Votre score
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={myScore}
                onChange={(e) => setMyScore(e.target.value)}
                disabled={submitting}
                placeholder="0"
                className="w-full bg-[#08090d] border border-white/10 rounded-xl px-4 py-4 text-2xl text-center outline-none focus:border-blue-500 transition"
              />

            </div>

            <div>

              <label className="block text-sm text-gray-400 mb-2">
                Score adverse
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={opponentScore}
                onChange={(e) =>
                  setOpponentScore(e.target.value)
                }
                disabled={submitting}
                placeholder="0"
                className="w-full bg-[#08090d] border border-white/10 rounded-xl px-4 py-4 text-2xl text-center outline-none focus:border-blue-500 transition"
              />

            </div>

          </div>

        </div>

        {/* Screenshot */}
        <div className="bg-[#11131a] border border-white/10 rounded-3xl p-6 mb-6">

          <div className="flex items-center gap-3 mb-2">

            <ImageIcon
              size={20}
              className="text-blue-400"
            />

            <h2 className="text-lg font-semibold">
              Screenshot du match
            </h2>

          </div>

          <p className="text-sm text-gray-500 mb-5">
            Ajoutez une capture d’écran montrant le résultat.
            JPG, PNG ou WEBP — maximum 5 MB.
          </p>

          {!previewUrl ? (
            <label
              className={`block cursor-pointer ${
                submitting
                  ? 'pointer-events-none opacity-50'
                  : ''
              }`}
            >

              <div className="border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-2xl p-8 text-center transition">

                <Upload
                  size={32}
                  className="mx-auto mb-3 text-gray-500"
                />

                <p className="font-medium mb-1">
                  Cliquez pour choisir une image
                </p>

                <p className="text-xs text-gray-500">
                  PNG, JPG ou WEBP jusqu’à 5 MB
                </p>

              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleScreenshotChange}
                disabled={submitting}
                className="hidden"
              />

            </label>
          ) : (
            <div className="relative">

              <img
                src={previewUrl}
                alt="Aperçu du screenshot"
                className="w-full max-h-[450px] object-contain rounded-2xl border border-white/10 bg-black"
              />

              {!submitting && (
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/80 hover:bg-red-500 flex items-center justify-center transition"
                >
                  <X size={18} />
                </button>
              )}

              <div className="mt-3 flex items-center justify-between text-sm">

                <span className="text-gray-400 truncate">
                  {screenshotFile?.name}
                </span>

                <span className="text-gray-500 ml-4">
                  {screenshotFile
                    ? `${(
                        screenshotFile.size /
                        1024 /
                        1024
                      ).toFixed(2)} MB`
                    : ''}
                </span>

              </div>

            </div>
          )}

        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition rounded-xl py-4 font-semibold flex items-center justify-center gap-2"
        >

          {submitting ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Upload size={18} />
              Envoyer le résultat
            </>
          )}

        </button>

      </form>

    </div>
  )
}
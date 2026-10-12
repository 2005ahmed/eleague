import React, { useEffect, useRef, useState } from 'react'
import { Send, MessageCircle, RefreshCw } from 'lucide-react'
import api from '../services/api'

export default function MatchChat({ match }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  const messagesEndRef = useRef(null)

  const matchId = match?.id

  const player1UserId = match?.player1?.user_id
  const player2UserId = match?.player2?.user_id

  const isParticipant =
    currentUser?.id &&
    (
      Number(currentUser.id) === Number(player1UserId) ||
      Number(currentUser.id) === Number(player2UserId)
    )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  const loadMessages = async (showLoader = false) => {
    if (!matchId || !isParticipant) {
      return
    }

    try {
      if (showLoader) {
        setLoading(true)
      }

      const response = await api.get(
        `/matches/${matchId}/messages`
      )

      setMessages(response.data.messages || [])
      setError('')
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
          'Unable to load chat messages.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get('/auth/me')

        setCurrentUser(
          response.data.user || response.data
        )
      } catch (err) {
        console.error(err)
      }
    }

    loadUser()
  }, [])

  useEffect(() => {
    if (!matchId || !isParticipant) {
      setLoading(false)
      return
    }

    loadMessages(true)

    const interval = setInterval(() => {
      loadMessages(false)
    }, 4000)

    return () => clearInterval(interval)
  }, [matchId, isParticipant])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const message = text.trim()

    if (!message || sending || !isParticipant) {
      return
    }

    try {
      setSending(true)
      setError('')

      const response = await api.post(
        `/matches/${matchId}/messages`,
        {
          message,
        }
      )

      const newMessage = response.data.message

      setMessages((current) => [
        ...current,
        newMessage,
      ])

      setText('')
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
          'Unable to send message.'
      )
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date) => {
    if (!date) {
      return ''
    }

    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!matchId) {
    return null
  }

  if (!isParticipant) {
    return null
  }

  return (
    <div className="mt-8 rounded-2xl border bg-white shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <MessageCircle size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Match Chat
            </h2>

            <p className="text-xs text-gray-500">
              Chat with your opponent
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadMessages(true)}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          title="Refresh"
        >
          <RefreshCw
            size={17}
            className={loading ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-5 space-y-3 bg-gray-50">

        {loading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500">
            No messages yet. Start the conversation.
          </div>
        ) : (
          messages.map((message) => {
            const isMine =
              Number(message.sender_id) ===
              Number(currentUser?.id)

            return (
              <div
                key={message.id}
                className={`flex ${
                  isMine
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? 'bg-gray-900 text-white rounded-br-md'
                      : 'bg-white border text-gray-900 rounded-bl-md'
                  }`}
                >
                  {!isMine && (
                    <div className="text-xs font-semibold mb-1 text-gray-500">
                      {message.sender?.name ||
                        'Opponent'}
                    </div>
                  )}

                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.message}
                  </div>

                  <div
                    className={`text-[10px] mt-1 ${
                      isMine
                        ? 'text-gray-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t p-4 flex gap-3"
      >
        <input
          type="text"
          value={text}
          onChange={(event) =>
            setText(event.target.value)
          }
          placeholder="Write a message..."
          maxLength={2000}
          disabled={sending}
          className="flex-1 rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-gray-200"
        />

        <button
          type="submit"
          disabled={
            sending ||
            !text.trim()
          }
          className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
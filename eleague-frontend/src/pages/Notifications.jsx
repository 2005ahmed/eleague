import { useEffect, useState } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Trophy,
  Swords,
  Info,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import api from '../services/api'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications')

      setNotifications(response.data.notifications?.data || [])
      setUnreadCount(response.data.unread_count || 0)
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      )

      setUnreadCount((current) => Math.max(0, current - 1))
    } catch (err) {
      console.error(err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all')

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      )

      setUnreadCount(0)
    } catch (err) {
      console.error(err)
    }
  }

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`)

      setNotifications((current) =>
        current.filter((notification) => notification.id !== id)
      )

      const deleted = notifications.find(
        (notification) => notification.id === id
      )

      if (deleted && !deleted.is_read) {
        setUnreadCount((current) => Math.max(0, current - 1))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getIcon = (type) => {
    if (type === 'tournament') {
      return <Trophy className="w-5 h-5 text-yellow-400" />
    }

    if (type === 'match') {
      return <Swords className="w-5 h-5 text-blue-400" />
    }

    if (type === 'warning') {
      return <AlertCircle className="w-5 h-5 text-orange-400" />
    }

    return <Info className="w-5 h-5 text-gray-400" />
  }

  const formatDate = (date) => {
    if (!date) return ''

    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          Chargement des notifications...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <Bell className="w-7 h-7 text-blue-400" />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">
                Notifications
              </h1>

              {unreadCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-blue-500 text-white text-xs font-bold">
                  {unreadCount} nouvelles
                </span>
              )}
            </div>

            <p className="text-gray-400 mt-1">
              Reste informé de ton activité eLeague
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
          >
            <CheckCheck className="w-4 h-4" />
            Tout marquer comme lu
          </button>
        )}

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Notifications */}
      <div className="rounded-3xl border border-white/10 bg-[#111827]/70 overflow-hidden">

        {notifications.length === 0 ? (
          <div className="py-20 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-600" />
            </div>

            <h2 className="text-lg font-semibold text-white">
              Aucune notification
            </h2>

            <p className="text-gray-500 text-sm mt-2">
              Tu recevras ici les notifications importantes.
            </p>

          </div>
        ) : (
          <div className="divide-y divide-white/5">

            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 flex gap-4 transition ${
                  notification.is_read
                    ? 'bg-transparent'
                    : 'bg-blue-500/[0.04]'
                }`}
              >

                {/* Icon */}
                <div
                  className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${
                    notification.is_read
                      ? 'bg-white/5'
                      : 'bg-blue-500/10'
                  }`}
                >
                  {getIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">

                    <div>
                      <h3
                        className={`font-semibold ${
                          notification.is_read
                            ? 'text-gray-300'
                            : 'text-white'
                        }`}
                      >
                        {notification.title}
                      </h3>

                      <p className="text-sm text-gray-400 mt-1">
                        {notification.message}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                    )}

                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-4">

                    <span className="text-xs text-gray-600">
                      {formatDate(notification.created_at)}
                    </span>

                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Marquer comme lu
                      </button>
                    )}

                    <button
                      onClick={() =>
                        deleteNotification(notification.id)
                      }
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  )
}
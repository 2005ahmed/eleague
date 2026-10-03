import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Trophy,
  Swords,
  Medal,
  Bell,
  User,
  Settings,
  LogOut,
  ClipboardCheck,
  FileWarning,
  ArrowLeftRight,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getPlayer, getUser, logout } from '../services/auth'
import api from '../services/api'

function DashboardLayout() {
  const navigate = useNavigate()

  const [user, setUser] = useState(getUser())
  const player = getPlayer()

  const [mode, setMode] = useState(
    localStorage.getItem('eLeague_mode') || 'player'
  )

  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)

  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  const notificationRef = useRef(null)

  // =====================================================
  // ROLE
  // =====================================================

  const isOrganizer =
    user?.is_organizer === true ||
    user?.role === 'organizer' ||
    user?.role === 'admin'

  const isAdmin = user?.role === 'admin'

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      logout()
      localStorage.removeItem('eLeague_mode')
      navigate('/login')
    }
  }

  // =====================================================
  // SWITCH MODE
  // =====================================================

  const switchMode = (newMode) => {
    if (newMode === 'organizer' && !isOrganizer) {
      return
    }

    localStorage.setItem('eLeague_mode', newMode)
    setMode(newMode)

    setShowNotifications(false)

    if (newMode === 'organizer') {
      navigate('/organizer/dashboard')
    } else {
      navigate('/')
    }
  }

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count')

      setUnreadCount(response.data.unread_count || 0)
    } catch (error) {
      console.error('Unread notifications error:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications')

      setNotifications(
        response.data.notifications?.data || []
      )

      setUnreadCount(
        response.data.unread_count || 0
      )
    } catch (error) {
      console.error('Notifications error:', error)
    }
  }

  // =====================================================
  // PENDING REPORTS
  // =====================================================

  const fetchPendingReports = async () => {
    if (!isOrganizer) {
      setPendingReports(0)
      return
    }

    try {
      const response = await api.get(
        '/reports/pending-count'
      )

      setPendingReports(
        response.data.pending_count || 0
      )
    } catch (error) {
      setPendingReports(0)
    }
  }

  // =====================================================
  // NOTIFICATION BELL
  // =====================================================

  const handleBellClick = async () => {
    const nextState = !showNotifications

    setShowNotifications(nextState)

    if (nextState) {
      await fetchNotifications()
    }
  }

  // =====================================================
  // READ NOTIFICATION
  // =====================================================

  const handleNotificationClick = async (
    notification
  ) => {
    try {
      if (!notification.is_read) {
        await api.put(
          `/notifications/${notification.id}/read`
        )

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  is_read: true,
                }
              : item
          )
        )

        setUnreadCount((count) =>
          Math.max(0, count - 1)
        )
      }
    } catch (error) {
      console.error(
        'Mark notification as read error:',
        error
      )
    }
  }

  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  const handleDeleteNotification = async (
    notificationId
  ) => {
    try {
      await api.delete(
        `/notifications/${notificationId}`
      )

      setNotifications((current) =>
        current.filter(
          (item) => item.id !== notificationId
        )
      )

      fetchUnreadCount()
    } catch (error) {
      console.error(
        'Delete notification error:',
        error
      )
    }
  }

  // =====================================================
  // INITIAL DATA
  // =====================================================

  useEffect(() => {
    fetchUnreadCount()
    fetchPendingReports()
  }, [isOrganizer])

  // =====================================================
  // AUTO REFRESH
  // =====================================================

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount()
      fetchPendingReports()
    }, 10000)

    return () => clearInterval(interval)
  }, [isOrganizer])

  // =====================================================
  // CLOSE NOTIFICATIONS OUTSIDE
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [])

  // =====================================================
  // PLAYER MENU
  // =====================================================

  const playerMenu = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Tournaments',
      path: '/tournaments',
      icon: Trophy,
    },
    {
      name: 'My Matches',
      path: '/matches',
      icon: Swords,
    },
    {
      name: 'Leaderboard',
      path: '/leaderboard',
      icon: Medal,
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: User,
    },
  ]

  // =====================================================
  // ORGANIZER MENU
  // =====================================================

  const organizerMenu = [
    {
      name: 'Dashboard',
      path: '/organizer/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Tournaments',
      path: '/tournaments',
      icon: Trophy,
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: User,
    },
    {
      name: 'Verification',
      path: '/organizer/results',
      icon: ClipboardCheck,
    },
    {
      name: 'Reports',
      path: '/organizer/reports',
      icon: FileWarning,
      badge: pendingReports,
    },
  ]

  const menu =
    mode === 'organizer'
      ? organizerMenu
      : playerMenu

  // =====================================================
  // DISPLAY NAME
  // =====================================================

  const displayName =
    mode === 'organizer'
      ? user?.name || 'Organizer'
      : player?.nickname ||
        user?.name ||
        'Player'

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="min-h-screen bg-[#08090d] text-white flex">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="w-64 border-r border-white/10 bg-[#0d0f15] p-5 hidden md:flex flex-col">

        {/* LOGO */}

        <div className="mb-8">
          <h1 className="text-2xl font-black">
            e<span className="text-blue-500">
              League
            </span>
          </h1>

          <p className="text-xs text-gray-500 mt-1">
            Competitive Gaming
          </p>
        </div>

        {/* MODE */}

        <div className="mb-6">

          <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-2">
            Current mode
          </div>

          <div className="bg-[#11141c] border border-white/10 rounded-xl p-1 flex">

            <button
              onClick={() => switchMode('player')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                mode === 'player'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Player
            </button>

            {isOrganizer && (
              <button
                onClick={() =>
                  switchMode('organizer')
                }
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                  mode === 'organizer'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                Organizer
              </button>
            )}

          </div>
        </div>

        {/* MENU */}

        <nav className="space-y-2 flex-1">

          {menu.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >

                <Icon size={19} />

                <span className="flex-1">
                  {item.name}
                </span>

                {item.badge > 0 && (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge > 99
                      ? '99+'
                      : item.badge}
                  </span>
                )}

              </NavLink>
            )
          })}

        </nav>

        {/* BOTTOM */}

        <div className="border-t border-white/10 pt-4 space-y-2">

          <button
            onClick={() =>
              mode === 'organizer'
                ? switchMode('player')
                : isOrganizer
                ? switchMode('organizer')
                : null
            }
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition"
          >
            <ArrowLeftRight size={19} />

            {mode === 'organizer'
              ? 'Player mode'
              : 'Organizer mode'}
          </button>

          <button
            onClick={() =>
              navigate('/settings')
            }
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition"
          >
            <Settings size={19} />

            Settings
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={19} />

            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="flex-1 min-w-0">

        {/* HEADER */}

        <header className="h-16 border-b border-white/10 bg-[#0b0c11] flex items-center justify-between px-4 sm:px-6">

          <div className="min-w-0">

            <span className="text-sm text-gray-500 hidden sm:inline">
              Welcome back,
            </span>

            <span className="ml-0 sm:ml-2 font-semibold truncate">
              {displayName}
            </span>

            <span className="ml-2 text-xs text-gray-600">
              {mode === 'organizer'
                ? 'Organizer'
                : 'Player'}
            </span>

          </div>

          <div className="flex items-center gap-3">

            {/* NOTIFICATIONS */}

            <div
              ref={notificationRef}
              className="relative"
            >

              <button
                onClick={handleBellClick}
                className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
                aria-label="Notifications"
              >

                <Bell size={21} />

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0b0c11]">
                    {unreadCount > 99
                      ? '99+'
                      : unreadCount}
                  </span>
                )}

              </button>

              {/* NOTIFICATION DROPDOWN */}

              {showNotifications && (
                <div className="absolute right-0 top-12 w-[350px] max-w-[calc(100vw-2rem)] bg-[#11141c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">

                  {/* HEADER */}

                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">

                    <div>

                      <h3 className="font-semibold text-sm">
                        Notifications
                      </h3>

                      <p className="text-xs text-gray-500 mt-0.5">
                        {unreadCount > 0
                          ? `${unreadCount} non lue${
                              unreadCount > 1
                                ? 's'
                                : ''
                            }`
                          : 'Tout est à jour'}
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        setShowNotifications(false)
                      }
                      className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"
                    >
                      <X size={16} />
                    </button>

                  </div>

                  {/* LIST */}

                  <div className="max-h-[380px] overflow-y-auto">

                    {notifications.length === 0 ? (

                      <div className="px-5 py-10 text-center">

                        <Bell
                          size={30}
                          className="mx-auto text-gray-600 mb-3"
                        />

                        <p className="text-sm text-gray-400">
                          Aucune notification
                        </p>

                      </div>

                    ) : (

                      notifications
                        .slice(0, 5)
                        .map((notification) => (

                          <div
                            key={notification.id}
                            onClick={() =>
                              handleNotificationClick(
                                notification
                              )
                            }
                            className={`relative px-4 py-3 border-b border-white/5 cursor-pointer transition hover:bg-white/5 ${
                              !notification.is_read
                                ? 'bg-blue-500/5'
                                : ''
                            }`}
                          >

                            <div className="flex gap-3">

                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  !notification.is_read
                                    ? 'bg-blue-500/15 text-blue-400'
                                    : 'bg-white/5 text-gray-500'
                                }`}
                              >

                                {notification.type ===
                                'tournament' ? (
                                  <Trophy size={17} />
                                ) : notification.type ===
                                  'match' ? (
                                  <Swords size={17} />
                                ) : (
                                  <Bell size={17} />
                                )}

                              </div>

                              <div className="flex-1 min-w-0 pr-5">

                                <div className="flex items-start justify-between gap-2">

                                  <p className="text-sm font-semibold truncate">
                                    {
                                      notification.title
                                    }
                                  </p>

                                  {!notification.is_read && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                  )}

                                </div>

                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                  {
                                    notification.message
                                  }
                                </p>

                                <p className="text-[10px] text-gray-600 mt-2">
                                  {new Date(
                                    notification.created_at
                                  ).toLocaleString(
                                    'fr-FR'
                                  )}
                                </p>

                              </div>

                              <button
                                onClick={(event) => {
                                  event.stopPropagation()

                                  handleDeleteNotification(
                                    notification.id
                                  )
                                }}
                                className="absolute right-3 bottom-3 text-gray-600 hover:text-red-400 transition"
                              >
                                <X size={14} />
                              </button>

                            </div>

                          </div>

                        ))
                    )}

                  </div>

                  {/* FOOTER */}

                  <div className="p-3 border-t border-white/10">

                    <button
                      onClick={() => {
                        setShowNotifications(false)
                        navigate('/notifications')
                      }}
                      className="w-full py-2.5 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 text-sm font-medium transition"
                    >
                      Voir toutes les notifications
                    </button>

                  </div>

                </div>
              )}

            </div>

            {/* AVATAR */}

            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {displayName
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </header>

        {/* CONTENT */}

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>

      </div>

    </div>
  )
}

export default DashboardLayout
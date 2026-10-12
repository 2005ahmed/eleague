import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Trophy,
  Swords,
  Medal,
  Bell,
  User,
  LogOut,
  ClipboardCheck,
  FileWarning,
  X,
  Menu,
  Moon,
  Sun,
  Languages,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getPlayer, getUser, logout } from '../services/auth'
import api from '../services/api'

function DashboardLayout() {
  const navigate = useNavigate()

  // =====================================================
  // USER
  // =====================================================

  const [user, setUser] = useState(getUser())
  const player = getPlayer()

  // =====================================================
  // MODE
  // =====================================================

  const [mode, setMode] = useState(
    localStorage.getItem('eLeague_mode') || 'player'
  )

  // =====================================================
  // UI
  // =====================================================

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('eLeague_theme') !== 'light'
  )

  const [language, setLanguage] = useState(
    localStorage.getItem('eLeague_language') || 'en'
  )

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [notifications, setNotifications] = useState([])

  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  // =====================================================
  // ROLE
  // =====================================================

  const isOrganizer =
    Boolean(user?.is_organizer) ||
    user?.role === 'organizer' ||
    user?.role === 'admin'

  const isAdmin = user?.role === 'admin'

  // =====================================================
  // THEME
  // =====================================================

  useEffect(() => {
    localStorage.setItem(
      'eLeague_theme',
      darkMode ? 'dark' : 'light'
    )
  }, [darkMode])

  // =====================================================
  // LANGUAGE
  // =====================================================

  useEffect(() => {
    localStorage.setItem(
      'eLeague_language',
      language
    )
  }, [language])

  // =====================================================
  // MODE EVENT
  // =====================================================

  useEffect(() => {
    const handleModeChange = () => {
      const currentMode =
        localStorage.getItem('eLeague_mode') || 'player'

      setMode(currentMode)

      const currentUser = getUser()

      if (currentUser) {
        setUser(currentUser)
      }
    }

    window.addEventListener(
      'eLeague-mode-changed',
      handleModeChange
    )

    return () => {
      window.removeEventListener(
        'eLeague-mode-changed',
        handleModeChange
      )
    }
  }, [])

  // =====================================================
  // MOBILE SIDEBAR
  // =====================================================

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false)
  }

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

  const switchMode = async (newMode) => {
    // -----------------------------------------------
    // PLAYER
    // -----------------------------------------------

    if (newMode === 'player') {
      localStorage.setItem(
        'eLeague_mode',
        'player'
      )

      setMode('player')
      setShowNotifications(false)
      setShowProfileMenu(false)

      closeMobileSidebar()

      window.dispatchEvent(
        new Event('eLeague-mode-changed')
      )

      navigate('/')

      return
    }

    // -----------------------------------------------
    // ORGANIZER
    // -----------------------------------------------

    if (newMode === 'organizer') {
      try {
        // Already organizer
        if (isOrganizer) {
          localStorage.setItem(
            'eLeague_mode',
            'organizer'
          )

          setMode('organizer')
          setShowNotifications(false)
          setShowProfileMenu(false)

          closeMobileSidebar()

          window.dispatchEvent(
            new Event('eLeague-mode-changed')
          )

          navigate('/')

          return
        }

        // Activate organizer account
        const response = await api.post(
          '/auth/become-organizer'
        )

        const updatedUser =
          response.data.user

        localStorage.setItem(
          'user',
          JSON.stringify(updatedUser)
        )

        localStorage.setItem(
          'eLeague_mode',
          'organizer'
        )

        setUser(updatedUser)
        setMode('organizer')

        setShowNotifications(false)
        setShowProfileMenu(false)

        closeMobileSidebar()

        window.dispatchEvent(
          new Event('eLeague-mode-changed')
        )

        navigate('/')

      } catch (error) {
        console.error(
          'Organizer activation error:',
          error.response?.data || error
        )

        alert(
          error.response?.data?.message ||
          'Impossible d’activer le mode Organizer.'
        )
      }
    }
  }

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get(
        '/notifications/unread-count'
      )

      setUnreadCount(
        response.data.unread_count || 0
      )
    } catch (error) {
      console.error(
        'Unread notifications error:',
        error
      )
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await api.get(
        '/notifications'
      )

      setNotifications(
        response.data.notifications?.data ||
        response.data.notifications ||
        []
      )

      setUnreadCount(
        response.data.unread_count || 0
      )
    } catch (error) {
      console.error(
        'Notifications error:',
        error
      )
    }
  }

  // =====================================================
  // REPORTS
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
  // INITIAL FETCH
  // =====================================================

  useEffect(() => {
    fetchUnreadCount()
    fetchPendingReports()
  }, [isOrganizer])

  // =====================================================
  // REFRESH
  // =====================================================

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount()
      fetchPendingReports()
    }, 10000)

    return () => clearInterval(interval)
  }, [isOrganizer])

  // =====================================================
  // NOTIFICATION DROPDOWN
  // =====================================================

  const handleBellClick = async () => {
    const nextState = !showNotifications

    setShowNotifications(nextState)
    setShowProfileMenu(false)

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
        'Read notification error:',
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
          (item) =>
            item.id !== notificationId
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
  // CLOSE DROPDOWNS
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setShowNotifications(false)
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setShowProfileMenu(false)
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
      badge: unreadCount,
    },
  ]

  // =====================================================
  // ORGANIZER MENU
  // =====================================================

  const organizerMenu = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Tournaments',
      path: '/organizer/tournaments',
      icon: Trophy,
    },
    {
      name: 'Create Tournament',
      path: '/tournaments/create',
      icon: Trophy,
    },
    {
      name: 'Verification',
      path: '/organizer/results',
      icon: ClipboardCheck,
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: FileWarning,
      badge: pendingReports,
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount,
    },
  ]

  const menu =
    mode === 'organizer'
      ? organizerMenu
      : playerMenu

  // =====================================================
  // USER DISPLAY
  // =====================================================

  const displayName =
    mode === 'organizer'
      ? user?.name || 'Organizer'
      : player?.nickname ||
        user?.name ||
        'Player'

  const displayInitial =
    displayName
      ?.charAt(0)
      ?.toUpperCase() || 'U'

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className={`
        min-h-screen
        ${
          darkMode
            ? 'bg-[#08090d] text-white'
            : 'bg-gray-100 text-gray-900'
        }
      `}
    >

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {mobileSidebarOpen && (
        <div
          className="
            fixed
            inset-0
            z-40
            bg-black/60
            backdrop-blur-sm
            md:hidden
          "
          onClick={closeMobileSidebar}
        />
      )}

      {/* =================================================
          FIXED SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          h-screen
          w-64
          border-r
          p-5
          flex
          flex-col
          overflow-y-auto
          transition-transform
          duration-300
          md:translate-x-0
          ${
            mobileSidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
          ${
            darkMode
              ? 'bg-[#0d0f15] border-white/10'
              : 'bg-white border-gray-200'
          }
        `}
      >

        {/* =================================================
            LOGO
        ================================================= */}

        <div className="mb-8">

          <h1 className="text-2xl font-black">
            e
            <span className="text-blue-500">
              League
            </span>
          </h1>

          <p
            className={`
              text-xs
              mt-1
              ${
                darkMode
                  ? 'text-gray-500'
                  : 'text-gray-400'
              }
            `}
          >
            Competitive Gaming
          </p>

        </div>

        {/* =================================================
            MODE SWITCHER
        ================================================= */}

        <div className="mb-7">

          <div
            className={`
              text-[10px]
              uppercase
              tracking-[0.16em]
              mb-2
              ${
                darkMode
                  ? 'text-gray-600'
                  : 'text-gray-400'
              }
            `}
          >
            Current mode
          </div>

          <div
            className={`
              border
              rounded-xl
              p-1
              flex
              ${
                darkMode
                  ? 'bg-[#11141c] border-white/10'
                  : 'bg-gray-100 border-gray-200'
              }
            `}
          >

            {/* PLAYER */}

            <button
              type="button"
              onClick={() =>
                switchMode('player')
              }
              className={`
                flex-1
                py-2
                rounded-lg
                text-xs
                font-semibold
                transition
                ${
                  mode === 'player'
                    ? 'bg-blue-600 text-white shadow-md'
                    : darkMode
                      ? 'text-gray-500 hover:text-white'
                      : 'text-gray-500 hover:text-gray-900'
                }
              `}
            >
              Player
            </button>

            {/* ORGANIZER */}

            <button
              type="button"
              onClick={() =>
                switchMode('organizer')
              }
              className={`
                flex-1
                py-2
                rounded-lg
                text-xs
                font-semibold
                transition
                ${
                  mode === 'organizer'
                    ? 'bg-blue-600 text-white shadow-md'
                    : darkMode
                      ? 'text-gray-500 hover:text-white'
                      : 'text-gray-500 hover:text-gray-900'
                }
              `}
            >
              Organizer
            </button>

          </div>

          {!isOrganizer && (
            <p
              className={`
                text-[10px]
                leading-relaxed
                mt-2
                ${
                  darkMode
                    ? 'text-gray-600'
                    : 'text-gray-400'
                }
              `}
            >
              Click Organizer to activate
              organizer mode.
            </p>
          )}

        </div>

        {/* =================================================
            NAVIGATION ONLY
        ================================================= */}

        <nav className="space-y-2 flex-1">

          {menu.map((item) => {

            const Icon = item.icon

            return (
              <NavLink
                key={`${item.name}-${item.path}`}
                to={item.path}
                onClick={closeMobileSidebar}
                className={({ isActive }) =>
                  `
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    rounded-xl
                    transition
                    ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : darkMode
                          ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `
                }
              >

                <Icon size={19} />

                <span className="flex-1">
                  {item.name}
                </span>

                {item.badge > 0 && (
                  <span
                    className="
                      min-w-5
                      h-5
                      px-1
                      rounded-full
                      bg-red-500
                      text-white
                      text-[10px]
                      font-bold
                      flex
                      items-center
                      justify-center
                    "
                  >
                    {item.badge > 99
                      ? '99+'
                      : item.badge}
                  </span>
                )}

              </NavLink>
            )
          })}

        </nav>

        {/* =================================================
            SIDEBAR BOTTOM
        ================================================= */}

        <div
          className={`
            border-t
            mt-5
            pt-4
            ${
              darkMode
                ? 'border-white/10'
                : 'border-gray-200'
            }
          `}
        >

          <div
            className={`
              text-[10px]
              uppercase
              tracking-[0.14em]
              px-4
              ${
                darkMode
                  ? 'text-gray-700'
                  : 'text-gray-400'
              }
            `}
          >
            eLeague
          </div>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="min-h-screen md:ml-64">

        {/* =================================================
            HEADER
        ================================================= */}

        <header
          className={`
            sticky
            top-0
            z-30
            h-16
            border-b
            backdrop-blur-xl
            flex
            items-center
            justify-between
            px-4
            sm:px-6
            ${
              darkMode
                ? 'bg-[#0b0c11]/90 border-white/10'
                : 'bg-white/90 border-gray-200'
            }
          `}
        >

          {/* LEFT */}

          <div className="flex items-center gap-3 min-w-0">

            {/* MOBILE MENU */}

            <button
              type="button"
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              className={`
                md:hidden
                p-2
                rounded-xl
                ${
                  darkMode
                    ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }
              `}
            >
              <Menu size={21} />
            </button>

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <span
                  className={`
                    hidden
                    sm:inline
                    text-sm
                    ${
                      darkMode
                        ? 'text-gray-500'
                        : 'text-gray-400'
                    }
                  `}
                >
                  Welcome back,
                </span>

                <span className="font-semibold truncate">
                  {displayName}
                </span>

              </div>

              <span
                className={`
                  text-xs
                  ${
                    darkMode
                      ? 'text-gray-600'
                      : 'text-gray-400'
                  }
                `}
              >
                {mode === 'organizer'
                  ? 'Organizer Mode'
                  : 'Player Mode'}
              </span>

            </div>

          </div>

          {/* =================================================
              HEADER ACTIONS
          ================================================= */}

          <div className="flex items-center gap-1 sm:gap-2">

            {/* LANGUAGE */}

            <div
              className={`
                hidden
                sm:flex
                items-center
                gap-1
                px-2
                py-2
                rounded-xl
                ${
                  darkMode
                    ? 'text-gray-400 hover:bg-white/5'
                    : 'text-gray-500 hover:bg-gray-100'
                }
              `}
            >

              <Languages size={18} />

              <select
                value={language}
                onChange={(event) =>
                  setLanguage(
                    event.target.value
                  )
                }
                className={`
                  bg-transparent
                  border-none
                  outline-none
                  text-xs
                  cursor-pointer
                  ${
                    darkMode
                      ? 'text-gray-300'
                      : 'text-gray-600'
                  }
                `}
              >

                <option value="en">
                  EN
                </option>

                <option value="fr">
                  FR
                </option>

                <option value="ar">
                  AR
                </option>

                <option value="es">
                  ES
                </option>

              </select>

            </div>

            {/* THEME */}

            <button
              type="button"
              onClick={() =>
                setDarkMode(
                  (value) => !value
                )
              }
              className={`
                p-2.5
                rounded-xl
                transition
                ${
                  darkMode
                    ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
              aria-label="Toggle theme"
            >

              {darkMode ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}

            </button>

            {/* NOTIFICATIONS */}

            <div
              ref={notificationRef}
              className="relative"
            >

              <button
                type="button"
                onClick={handleBellClick}
                className={`
                  relative
                  p-2.5
                  rounded-xl
                  transition
                  ${
                    darkMode
                      ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                aria-label="Notifications"
              >

                <Bell size={20} />

                {unreadCount > 0 && (
                  <span
                    className="
                      absolute
                      -top-0.5
                      -right-0.5
                      min-w-[17px]
                      h-[17px]
                      px-1
                      rounded-full
                      bg-red-500
                      text-white
                      text-[9px]
                      font-bold
                      flex
                      items-center
                      justify-center
                      border-2
                      border-[#0b0c11]
                    "
                  >
                    {unreadCount > 99
                      ? '99+'
                      : unreadCount}
                  </span>
                )}

              </button>

              {/* NOTIFICATIONS DROPDOWN */}

              {showNotifications && (
                <div
                  className={`
                    absolute
                    right-0
                    top-12
                    w-[350px]
                    max-w-[calc(100vw-2rem)]
                    rounded-2xl
                    border
                    shadow-2xl
                    overflow-hidden
                    z-50
                    ${
                      darkMode
                        ? 'bg-[#11141c] border-white/10'
                        : 'bg-white border-gray-200'
                    }
                  `}
                >

                  <div
                    className={`
                      flex
                      items-center
                      justify-between
                      px-4
                      py-3
                      border-b
                      ${
                        darkMode
                          ? 'border-white/10'
                          : 'border-gray-200'
                      }
                    `}
                  >

                    <div>

                      <h3 className="font-semibold text-sm">
                        Notifications
                      </h3>

                      <p
                        className={`
                          text-xs
                          mt-0.5
                          ${
                            darkMode
                              ? 'text-gray-500'
                              : 'text-gray-400'
                          }
                        `}
                      >
                        {unreadCount > 0
                          ? `${unreadCount} unread`
                          : 'All caught up'}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowNotifications(false)
                      }
                      className={`
                        p-1.5
                        rounded-lg
                        ${
                          darkMode
                            ? 'text-gray-500 hover:text-white hover:bg-white/5'
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                        }
                      `}
                    >
                      <X size={16} />
                    </button>

                  </div>

                  <div className="max-h-[380px] overflow-y-auto">

                    {notifications.length === 0 ? (

                      <div className="px-5 py-10 text-center">

                        <Bell
                          size={30}
                          className="
                            mx-auto
                            text-gray-500
                            mb-3
                          "
                        />

                        <p
                          className={`
                            text-sm
                            ${
                              darkMode
                                ? 'text-gray-400'
                                : 'text-gray-500'
                            }
                          `}
                        >
                          No notifications
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
                            className={`
                              relative
                              px-4
                              py-3
                              border-b
                              cursor-pointer
                              transition
                              ${
                                darkMode
                                  ? 'border-white/5 hover:bg-white/5'
                                  : 'border-gray-100 hover:bg-gray-50'
                              }
                              ${
                                !notification.is_read
                                  ? darkMode
                                    ? 'bg-blue-500/5'
                                    : 'bg-blue-50'
                                  : ''
                              }
                            `}
                          >

                            <div className="flex gap-3">

                              <div
                                className={`
                                  w-9
                                  h-9
                                  rounded-xl
                                  flex
                                  items-center
                                  justify-center
                                  flex-shrink-0
                                  ${
                                    !notification.is_read
                                      ? 'bg-blue-500/15 text-blue-400'
                                      : darkMode
                                        ? 'bg-white/5 text-gray-500'
                                        : 'bg-gray-100 text-gray-400'
                                  }
                                `}
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

                              <div className="flex-1 min-w-0">

                                <div className="flex items-start gap-2">

                                  <p
                                    className={`
                                      text-sm
                                      font-semibold
                                      truncate
                                      ${
                                        darkMode
                                          ? 'text-white'
                                          : 'text-gray-900'
                                      }
                                    `}
                                  >
                                    {notification.title}
                                  </p>

                                  {!notification.is_read && (
                                    <span
                                      className="
                                        w-2
                                        h-2
                                        rounded-full
                                        bg-blue-500
                                        mt-1.5
                                        flex-shrink-0
                                      "
                                    />
                                  )}

                                </div>

                                <p
                                  className={`
                                    text-xs
                                    mt-1
                                    line-clamp-2
                                    ${
                                      darkMode
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                    }
                                  `}
                                >
                                  {notification.message}
                                </p>

                              </div>

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()

                                  handleDeleteNotification(
                                    notification.id
                                  )
                                }}
                                className="
                                  absolute
                                  right-3
                                  bottom-3
                                  text-gray-500
                                  hover:text-red-400
                                "
                              >
                                <X size={14} />
                              </button>

                            </div>

                          </div>

                        ))

                    )}

                  </div>

                  <div
                    className={`
                      p-3
                      border-t
                      ${
                        darkMode
                          ? 'border-white/10'
                          : 'border-gray-200'
                      }
                    `}
                  >

                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false)
                        navigate('/notifications')
                      }}
                      className="
                        w-full
                        py-2.5
                        rounded-xl
                        bg-blue-600/10
                        text-blue-500
                        hover:bg-blue-600/20
                        text-sm
                        font-medium
                        transition
                      "
                    >
                      View all notifications
                    </button>

                  </div>

                </div>
              )}

            </div>

            {/* PROFILE */}

            <div
              ref={profileRef}
              className="relative"
            >

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(
                    (value) => !value
                  )

                  setShowNotifications(false)
                }}
                className="
                  flex
                  items-center
                  rounded-xl
                  p-1
                  hover:bg-white/5
                  transition
                "
              >

                <div
                  className="
                    w-9
                    h-9
                    rounded-full
                    bg-blue-600
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-white
                  "
                >
                  {displayInitial}
                </div>

              </button>

              {/* PROFILE DROPDOWN */}

              {showProfileMenu && (
                <div
                  className={`
                    absolute
                    right-0
                    top-12
                    w-56
                    rounded-2xl
                    border
                    shadow-2xl
                    overflow-hidden
                    z-50
                    ${
                      darkMode
                        ? 'bg-[#11141c] border-white/10'
                        : 'bg-white border-gray-200'
                    }
                  `}
                >

                  <div
                    className={`
                      px-4
                      py-3
                      border-b
                      ${
                        darkMode
                          ? 'border-white/10'
                          : 'border-gray-200'
                      }
                    `}
                  >

                    <p className="text-sm font-semibold truncate">
                      {displayName}
                    </p>

                    <p
                      className={`
                        text-xs
                        mt-1
                        truncate
                        ${
                          darkMode
                            ? 'text-gray-500'
                            : 'text-gray-400'
                        }
                      `}
                    >
                      {user?.email || ''}
                    </p>

                  </div>

                  <div className="p-2">

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false)
                        navigate('/profile')
                      }}
                      className={`
                        w-full
                        flex
                        items-center
                        gap-3
                        px-3
                        py-2.5
                        rounded-xl
                        text-sm
                        transition
                        ${
                          darkMode
                            ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <User size={17} />
                      Profile
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-3
                        py-2.5
                        rounded-xl
                        text-sm
                        text-red-400
                        hover:bg-red-500/10
                        transition
                      "
                    >
                      <LogOut size={17} />
                      Logout
                    </button>

                  </div>

                </div>
              )}

            </div>

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main
          className={`
            min-h-[calc(100vh-4rem)]
            p-4
            sm:p-6
            lg:p-8
            ${
              darkMode
                ? 'bg-[#08090d]'
                : 'bg-gray-100'
            }
          `}
        >
          <Outlet />
        </main>

      </div>

    </div>
  )
}

export default DashboardLayout
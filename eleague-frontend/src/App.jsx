import { BrowserRouter, Routes, Route } from 'react-router-dom'

import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import OrganizerRoute from './components/OrganizerRoute'
import PlayerRoute from './components/PlayerRoute'

import Dashboard from './pages/Dashboard'
import Tournaments from './pages/Tournaments'
import TournamentDetails from './pages/TournamentDetails'
import CreateTournament from './pages/CreateTournament'
import MyMatches from './pages/MyMatches'
import MatchDetails from './pages/MatchDetails'
import SubmitResult from './pages/SubmitResult'
import OrganizerResults from './pages/OrganizerResults'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Notifications from './pages/Notifications'
import Reports from './pages/Reports'
import AdminDashboard from './pages/AdminDashboard'
import OrganizerTournaments from './pages/OrganizerTournaments'

import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            PUBLIC
        ===================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* =====================================================
            PROTECTED
        ===================================================== */}

        <Route element={<ProtectedRoute />}>

          <Route element={<DashboardLayout />}>

            {/* Dashboard */}

            <Route
              path="/"
              element={<Dashboard />}
            />


            {/* =================================================
                TOURNAMENTS
            ================================================= */}

            <Route
              path="/tournaments"
              element={<Tournaments />}
            />

            {/* Create Tournament
                Organizer Mode ONLY */}

            <Route
              path="/tournaments/create"
              element={
                <OrganizerRoute>
                  <CreateTournament />
                </OrganizerRoute>
              }
            />

            <Route
  path="/organizer/tournaments"
  element={
    <OrganizerRoute>
      <OrganizerTournaments />
    </OrganizerRoute>
  }
/>

            {/* Tournament Details */}

            <Route
              path="/tournaments/:id"
              element={<TournamentDetails />}
            />


            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

            <Route
              path="/notifications"
              element={<Notifications />}
            />


            {/* =================================================
                LEADERBOARD
            ================================================= */}

            <Route
              path="/leaderboard"
              element={<Leaderboard />}
            />


            {/* =================================================
                PROFILE
            ================================================= */}

            <Route
              path="/profile"
              element={<Profile />}
            />


            {/* =================================================
                MATCHES
            ================================================= */}

            <Route
  path="/dashboard"
  element={<Dashboard />}
/>

<Route
  path="/tournaments"
  element={<Tournaments />}
/>

<Route
  path="/tournaments/:id"
  element={<TournamentDetails />}
/>

<Route
  path="/my-matches"
  element={
    <PlayerRoute>
      <MyMatches />
    </PlayerRoute>
  }
/>

<Route
  path="/leaderboard"
  element={<Leaderboard />}
/>

<Route
  path="/tournaments/create"
  element={
    <OrganizerRoute>
      <CreateTournament />
    </OrganizerRoute>
  }
/>

<Route
  path="/organizer/results"
  element={
    <OrganizerRoute>
      <OrganizerResults />
    </OrganizerRoute>
  }
/>

<Route
  path="/reports"
  element={
    <OrganizerRoute>
      <Reports />
    </OrganizerRoute>
  }
/>

            <Route
              path="/matches/:id"
              element={<MatchDetails />}
            />

            <Route
              path="/matches/:id/result"
              element={<SubmitResult />}
            />


            {/* =================================================
                ORGANIZER
            ================================================= */}

            <Route
              path="/organizer/results"
              element={
                <OrganizerRoute>
                  <OrganizerResults />
                </OrganizerRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <OrganizerRoute>
                  <Reports />
                </OrganizerRoute>
              }
            />


            {/* =================================================
                ADMIN
            ================================================= */}

            <Route
              path="/admin"
              element={
                <OrganizerRoute>
                  <AdminDashboard />
                </OrganizerRoute>
              }
            />

          </Route>

        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default App
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import OrganizerRoute from './components/OrganizerRoute'
import PlayerRoute from './components/PlayerRoute'

import Dashboard from './pages/Dashboard'
import Tournaments from './pages/Tournaments'
import TournamentDetails from './pages/TournamentDetails'

import MyMatches from './pages/MyMatches'
import MatchDetails from './pages/MatchDetails'
import SubmitResult from './pages/SubmitResult'

import OrganizerResults from './pages/OrganizerResults'
import OrganizerTournaments from './pages/OrganizerTournaments'
import CreateTournament from './pages/CreateTournament'

import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Notifications from './pages/Notifications'
import Reports from './pages/Reports'
import AdminDashboard from './pages/AdminDashboard'
import MatchCenter from './pages/MatchCenter'

import Login from './pages/Login'
import Register from './pages/Register'


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            PUBLIC ROUTES
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
            PROTECTED ROUTES
        ===================================================== */}

        <Route element={<ProtectedRoute />}>

          <Route element={<DashboardLayout />}>

            {/* =================================================
                DASHBOARD
            ================================================= */}

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />


            {/* =================================================
                TOURNAMENTS
            ================================================= */}

            <Route
              path="/tournaments"
              element={<Tournaments />}
            />

            <Route
              path="/tournaments/:id"
              element={<TournamentDetails />}
            />


            {/* =================================================
                PLAYER MATCHES
            ================================================= */}

            <Route
              path="/matches"
              element={
                <PlayerRoute>
                  <MyMatches />
                </PlayerRoute>
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

            <Route
    path="/tournaments/:tournamentId/matches/:matchId"
    element={<MatchCenter />}
/>

            {/* =================================================
                LEADERBOARD
            ================================================= */}

            <Route
              path="/leaderboard"
              element={<Leaderboard />}
            />


            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

            <Route
              path="/notifications"
              element={<Notifications />}
            />


            {/* =================================================
                PROFILE
            ================================================= */}

            <Route
              path="/profile"
              element={<Profile />}
            />


            {/* =================================================
                ORGANIZER
            ================================================= */}

            <Route
              path="/organizer/tournaments"
              element={
                <OrganizerRoute>
                  <OrganizerTournaments />
                </OrganizerRoute>
              }
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
              path="/organizer/tournaments/create"
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
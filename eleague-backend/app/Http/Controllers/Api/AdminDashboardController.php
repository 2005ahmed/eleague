<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Player;
use App\Models\Game;
use App\Models\Tournament;
use App\Models\TournamentMatch;
use App\Models\Result;
use App\Models\Report;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 403);
        }

        // =========================
        // Users
        // =========================

        $totalUsers = User::count();

        $totalPlayers = User::where('role', 'player')->count();

        $totalOrganizers = User::where('role', 'organizer')->count();

        // =========================
        // Games
        // =========================

        $totalGames = Game::count();

        $activeGames = Game::where('is_active', true)->count();

        // =========================
        // Tournaments
        // =========================

        $totalTournaments = Tournament::count();

        $draftTournaments = Tournament::where(
            'status',
            'draft'
        )->count();

        $activeTournaments = Tournament::whereIn(
            'status',
            ['registration', 'in_progress']
        )->count();

        $completedTournaments = Tournament::where(
            'status',
            'completed'
        )->count();

        // =========================
        // Matches
        // =========================

        $totalMatches = TournamentMatch::count();

        $completedMatches = TournamentMatch::where(
            'status',
            'completed'
        )->count();

        $scheduledMatches = TournamentMatch::where(
            'status',
            'scheduled'
        )->count();

        // =========================
        // Results
        // =========================

        $pendingResults = Result::where(
            'verified',
            false
        )->count();

        $verifiedResults = Result::where(
            'verified',
            true
        )->count();

        // =========================
        // Reports
        // =========================

        $pendingReports = Report::where(
            'status',
            'pending'
        )->count();

        $resolvedReports = Report::where(
            'status',
            'resolved'
        )->count();

        $rejectedReports = Report::where(
            'status',
            'rejected'
        )->count();

        // =========================
        // Recent Users
        // =========================

        $recentUsers = User::latest()
            ->take(5)
            ->get([
                'id',
                'name',
                'email',
                'role',
                'created_at',
            ]);

        // =========================
        // Recent Tournaments
        // =========================

        $recentTournaments = Tournament::with([
            'game:id,name',
            'organizer:id,name',
        ])
            ->latest()
            ->take(5)
            ->get([
                'id',
                'game_id',
                'organizer_id',
                'name',
                'format',
                'max_players',
                'prize',
                'status',
                'created_at',
            ]);

        // =========================
        // Response
        // =========================

        return response()->json([
            'stats' => [
                'users' => [
                    'total' => $totalUsers,
                    'players' => $totalPlayers,
                    'organizers' => $totalOrganizers,
                ],

                'games' => [
                    'total' => $totalGames,
                    'active' => $activeGames,
                ],

                'tournaments' => [
                    'total' => $totalTournaments,
                    'draft' => $draftTournaments,
                    'active' => $activeTournaments,
                    'completed' => $completedTournaments,
                ],

                'matches' => [
                    'total' => $totalMatches,
                    'completed' => $completedMatches,
                    'scheduled' => $scheduledMatches,
                ],

                'results' => [
                    'pending' => $pendingResults,
                    'verified' => $verifiedResults,
                ],

                'reports' => [
                    'pending' => $pendingReports,
                    'resolved' => $resolvedReports,
                    'rejected' => $rejectedReports,
                ],
            ],

            'recent_users' => $recentUsers,

            'recent_tournaments' => $recentTournaments,
        ]);
    }
}
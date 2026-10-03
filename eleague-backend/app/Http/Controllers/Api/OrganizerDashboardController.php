<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tournament;
use App\Models\Report;
use Illuminate\Http\Request;

class OrganizerDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (
            $user->role !== 'admin' &&
            !$user->is_organizer
        ) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 403);
        }

        $tournamentsQuery = Tournament::query()
            ->with(['game'])
            ->withCount([
                'players as registered_players' => function ($query) {
                    $query->where(
                        'tournament_players.status',
                        'registered'
                    );
                },
            ])
            ->where('organizer_id', $user->id);

        $statsQuery = Tournament::query()
            ->where('organizer_id', $user->id);

        $totalTournaments = (clone $statsQuery)->count();

        $drafts = (clone $statsQuery)
            ->where('status', 'draft')
            ->count();

        $registration = (clone $statsQuery)
            ->where('status', 'registration')
            ->count();

        $inProgress = (clone $statsQuery)
            ->where('status', 'in_progress')
            ->count();

        $pendingResults = 0;

        $pendingReports = 0;

        try {
            $pendingReports = Report::query()
                ->where('status', 'pending')
                ->whereHas('tournament', function ($query) use ($user) {
                    $query->where(
                        'organizer_id',
                        $user->id
                    );
                })
                ->count();
        } catch (\Throwable $e) {
            $pendingReports = 0;
        }

        $tournaments = $tournamentsQuery
            ->latest()
            ->take(10)
            ->get();

        return response()->json([
            'organizer' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],

            'stats' => [
                'total_tournaments' => $totalTournaments,
                'drafts' => $drafts,
                'registration' => $registration,
                'in_progress' => $inProgress,
                'pending_results' => $pendingResults,
                'pending_reports' => $pendingReports,
            ],

            'tournaments' => $tournaments,
        ]);
    }
}

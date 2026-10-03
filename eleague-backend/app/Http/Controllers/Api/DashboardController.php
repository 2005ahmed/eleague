<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TournamentMatch;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $player = $user->player;

        if (!$player) {
            return response()->json([
                'message' => 'Player profile not found.'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | My matches
        |--------------------------------------------------------------------------
        */

        $matches = TournamentMatch::with([
            'tournament.game',
            'player1',
            'player2',
            'winner',
        ])
            ->where(function ($query) use ($player) {
                $query
                    ->where('player1_id', $player->id)
                    ->orWhere('player2_id', $player->id);
            })
            ->orderByDesc('id')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Statistics
        |--------------------------------------------------------------------------
        */

        $completedMatches = $matches->where('status', 'completed');

        $wins = $completedMatches
            ->where('winner_id', $player->id)
            ->count();

        $losses = $completedMatches
            ->where('winner_id', '!=', $player->id)
            ->count();

        $totalMatches = $completedMatches->count();

        $winRate = $totalMatches > 0
            ? round(($wins / $totalMatches) * 100, 2)
            : 0;

        /*
        |--------------------------------------------------------------------------
        | Tournaments
        |--------------------------------------------------------------------------
        */

        $tournaments = $player->tournaments()
            ->with('game')
            ->orderByDesc('tournaments.id')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Upcoming match
        |--------------------------------------------------------------------------
        */

        $upcomingMatch = $matches
            ->where('status', 'scheduled')
            ->first();

        /*
        |--------------------------------------------------------------------------
        | Recent matches
        |--------------------------------------------------------------------------
        */

        $recentMatches = $matches
            ->where('status', 'completed')
            ->take(5)
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'user' => $user,
            'player' => $player,

            'stats' => [
                'tournaments' => $tournaments->count(),
                'matches' => $totalMatches,
                'wins' => $wins,
                'losses' => $losses,
                'win_rate' => $winRate,
            ],

            'upcoming_match' => $upcomingMatch,

            'recent_matches' => $recentMatches,

            'tournaments' => $tournaments,
        ]);
    }
}

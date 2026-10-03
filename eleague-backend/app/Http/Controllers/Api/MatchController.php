<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TournamentMatch;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    /**
     * Get all matches for the authenticated player.
     */
    public function myMatches(Request $request)
    {
        $user = $request->user();

        $player = $user->player;

        if (!$player) {
            return response()->json([
                'message' => 'Player profile not found.'
            ], 404);
        }

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

        return response()->json([
            'player' => $player,
            'matches_count' => $matches->count(),
            'matches' => $matches,
        ]);
    }

    /**
     * Get all matches of a tournament.
     */
    public function index($tournament)
    {
        $tournamentModel = \App\Models\Tournament::findOrFail($tournament);

        $matches = $tournamentModel->matches()
            ->with([
                'player1',
                'player2',
                'winner',
            ])
            ->orderBy('round')
            ->orderBy('id')
            ->get();

        return response()->json([
            'tournament_id' => $tournamentModel->id,
            'matches_count' => $matches->count(),
            'rounds' => $matches
                ->groupBy('round')
                ->map(function ($roundMatches, $round) {
                    return [
                        'round' => (int) $round,
                        'matches' => $roundMatches->values(),
                    ];
                })
                ->values(),
            'matches' => $matches,
        ]);
    }

    /**
     * Get one match.
     */
    public function show(TournamentMatch $match)
    {
        $match->load([
            'tournament.game',
            'player1',
            'player2',
            'winner',
            'results',
        ]);

        return response()->json([
            'match' => $match,
        ]);
    }
}

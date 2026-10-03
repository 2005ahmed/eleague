<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Player;
use App\Models\TournamentMatch;

class LeaderboardController extends Controller
{
    public function index()
    {
        $players = Player::with('user')->get();

        $matches = TournamentMatch::where('status', 'completed')
            ->whereNotNull('winner_id')
            ->get();

        $leaderboard = $players->map(function ($player) use ($matches) {

            $playerMatches = $matches->filter(function ($match) use ($player) {
                return $match->player1_id === $player->id
                    || $match->player2_id === $player->id;
            });

            $wins = $playerMatches
                ->where('winner_id', $player->id)
                ->count();

            $totalMatches = $playerMatches->count();

            $losses = $totalMatches - $wins;

            $winRate = $totalMatches > 0
                ? round(($wins / $totalMatches) * 100, 2)
                : 0;

            // 3 points pour chaque victoire
            $points = $wins * 3;

            return [
                'player_id' => $player->id,
                'nickname' => $player->nickname,
                'name' => $player->user?->name,
                'avatar' => $player->avatar,
                'country' => $player->country,

                'matches' => $totalMatches,
                'wins' => $wins,
                'losses' => $losses,
                'win_rate' => $winRate,
                'points' => $points,
            ];
        });

        $leaderboard = $leaderboard
            ->sort(function ($a, $b) {
                return [
                    $b['points'],
                    $b['wins'],
                    $b['win_rate'],
                ] <=> [
                    $a['points'],
                    $a['wins'],
                    $a['win_rate'],
                ];
            })
            ->values()
            ->map(function ($player, $index) {
                $player['rank'] = $index + 1;
                return $player;
            });

        return response()->json([
            'leaderboard' => $leaderboard,
        ]);
    }
}

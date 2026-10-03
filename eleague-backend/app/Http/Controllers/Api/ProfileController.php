<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $player = $user->player;

        if (!$player) {
            return response()->json([
                'message' => 'Player profile not found.'
            ], 404);
        }

        $matches = \App\Models\TournamentMatch::where(function ($query) use ($player) {
            $query
                ->where('player1_id', $player->id)
                ->orWhere('player2_id', $player->id);
        })
            ->where('status', 'completed')
            ->get();

        $wins = $matches
            ->where('winner_id', $player->id)
            ->count();

        $losses = $matches
            ->where('winner_id', '!=', $player->id)
            ->count();

        $totalMatches = $matches->count();

        $winRate = $totalMatches > 0
            ? round(($wins / $totalMatches) * 100, 2)
            : 0;

        return response()->json([
            'user' => $user,
            'player' => $player,
            'stats' => [
                'matches' => $totalMatches,
                'wins' => $wins,
                'losses' => $losses,
                'win_rate' => $winRate,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $player = $user->player;

        if (!$player) {
            return response()->json([
                'message' => 'Player profile not found.'
            ], 404);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'nickname' => [
                'required',
                'string',
                'max:100',
            ],
            'country' => [
                'required',
                'string',
                'size:2',
            ],
            'bio' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        $player->update([
            'nickname' => $data['nickname'],
            'country' => strtoupper($data['country']),
            'bio' => $data['bio'] ?? null,
        ]);

        return response()->json([
            'message' => 'Profil mis à jour avec succès.',
            'user' => $user->fresh(),
            'player' => $player->fresh(),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;

class GameController extends Controller
{
    public function index()
    {
        $games = Game::where('is_active', true)
            ->withCount('tournaments')
            ->orderBy('name')
            ->get();

        return response()->json($games);
    }

    public function show(Game $game)
    {
        if (!$game->is_active) {
            return response()->json([
                'message' => 'Jeu non disponible.'
            ], 404);
        }

        $game->load([
            'tournaments' => function ($query) {
                $query->latest();
            }
        ]);

        return response()->json($game);
    }
}

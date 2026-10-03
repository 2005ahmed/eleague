<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tournament;
use App\Services\TournamentBracketService;
use Illuminate\Http\Request;
use RuntimeException;

class BracketController extends Controller
{
    public function generate(
        Request $request,
        Tournament $tournament
    ) {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Organizer / Admin authorization
        |--------------------------------------------------------------------------
        */

        if (
            $user->role !== 'admin' &&
            !$user->is_organizer &&
            $user->role !== 'organizer'
        ) {
            return response()->json([
                'message' => 'Organizer access required.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Only tournament owner can generate
        |--------------------------------------------------------------------------
        */

        if (
            $user->role !== 'admin' &&
            $tournament->organizer_id !== $user->id
        ) {
            return response()->json([
                'message' =>
                    'Vous n\'êtes pas autorisé à générer le bracket.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Tournament must be registration
        |--------------------------------------------------------------------------
        */

        if ($tournament->status !== 'registration') {
            return response()->json([
                'message' =>
                    'Le bracket ne peut être généré que pendant les inscriptions.'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Generate
        |--------------------------------------------------------------------------
        */

        try {
            $result = app(TournamentBracketService::class)
                ->generate($tournament);

            return response()->json([
                'message' =>
                    'Le bracket a été généré avec succès.',
                'tournament_id' => $tournament->id,
                'players_count' =>
                    $result['players_count'],
                'round' =>
                    $result['round'],
                'matches_created' =>
                    $result['matches_created'],
            ], 201);

        } catch (RuntimeException $e) {

            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}

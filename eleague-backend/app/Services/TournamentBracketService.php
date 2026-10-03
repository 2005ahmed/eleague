<?php

namespace App\Services;

use App\Models\Tournament;
use App\Models\TournamentMatch;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TournamentBracketService
{
    public function generate(Tournament $tournament): array
    {
        // Already generated
        if ($tournament->matches()->exists()) {
            throw new RuntimeException(
                'Le bracket de ce tournoi a déjà été généré.'
            );
        }

        // Get registered players
        $players = $tournament->players()
            ->wherePivot('status', 'registered')
            ->get();

        $playerCount = $players->count();

        // Tournament must be full
        if ($playerCount < $tournament->max_players) {
            throw new RuntimeException(
                "Le tournoi n'est pas encore complet. " .
                "{$playerCount}/{$tournament->max_players} joueurs."
            );
        }

        // Exact number required
        if ($playerCount !== (int) $tournament->max_players) {
            throw new RuntimeException(
                'Le nombre de joueurs inscrits est invalide.'
            );
        }

        // Minimum 4 players
        if ($playerCount < 4) {
            throw new RuntimeException(
                'Il faut au moins 4 joueurs pour générer le bracket.'
            );
        }

        // Number must be power of 2
        $isPowerOfTwo =
            ($playerCount & ($playerCount - 1)) === 0;

        if (!$isPowerOfTwo) {
            throw new RuntimeException(
                'Le nombre de joueurs doit être une puissance de 2 : ' .
                '4, 8, 16, 32, 64 ou 128.'
            );
        }

        $matchesCreated = 0;

        DB::transaction(function () use (
            $tournament,
            $players,
            &$matchesCreated
        ) {
            // Randomize players
            $players = $players
                ->shuffle()
                ->values();

            $playerCount = $players->count();

            $matchesCount = $playerCount / 2;

            for ($i = 0; $i < $matchesCount; $i++) {

                $player1 = $players[$i * 2];
                $player2 = $players[$i * 2 + 1];

                TournamentMatch::create([
                    'tournament_id' => $tournament->id,
                    'round' => 1,
                    'player1_id' => $player1->id,
                    'player2_id' => $player2->id,
                    'player1_score' => 0,
                    'player2_score' => 0,
                    'winner_id' => null,
                    'scheduled_at' => null,
                    'status' => 'scheduled',
                ]);

                $matchesCreated++;
            }

            // Tournament starts automatically
            $tournament->update([
                'status' => 'in_progress',
            ]);
        });

        return [
            'players_count' => $playerCount,
            'matches_created' => $matchesCreated,
            'round' => 1,
        ];
    }
}

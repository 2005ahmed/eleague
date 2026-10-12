<?php

namespace App\Services;

use App\Models\Tournament;
use App\Models\TournamentMatch;

class TournamentStandingsService
{
    /**
     * Calculate standings for a Round Robin tournament.
     *
     * Points:
     * Win  = 3
     * Draw = 1
     * Loss = 0
     */
    public function calculate(Tournament $tournament): array
    {
        if (!$tournament->isRoundRobin()) {
            return [];
        }

        $players = $tournament->players()
            ->wherePivot('status', 'registered')
            ->get();

        $standings = [];

        foreach ($players as $player) {
            $standings[$player->id] = [
                'player_id' => $player->id,
                'player_name' => $player->user?->name ?? $player->name ?? 'Unknown',
                'played' => 0,
                'wins' => 0,
                'draws' => 0,
                'losses' => 0,
                'goals_for' => 0,
                'goals_against' => 0,
                'goal_difference' => 0,
                'points' => 0,
            ];
        }

        $matches = TournamentMatch::query()
            ->where('tournament_id', $tournament->id)
            ->where('status', 'completed')
            ->whereNotNull('player1_id')
            ->whereNotNull('player2_id')
            ->get();

        foreach ($matches as $match) {
            $player1Id = $match->player1_id;
            $player2Id = $match->player2_id;

            if (
                !isset($standings[$player1Id]) ||
                !isset($standings[$player2Id])
            ) {
                continue;
            }

            $score1 = (int) $match->player1_score;
            $score2 = (int) $match->player2_score;

            // Played
            $standings[$player1Id]['played']++;
            $standings[$player2Id]['played']++;

            // Goals
            $standings[$player1Id]['goals_for'] += $score1;
            $standings[$player1Id]['goals_against'] += $score2;

            $standings[$player2Id]['goals_for'] += $score2;
            $standings[$player2Id]['goals_against'] += $score1;

            // Result
            if ($score1 > $score2) {
                // Player 1 wins
                $standings[$player1Id]['wins']++;
                $standings[$player1Id]['points'] += 3;

                $standings[$player2Id]['losses']++;
            } elseif ($score2 > $score1) {
                // Player 2 wins
                $standings[$player2Id]['wins']++;
                $standings[$player2Id]['points'] += 3;

                $standings[$player1Id]['losses']++;
            } else {
                // Draw
                $standings[$player1Id]['draws']++;
                $standings[$player2Id]['draws']++;

                $standings[$player1Id]['points']++;
                $standings[$player2Id]['points']++;
            }
        }

        // Goal difference
        foreach ($standings as &$standing) {
            $standing['goal_difference'] =
                $standing['goals_for'] -
                $standing['goals_against'];
        }

        unset($standing);

        // Ranking:
        // 1. Points
        // 2. Goal difference
        // 3. Goals scored
        // 4. Player name
        usort($standings, function ($a, $b) {
            if ($a['points'] !== $b['points']) {
                return $b['points'] <=> $a['points'];
            }

            if ($a['goal_difference'] !== $b['goal_difference']) {
                return $b['goal_difference']
                    <=> $a['goal_difference'];
            }

            if ($a['goals_for'] !== $b['goals_for']) {
                return $b['goals_for'] <=> $a['goals_for'];
            }

            return strcasecmp(
                $a['player_name'],
                $b['player_name']
            );
        });

        // Add ranking position
        foreach ($standings as $index => &$standing) {
            $standing['position'] = $index + 1;
        }

        unset($standing);

        return $standings;
    }
}

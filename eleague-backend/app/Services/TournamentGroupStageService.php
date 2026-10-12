<?php

namespace App\Services;

use App\Models\Tournament;
use App\Models\TournamentMatch;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TournamentGroupStageService
{
    /**
     * Calculate standings for every group.
     */
    public function calculateStandings(Tournament $tournament): array
    {
        if (!$tournament->isGroupKnockout()) {
            return [];
        }

        $groupNames = TournamentMatch::query()
            ->where('tournament_id', $tournament->id)
            ->whereNotNull('group')
            ->distinct()
            ->orderBy('group')
            ->pluck('group')
            ->values()
            ->toArray();

        $result = [];

        foreach ($groupNames as $groupName) {
            $result[$groupName] = $this->calculateGroupStandings(
                $tournament,
                $groupName
            );
        }

        return $result;
    }

    /**
     * Calculate one group's standings.
     */
    public function calculateGroupStandings(
        Tournament $tournament,
        string $groupName
    ): array {
        $matches = TournamentMatch::query()
            ->with([
                'player1.user',
                'player2.user',
            ])
            ->where('tournament_id', $tournament->id)
            ->where('group', $groupName)
            ->get();

        $playerIds = $matches
            ->flatMap(function ($match) {
                return [
                    $match->player1_id,
                    $match->player2_id,
                ];
            })
            ->filter()
            ->unique()
            ->values();

        $players = $tournament->players()
            ->whereIn('players.id', $playerIds)
            ->get();

        $standings = [];

        foreach ($players as $player) {
            $standings[$player->id] = [
                'player_id' => $player->id,
                'player_name' => $player->user?->name
                    ?? $player->name
                    ?? 'Unknown',

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

        foreach ($matches as $match) {
            if ($match->status !== 'completed') {
                continue;
            }

            if (
                !$match->player1_id ||
                !$match->player2_id
            ) {
                continue;
            }

            if (
                !isset($standings[$match->player1_id]) ||
                !isset($standings[$match->player2_id])
            ) {
                continue;
            }

            $score1 = (int) $match->player1_score;
            $score2 = (int) $match->player2_score;

            $player1Id = $match->player1_id;
            $player2Id = $match->player2_id;

            $standings[$player1Id]['played']++;
            $standings[$player2Id]['played']++;

            $standings[$player1Id]['goals_for'] += $score1;
            $standings[$player1Id]['goals_against'] += $score2;

            $standings[$player2Id]['goals_for'] += $score2;
            $standings[$player2Id]['goals_against'] += $score1;

            if ($score1 > $score2) {
                $standings[$player1Id]['wins']++;
                $standings[$player1Id]['points'] += 3;

                $standings[$player2Id]['losses']++;
            } elseif ($score2 > $score1) {
                $standings[$player2Id]['wins']++;
                $standings[$player2Id]['points'] += 3;

                $standings[$player1Id]['losses']++;
            } else {
                $standings[$player1Id]['draws']++;
                $standings[$player2Id]['draws']++;

                $standings[$player1Id]['points']++;
                $standings[$player2Id]['points']++;
            }
        }

        foreach ($standings as &$standing) {
            $standing['goal_difference'] =
                $standing['goals_for'] - $standing['goals_against'];
        }

        unset($standing);

        usort($standings, function ($a, $b) {
            if ($a['points'] !== $b['points']) {
                return $b['points'] <=> $a['points'];
            }

            if ($a['goal_difference'] !== $b['goal_difference']) {
                return $b['goal_difference'] <=> $a['goal_difference'];
            }

            if ($a['goals_for'] !== $b['goals_for']) {
                return $b['goals_for'] <=> $a['goals_for'];
            }

            return strcasecmp(
                $a['player_name'],
                $b['player_name']
            );
        });

        foreach ($standings as $index => &$standing) {
            $standing['position'] = $index + 1;
        }

        unset($standing);

        return $standings;
    }

    /**
     * Check whether all group-stage matches are completed.
     */
    public function allGroupMatchesCompleted(Tournament $tournament): bool
    {
        $groupMatches = TournamentMatch::query()
            ->where('tournament_id', $tournament->id)
            ->whereNotNull('group')
            ->get();

        if ($groupMatches->isEmpty()) {
            return false;
        }

        return $groupMatches->every(
            fn ($match) => $match->status === 'completed'
        );
    }

    /**
     * Get the top two players from every group.
     */
    public function getQualifiedPlayers(Tournament $tournament): array
    {
        $standings = $this->calculateStandings($tournament);

        if (empty($standings)) {
            return [];
        }

        $qualified = [];

        foreach ($standings as $groupName => $groupStandings) {
            if (count($groupStandings) < 2) {
                throw new RuntimeException(
                    "Group {$groupName} does not have enough players."
                );
            }

            $qualified[$groupName] = [
                'first' => $groupStandings[0],
                'second' => $groupStandings[1],
            ];
        }

        return $qualified;
    }

    /**
     * Qualify top 2 from every group into the first knockout round.
     */
    public function qualify(Tournament $tournament): array
    {
        if (!$tournament->isGroupKnockout()) {
            throw new RuntimeException(
                'Qualification is only available for Group Stage tournaments.'
            );
        }

        if (!$this->allGroupMatchesCompleted($tournament)) {
            throw new RuntimeException(
                'All group-stage matches must be completed before qualification.'
            );
        }

        return DB::transaction(function () use ($tournament) {
            $qualified = $this->getQualifiedPlayers($tournament);

            $groupNames = array_keys($qualified);

            sort($groupNames, SORT_NATURAL | SORT_FLAG_CASE);

            if (count($groupNames) < 2) {
                throw new RuntimeException(
                    'At least two groups are required.'
                );
            }

            /*
             * The first knockout round starts at round 4
             * because Group Stage uses rounds 1, 2 and 3.
             */
            $knockoutMatches = TournamentMatch::query()
                ->where('tournament_id', $tournament->id)
                ->whereNull('group')
                ->where('round', 4)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            $expectedMatches = count($groupNames);

            if ($knockoutMatches->count() !== $expectedMatches) {
                throw new RuntimeException(
                    "Expected {$expectedMatches} knockout matches, found {$knockoutMatches->count()}."
                );
            }

            /*
             * Prevent qualification from being executed twice.
             */
            $alreadyQualified = $knockoutMatches->contains(function ($match) {
                return $match->player1_id !== null
                    || $match->player2_id !== null;
            });

            if ($alreadyQualified) {
                return [
                    'qualified' => $qualified,
                    'knockout_matches' => $knockoutMatches
                        ->load([
                            'player1.user',
                            'player2.user',
                        ]),
                    'already_qualified' => true,
                ];
            }

            $matchIndex = 0;

            /*
             * Pair groups:
             *
             * A + B
             * C + D
             * E + F
             * ...
             *
             * For each pair:
             *
             * A1 vs B2
             * B1 vs A2
             */
            for ($i = 0; $i < count($groupNames); $i += 2) {
                $groupA = $groupNames[$i];
                $groupB = $groupNames[$i + 1];

                $groupAFirst = $qualified[$groupA]['first']['player_id'];
                $groupASecond = $qualified[$groupA]['second']['player_id'];

                $groupBFirst = $qualified[$groupB]['first']['player_id'];
                $groupBSecond = $qualified[$groupB]['second']['player_id'];

                $match1 = $knockoutMatches[$matchIndex] ?? null;
                $match2 = $knockoutMatches[$matchIndex + 1] ?? null;

                if (!$match1 || !$match2) {
                    throw new RuntimeException(
                        'Not enough knockout matches available.'
                    );
                }

                $match1->update([
                    'player1_id' => $groupAFirst,
                    'player2_id' => $groupBSecond,
                    'status' => 'scheduled',
                ]);

                $match2->update([
                    'player1_id' => $groupBFirst,
                    'player2_id' => $groupASecond,
                    'status' => 'scheduled',
                ]);

                $matchIndex += 2;
            }

            return [
                'qualified' => $qualified,
                'knockout_matches' => TournamentMatch::query()
                    ->with([
                        'player1.user',
                        'player2.user',
                    ])
                    ->where('tournament_id', $tournament->id)
                    ->whereNull('group')
                    ->where('round', 4)
                    ->orderBy('id')
                    ->get(),

                'already_qualified' => false,
            ];
        });
    }
}

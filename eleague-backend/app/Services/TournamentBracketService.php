<?php

namespace App\Services;

use App\Models\Tournament;
use App\Models\TournamentMatch;
use Illuminate\Support\Facades\DB;

class TournamentBracketService
{
    /**
     * Generate tournament bracket according to tournament format.
     */
    public function generate(Tournament $tournament): void
    {
        if ($tournament->isKnockout()) {
            $this->generateKnockout($tournament);
            return;
        }

        if ($tournament->isRoundRobin()) {
            $this->generateRoundRobin($tournament);
            return;
        }

        if ($tournament->isGroupKnockout()) {
            $this->generateGroupKnockout($tournament);
            return;
        }

        if ($tournament->isDoubleElimination()) {
            $this->generateDoubleElimination($tournament);
            return;
        }

        throw new \RuntimeException(
            'Format de tournoi non supporté.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | KNOCKOUT
    |--------------------------------------------------------------------------
    */

    protected function generateKnockout(Tournament $tournament): void
    {
        $players = $this->registeredPlayers($tournament);

        $playerCount = $players->count();

        if ($playerCount < 4) {
            throw new \RuntimeException(
                'Un tournoi Knockout nécessite au moins 4 joueurs.'
            );
        }

        if (!$this->isPowerOfTwo($playerCount)) {
            throw new \RuntimeException(
                'Le nombre de joueurs doit être une puissance de 2.'
            );
        }

        DB::transaction(function () use (
            $tournament,
            $players,
            $playerCount
        ) {
            $this->clearMatches($tournament);

            $players = $players->shuffle()->values();

            $rounds = (int) log($playerCount, 2);

            /*
            |--------------------------------------------------------------------------
            | Round 1
            |--------------------------------------------------------------------------
            */

            for ($i = 0; $i < $playerCount; $i += 2) {
                TournamentMatch::create([
                    'tournament_id' => $tournament->id,
                    'round' => 1,
                    'group' => null,
                    'bracket' => null,

                    'player1_id' => $players[$i]->id,
                    'player2_id' => $players[$i + 1]->id,

                    'player1_score' => 0,
                    'player2_score' => 0,

                    'winner_id' => null,

                    'scheduled_at' => null,

                    'status' => 'scheduled',
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Future rounds
            |--------------------------------------------------------------------------
            */

            $matchesInRound = $playerCount / 4;

            for ($round = 2; $round <= $rounds; $round++) {
                for ($i = 0; $i < $matchesInRound; $i++) {
                    TournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'round' => $round,
                        'group' => null,
                        'bracket' => null,

                        'player1_id' => null,
                        'player2_id' => null,

                        'player1_score' => 0,
                        'player2_score' => 0,

                        'winner_id' => null,

                        'scheduled_at' => null,

                        'status' => 'pending',
                    ]);
                }

                $matchesInRound /= 2;
            }

            $tournament->update([
                'status' => 'in_progress',
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ROUND ROBIN
    |--------------------------------------------------------------------------
    */

    protected function generateRoundRobin(Tournament $tournament): void
    {
        $players = $this->registeredPlayers($tournament);

        $playerCount = $players->count();

        if ($playerCount < 2) {
            throw new \RuntimeException(
                'Un tournoi Round Robin nécessite au moins 2 joueurs.'
            );
        }

        if ($playerCount % 2 !== 0) {
            throw new \RuntimeException(
                'Le nombre de joueurs doit être pair.'
            );
        }

        DB::transaction(function () use (
            $tournament,
            $players
        ) {
            $this->clearMatches($tournament);

            $players = $players->shuffle()->values();

            $playerIds = $players
                ->pluck('id')
                ->values()
                ->all();

            $count = count($playerIds);

            $rounds = $count - 1;

            for ($round = 1; $round <= $rounds; $round++) {
                for ($i = 0; $i < $count / 2; $i++) {
                    $player1 = $playerIds[$i];

                    $player2 = $playerIds[
                        $count - 1 - $i
                    ];

                    TournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'round' => $round,
                        'group' => null,
                        'bracket' => null,

                        'player1_id' => $player1,
                        'player2_id' => $player2,

                        'player1_score' => 0,
                        'player2_score' => 0,

                        'winner_id' => null,

                        'scheduled_at' => null,

                        'status' => 'scheduled',
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | Circle rotation
                |--------------------------------------------------------------------------
                */

                $fixed = $playerIds[0];

                $rotating = array_slice(
                    $playerIds,
                    1
                );

                $last = array_pop($rotating);

                array_unshift(
                    $rotating,
                    $last
                );

                $playerIds = array_merge(
                    [$fixed],
                    $rotating
                );
            }

            $tournament->update([
                'status' => 'in_progress',
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | GROUP STAGE -> KNOCKOUT
    |--------------------------------------------------------------------------
    */

    protected function generateGroupKnockout(
        Tournament $tournament
    ): void {
        $players = $this->registeredPlayers($tournament);

        $playerCount = $players->count();

        if ($playerCount < 8) {
            throw new \RuntimeException(
                'Un tournoi Group Stage nécessite au moins 8 joueurs.'
            );
        }

        if ($playerCount > 128) {
            throw new \RuntimeException(
                'Le tournoi ne peut pas dépasser 128 joueurs.'
            );
        }

        if ($playerCount % 4 !== 0) {
            throw new \RuntimeException(
                'Le nombre de joueurs doit être divisible par 4.'
            );
        }

        $groupsCount = intdiv(
            $playerCount,
            4
        );

        $qualifiedCount = $groupsCount * 2;

        if (!$this->isPowerOfTwo($qualifiedCount)) {
            throw new \RuntimeException(
                'Le nombre de joueurs qualifiés doit être une puissance de 2.'
            );
        }

        DB::transaction(function () use (
            $tournament,
            $players,
            $groupsCount,
            $qualifiedCount
        ) {
            $this->clearMatches($tournament);

            $players = $players->shuffle()->values();

            /*
            |--------------------------------------------------------------------------
            | Create groups
            |--------------------------------------------------------------------------
            */

            $groups = [];

            for ($i = 0; $i < $groupsCount; $i++) {
                $groups[] = array_slice(
                    $players->all(),
                    $i * 4,
                    4
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Group matches
            |--------------------------------------------------------------------------
            */

            foreach ($groups as $groupIndex => $groupPlayers) {
                $groupName = 'Group ' .
                    chr(65 + $groupIndex);

                /*
                |--------------------------------------------------------------------------
                | Group Round 1
                |--------------------------------------------------------------------------
                */

                $roundOnePairs = [
                    [$groupPlayers[0], $groupPlayers[1]],
                    [$groupPlayers[2], $groupPlayers[3]],
                ];

                foreach ($roundOnePairs as $pair) {
                    TournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'round' => 1,
                        'group' => $groupName,
                        'bracket' => null,

                        'player1_id' => $pair[0]->id,
                        'player2_id' => $pair[1]->id,

                        'player1_score' => 0,
                        'player2_score' => 0,

                        'winner_id' => null,

                        'scheduled_at' => null,

                        'status' => 'scheduled',
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | Group Round 2
                |--------------------------------------------------------------------------
                */

                $roundTwoPairs = [
                    [$groupPlayers[0], $groupPlayers[2]],
                    [$groupPlayers[1], $groupPlayers[3]],
                ];

                foreach ($roundTwoPairs as $pair) {
                    TournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'round' => 2,
                        'group' => $groupName,
                        'bracket' => null,

                        'player1_id' => $pair[0]->id,
                        'player2_id' => $pair[1]->id,

                        'player1_score' => 0,
                        'player2_score' => 0,

                        'winner_id' => null,

                        'scheduled_at' => null,

                        'status' => 'scheduled',
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | Group Round 3
                |--------------------------------------------------------------------------
                */

                $roundThreePairs = [
                    [$groupPlayers[0], $groupPlayers[3]],
                    [$groupPlayers[1], $groupPlayers[2]],
                ];

                foreach ($roundThreePairs as $pair) {
                    TournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'round' => 3,
                        'group' => $groupName,
                        'bracket' => null,

                        'player1_id' => $pair[0]->id,
                        'player2_id' => $pair[1]->id,

                        'player1_score' => 0,
                        'player2_score' => 0,

                        'winner_id' => null,

                        'scheduled_at' => null,

                        'status' => 'scheduled',
                    ]);
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Future Knockout
            |--------------------------------------------------------------------------
            */

            $rounds = (int) log(
                $qualifiedCount,
                2
            );

            $matchesInRound = intdiv(
                $qualifiedCount,
                2
            );

            for (
                $round = 4;
                $round < 4 + $rounds;
                $round++
            ) {
                for (
                    $i = 0;
                    $i < $matchesInRound;
                    $i++
                ) {
                    TournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'round' => $round,
                        'group' => null,
                        'bracket' => 'knockout',

                        'player1_id' => null,
                        'player2_id' => null,

                        'player1_score' => 0,
                        'player2_score' => 0,

                        'winner_id' => null,

                        'scheduled_at' => null,

                        'status' => 'pending',
                    ]);
                }

                $matchesInRound = intdiv(
                    $matchesInRound,
                    2
                );
            }

            $tournament->update([
                'status' => 'in_progress',
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DOUBLE ELIMINATION
    |--------------------------------------------------------------------------
    */

    protected function generateDoubleElimination(
        Tournament $tournament
    ): void {
        $players = $this->registeredPlayers($tournament);

        $playerCount = $players->count();

        if ($playerCount < 4) {
            throw new \RuntimeException(
                'Un tournoi Double Elimination nécessite au moins 4 joueurs.'
            );
        }

        if ($playerCount > 128) {
            throw new \RuntimeException(
                'Le tournoi ne peut pas dépasser 128 joueurs.'
            );
        }

        if (!$this->isPowerOfTwo($playerCount)) {
            throw new \RuntimeException(
                'Le nombre de joueurs doit être une puissance de 2.'
            );
        }

        DB::transaction(function () use (
            $tournament,
            $players,
            $playerCount
        ) {
            $this->clearMatches($tournament);

            $players = $players
                ->shuffle()
                ->values();

            /*
            |--------------------------------------------------------------------------
            | Winners Bracket
            |--------------------------------------------------------------------------
            */

            $winnersRounds = (int) log(
                $playerCount,
                2
            );

            /*
            |--------------------------------------------------------------------------
            | Winners Round 1
            |--------------------------------------------------------------------------
            */

            for (
                $i = 0;
                $i < $playerCount;
                $i += 2
            ) {
                TournamentMatch::create([
                    'tournament_id' => $tournament->id,
                    'round' => 1,
                    'group' => null,
                    'bracket' => 'winners',

                    'player1_id' => $players[$i]->id,
                    'player2_id' => $players[$i + 1]->id,

                    'player1_score' => 0,
                    'player2_score' => 0,

                    'winner_id' => null,

                    'scheduled_at' => null,

                    'status' => 'scheduled',
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Future Winners Rounds
            |--------------------------------------------------------------------------
            */

            $matchesInRound = intdiv(
                $playerCount,
                4
            );

            for (
                $round = 2;
                $round <= $winnersRounds;
                $round++
            ) {
                for (
                    $i = 0;
                    $i < $matchesInRound;
                    $i++
                ) {
                    TournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'round' => $round,
                        'group' => null,
                        'bracket' => 'winners',

                        'player1_id' => null,
                        'player2_id' => null,

                        'player1_score' => 0,
                        'player2_score' => 0,

                        'winner_id' => null,

                        'scheduled_at' => null,

                        'status' => 'pending',
                    ]);
                }

                $matchesInRound = intdiv(
                    $matchesInRound,
                    2
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Losers Bracket
            |--------------------------------------------------------------------------
            |
            | Double Elimination requires:
            |
            | 2 * (N - 1)
            |
            | matches in the Losers Bracket.
            |
            | The number of rounds is:
            |
            | 2 * (log2(N) - 1)
            |
            */

            $losersRounds = 2 * (
                $winnersRounds - 1
            );

            /*
            |--------------------------------------------------------------------------
            | Losers Bracket Match Structure
            |--------------------------------------------------------------------------
            */

            $losersMatchesPerRound = [];

            /*
            | Example for 8 players:
            |
            | L1 = 2 matches
            | L2 = 2 matches
            | L3 = 1 match
            | L4 = 1 match
            */

            $matchesCount = intdiv(
                $playerCount,
                4
            );

            for (
                $round = 1;
                $round <= $losersRounds;
                $round++
            ) {
                $losersMatchesPerRound[$round] =
                    max(1, $matchesCount);

                /*
                | Every second round reduces the number
                | of matches by half.
                */

                if ($round % 2 === 0) {
                    $matchesCount = max(
                        1,
                        intdiv(
                            $matchesCount,
                            2
                        )
                    );
                }
            }

            foreach (
                $losersMatchesPerRound
                as $round => $numberOfMatches
            ) {
                for (
                    $i = 0;
                    $i < $numberOfMatches;
                    $i++
                ) {
                    TournamentMatch::create([
                        'tournament_id' => $tournament->id,
                        'round' => $round,
                        'group' => null,
                        'bracket' => 'losers',

                        'player1_id' => null,
                        'player2_id' => null,

                        'player1_score' => 0,
                        'player2_score' => 0,

                        'winner_id' => null,

                        'scheduled_at' => null,

                        'status' => 'pending',
                    ]);
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Grand Final
            |--------------------------------------------------------------------------
            */

            $grandFinalRound =
                $winnersRounds +
                $losersRounds +
                1;

            TournamentMatch::create([
                'tournament_id' => $tournament->id,
                'round' => $grandFinalRound,
                'group' => null,
                'bracket' => 'grand_final',

                'player1_id' => null,
                'player2_id' => null,

                'player1_score' => 0,
                'player2_score' => 0,

                'winner_id' => null,

                'scheduled_at' => null,

                'status' => 'pending',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Grand Final Reset
            |--------------------------------------------------------------------------
            */

            TournamentMatch::create([
                'tournament_id' => $tournament->id,
                'round' => $grandFinalRound + 1,
                'group' => null,
                'bracket' => 'grand_final_reset',

                'player1_id' => null,
                'player2_id' => null,

                'player1_score' => 0,
                'player2_score' => 0,

                'winner_id' => null,

                'scheduled_at' => null,

                'status' => 'pending',
            ]);

            $tournament->update([
                'status' => 'in_progress',
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    protected function registeredPlayers(
        Tournament $tournament
    ) {
        return $tournament->players()
            ->wherePivot(
                'status',
                'registered'
            )
            ->get();
    }

    protected function clearMatches(
        Tournament $tournament
    ): void {
        $tournament->matches()->delete();
    }

    protected function isPowerOfTwo(
        int $number
    ): bool {
        return $number > 0 &&
            ($number & ($number - 1)) === 0;
    }
}

<?php

namespace App\Services;

use App\Models\Tournament;
use App\Models\TournamentMatch;
use Illuminate\Support\Facades\DB;

class DoubleEliminationService
{
    /**
     * Complete a Double Elimination match.
     */
    public function completeMatch(
        TournamentMatch $match
    ): array {
        $tournament = $match->tournament;

        if (!$tournament->isDoubleElimination()) {
            throw new \RuntimeException(
                'This tournament is not Double Elimination.'
            );
        }

        if (!$match->winner_id) {
            throw new \RuntimeException(
                'A winner is required.'
            );
        }

        if (!$match->bracket) {
            throw new \RuntimeException(
                'Match bracket is missing.'
            );
        }

        return DB::transaction(function () use (
            $match,
            $tournament
        ) {
            $match->refresh();

            return match ($match->bracket) {
                'winners' => $this->completeWinnersMatch(
                    $match,
                    $tournament
                ),

                'losers' => $this->completeLosersMatch(
                    $match,
                    $tournament
                ),

                'grand_final' => $this->completeGrandFinal(
                    $match,
                    $tournament
                ),

                'grand_final_reset' => $this->completeGrandFinalReset(
                    $match,
                    $tournament
                ),

                default => throw new \RuntimeException(
                    'Unknown Double Elimination bracket.'
                ),
            };
        });
    }


    /*
    |--------------------------------------------------------------------------
    | WINNERS BRACKET
    |--------------------------------------------------------------------------
    */

    protected function completeWinnersMatch(
        TournamentMatch $match,
        Tournament $tournament
    ): array {
        $loserId = $this->getLoserId($match);

        /*
        |----------------------------------------------------------------------
        | Winners Final
        |----------------------------------------------------------------------
        */

        if ($this->isWinnersFinal($match, $tournament)) {

            if ($loserId) {
                $this->sendWinnersFinalLoserToLosers(
                    $match,
                    $loserId,
                    $tournament
                );
            }

            $this->setGrandFinalPlayer(
                $tournament,
                $match->winner_id,
                'player1'
            );

            return [
                'type' => 'winners_final',
                'winner_id' => $match->winner_id,
                'loser_id' => $loserId,
            ];
        }

        /*
        |----------------------------------------------------------------------
        | Normal Winners Round
        |----------------------------------------------------------------------
        */

        if ($loserId) {
            $this->sendWinnersLoserToLosers(
                $match,
                $loserId,
                $tournament
            );
        }

        $this->advanceWinnersWinner(
            $match,
            $tournament
        );

        return [
            'type' => 'winners',
            'winner_id' => $match->winner_id,
            'loser_id' => $loserId,
        ];
    }


    /**
     * Check if this is the final round of Winners Bracket.
     */
    protected function isWinnersFinal(
        TournamentMatch $match,
        Tournament $tournament
    ): bool {
        return !$tournament->matches()
            ->where('bracket', 'winners')
            ->where(
                'round',
                '>',
                $match->round
            )
            ->exists();
    }


    /**
     * Advance Winners Bracket winner.
     */
    protected function advanceWinnersWinner(
        TournamentMatch $match,
        Tournament $tournament
    ): void {
        $nextRound = $match->round + 1;

        $currentRoundMatches = $tournament
            ->matches()
            ->where('bracket', 'winners')
            ->where('round', $match->round)
            ->orderBy('id')
            ->get();

        $nextRoundMatches = $tournament
            ->matches()
            ->where('bracket', 'winners')
            ->where('round', $nextRound)
            ->orderBy('id')
            ->get();

        $currentIndex = $currentRoundMatches->search(
            fn ($item) =>
                $item->id === $match->id
        );

        if ($currentIndex === false) {
            throw new \RuntimeException(
                'Current Winners match could not be located.'
            );
        }

        $nextMatchIndex = intdiv(
            $currentIndex,
            2
        );

        $nextMatch = $nextRoundMatches[
            $nextMatchIndex
        ] ?? null;

        if (!$nextMatch) {
            throw new \RuntimeException(
                'Next Winners match could not be located.'
            );
        }

        $this->placePlayer(
            $nextMatch,
            $match->winner_id
        );
    }


    /*
    |--------------------------------------------------------------------------
    | LOSERS FROM WINNERS BRACKET
    |--------------------------------------------------------------------------
    */

    /**
     * Send a loser from Winners Round 1 to Losers Round 1.
     */
    protected function sendWinnersLoserToLosers(
        TournamentMatch $winnersMatch,
        int $loserId,
        Tournament $tournament
    ): void {
        /*
        | Winners Round 1 losers always enter Losers Round 1.
        */

        if ($winnersMatch->round === 1) {
            $this->placeWinnerRoundOneLoser(
                $winnersMatch,
                $loserId,
                $tournament
            );

            return;
        }

        /*
        | For later Winners rounds:
        |
        | Winners R2 loser -> Losers R2
        | Winners R3 loser -> Losers final/last losers phase
        |
        | We calculate the correct target using the Winners round
        | and the current Losers bracket structure.
        */

        $targetRound = $this->loserEntryRound(
            $winnersMatch->round
        );

        $targetMatches = $tournament
            ->matches()
            ->where('bracket', 'losers')
            ->where('round', $targetRound)
            ->orderBy('id')
            ->get();

        if ($targetMatches->isEmpty()) {
            throw new \RuntimeException(
                "Losers Round {$targetRound} does not exist."
            );
        }

        /*
        |----------------------------------------------------------------------
        | Prefer an empty slot.
        |----------------------------------------------------------------------
        */

        foreach ($targetMatches as $targetMatch) {
            if (
                !$targetMatch->player1_id ||
                !$targetMatch->player2_id
            ) {
                $this->placePlayer(
                    $targetMatch,
                    $loserId
                );

                return;
            }
        }

        throw new \RuntimeException(
            'No available Losers Bracket slot was found.'
        );
    }


    /**
     * Winners Round 1 loser placement.
     *
     * Example with 8 players:
     *
     * W1 Match 1 loser -> L1 Match 1
     * W1 Match 2 loser -> L1 Match 1
     * W1 Match 3 loser -> L1 Match 2
     * W1 Match 4 loser -> L1 Match 2
     */
    protected function placeWinnerRoundOneLoser(
        TournamentMatch $winnersMatch,
        int $loserId,
        Tournament $tournament
    ): void {
        $winnersMatches = $tournament
            ->matches()
            ->where('bracket', 'winners')
            ->where('round', 1)
            ->orderBy('id')
            ->get();

        $losersMatches = $tournament
            ->matches()
            ->where('bracket', 'losers')
            ->where('round', 1)
            ->orderBy('id')
            ->get();

        $sourceIndex = $winnersMatches->search(
            fn ($item) =>
                $item->id === $winnersMatch->id
        );

        if ($sourceIndex === false) {
            throw new \RuntimeException(
                'Winners Round 1 match was not found.'
            );
        }

        $targetIndex = intdiv(
            $sourceIndex,
            2
        );

        $targetMatch = $losersMatches[
            $targetIndex
        ] ?? null;

        if (!$targetMatch) {
            throw new \RuntimeException(
                'Losers Round 1 target was not found.'
            );
        }

        $this->placePlayer(
            $targetMatch,
            $loserId
        );
    }


    /**
     * Winners Final loser must enter the last Losers round.
     */
    protected function sendWinnersFinalLoserToLosers(
        TournamentMatch $winnersMatch,
        int $loserId,
        Tournament $tournament
    ): void {
        $lastLosersRound = $tournament
            ->matches()
            ->where('bracket', 'losers')
            ->max('round');

        if (!$lastLosersRound) {
            throw new \RuntimeException(
                'Losers Bracket does not exist.'
            );
        }

        $matches = $tournament
            ->matches()
            ->where('bracket', 'losers')
            ->where(
                'round',
                $lastLosersRound
            )
            ->orderBy('id')
            ->get();

        foreach ($matches as $match) {
            if (
                !$match->player1_id ||
                !$match->player2_id
            ) {
                $this->placePlayer(
                    $match,
                    $loserId
                );

                return;
            }
        }

        throw new \RuntimeException(
            'No available Losers Final slot was found.'
        );
    }


    /**
     * Determine Losers Bracket entry round.
     *
     * This follows the structure generated by TournamentBracketService.
     */
    protected function loserEntryRound(
        int $winnersRound
    ): int {
        /*
        | Winners R2 -> Losers R2
        | Winners R3 -> Last Losers Round
        |
        | For larger brackets the last Winners round always feeds
        | the last Losers round.
        */

        if ($winnersRound <= 1) {
            return 1;
        }

        return ($winnersRound - 1) * 2;
    }


    /*
    |--------------------------------------------------------------------------
    | LOSERS BRACKET
    |--------------------------------------------------------------------------
    */

    protected function completeLosersMatch(
        TournamentMatch $match,
        Tournament $tournament
    ): array {
        $loserId = $this->getLoserId($match);

        /*
        |----------------------------------------------------------------------
        | Losers Final
        |----------------------------------------------------------------------
        */

        if ($this->isLosersFinal($match, $tournament)) {

            $this->setGrandFinalPlayer(
                $tournament,
                $match->winner_id,
                'player2'
            );

            return [
                'type' => 'losers_final',
                'winner_id' => $match->winner_id,
                'eliminated_id' => $loserId,
            ];
        }

        /*
        |----------------------------------------------------------------------
        | Normal Losers Match
        |----------------------------------------------------------------------
        */

        $this->advanceLosersWinner(
            $match,
            $tournament
        );

        return [
            'type' => 'losers',
            'winner_id' => $match->winner_id,
            'eliminated_id' => $loserId,
        ];
    }


    /**
     * Check if this is the final Losers Bracket round.
     */
    protected function isLosersFinal(
        TournamentMatch $match,
        Tournament $tournament
    ): bool {
        return !$tournament->matches()
            ->where('bracket', 'losers')
            ->where(
                'round',
                '>',
                $match->round
            )
            ->exists();
    }


    /**
     * Advance a Losers Bracket winner.
     */
    protected function advanceLosersWinner(
        TournamentMatch $match,
        Tournament $tournament
    ): void {
        $nextRound = $match->round + 1;

        $nextMatches = $tournament
            ->matches()
            ->where('bracket', 'losers')
            ->where('round', $nextRound)
            ->orderBy('id')
            ->get();

        if ($nextMatches->isEmpty()) {
            throw new \RuntimeException(
                'Next Losers match could not be located.'
            );
        }

        $currentMatches = $tournament
            ->matches()
            ->where('bracket', 'losers')
            ->where('round', $match->round)
            ->orderBy('id')
            ->get();

        $currentIndex = $currentMatches->search(
            fn ($item) =>
                $item->id === $match->id
        );

        if ($currentIndex === false) {
            throw new \RuntimeException(
                'Current Losers match could not be located.'
            );
        }

        /*
        | Normally two Losers matches feed one next match.
        */

        $nextMatchIndex = intdiv(
            $currentIndex,
            2
        );

        $nextMatch = $nextMatches[
            $nextMatchIndex
        ] ?? null;

        /*
        | If the bracket is in a transition phase,
        | find the first available slot.
        */

        if (!$nextMatch) {
            $nextMatch = $nextMatches->first(
                fn ($item) =>
                    !$item->player1_id ||
                    !$item->player2_id
            );
        }

        if (!$nextMatch) {
            throw new \RuntimeException(
                'No available next Losers slot was found.'
            );
        }

        $this->placePlayer(
            $nextMatch,
            $match->winner_id
        );
    }


    /*
    |--------------------------------------------------------------------------
    | GRAND FINAL
    |--------------------------------------------------------------------------
    */

    protected function setGrandFinalPlayer(
        Tournament $tournament,
        int $playerId,
        string $slot
    ): void {
        $grandFinal = $tournament
            ->matches()
            ->where('bracket', 'grand_final')
            ->first();

        if (!$grandFinal) {
            throw new \RuntimeException(
                'Grand Final does not exist.'
            );
        }

        $grandFinal->update([
            $slot . '_id' => $playerId,
        ]);

        $grandFinal->refresh();

        if (
            $grandFinal->player1_id &&
            $grandFinal->player2_id
        ) {
            $grandFinal->update([
                'status' => 'scheduled',
            ]);
        }
    }


    /**
     * Complete Grand Final.
     */
    protected function completeGrandFinal(
        TournamentMatch $match,
        Tournament $tournament
    ): array {
        $winnerId = $match->winner_id;

        /*
        | The Winners Bracket champion has one life.
        | The Losers Bracket champion has zero lives.
        |
        | If the Losers champion wins the first Grand Final,
        | a reset final is required.
        */

        if (
            $winnerId === $match->player2_id
        ) {
            $reset = $tournament
                ->matches()
                ->where(
                    'bracket',
                    'grand_final_reset'
                )
                ->first();

            if (!$reset) {
                throw new \RuntimeException(
                    'Grand Final reset match does not exist.'
                );
            }

            $reset->update([
                'player1_id' => $match->player1_id,
                'player2_id' => $match->player2_id,
                'status' => 'scheduled',
            ]);

            return [
                'type' => 'grand_final_reset',
                'winner_id' => $winnerId,
                'reset_match_id' => $reset->id,
            ];
        }

        /*
        | Winners champion wins Grand Final.
        */

        $this->completeTournament(
            $tournament,
            $winnerId
        );

        return [
            'type' => 'champion',
            'winner_id' => $winnerId,
        ];
    }


    /**
     * Complete Reset Final.
     */
    protected function completeGrandFinalReset(
        TournamentMatch $match,
        Tournament $tournament
    ): array {
        $winnerId = $match->winner_id;

        $this->completeTournament(
            $tournament,
            $winnerId
        );

        return [
            'type' => 'champion',
            'winner_id' => $winnerId,
            'reset' => true,
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Get loser ID from completed match.
     */
    protected function getLoserId(
        TournamentMatch $match
    ): ?int {
        if (!$match->winner_id) {
            return null;
        }

        if (
            $match->player1_id ===
            $match->winner_id
        ) {
            return $match->player2_id;
        }

        if (
            $match->player2_id ===
            $match->winner_id
        ) {
            return $match->player1_id;
        }

        throw new \RuntimeException(
            'Winner does not belong to this match.'
        );
    }


    /**
     * Put a player into the first available slot.
     */
    protected function placePlayer(
    TournamentMatch $match,
    int $playerId
): void {
    if (
        $match->player1_id === $playerId ||
        $match->player2_id === $playerId
    ) {
        return;
    }

    if (!$match->player1_id) {
        $match->player1_id = $playerId;
    } elseif (!$match->player2_id) {
        $match->player2_id = $playerId;
    } else {
        throw new \RuntimeException(
            'The target match already has two players.'
        );
    }

    $match->status =
        $match->player1_id &&
        $match->player2_id
            ? 'scheduled'
            : 'pending';

    $match->save();
}


    /**
     * Determine match status.
     */
    protected function matchReadyStatus(
        TournamentMatch $match
    ): string {
        if (
            $match->player1_id &&
            $match->player2_id
        ) {
            return 'scheduled';
        }

        return 'pending';
    }


    /**
     * Complete tournament.
     */
    protected function completeTournament(
        Tournament $tournament,
        int $winnerId
    ): void {
        $tournament->update([
            'status' => 'completed',
        ]);

        $tournament->matches()
            ->where(
                'bracket',
                'grand_final_reset'
            )
            ->where(
                'status',
                'pending'
            )
            ->update([
                'status' => 'cancelled',
            ]);
    }
}

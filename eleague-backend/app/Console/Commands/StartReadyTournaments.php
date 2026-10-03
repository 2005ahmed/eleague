<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tournament;
use App\Services\TournamentBracketService;
use RuntimeException;

class StartReadyTournaments extends Command
{
    protected $signature = 'tournaments:start-ready';

    protected $description =
        'Start tournaments that are full and have reached their start date';

    public function handle(
        TournamentBracketService $bracketService
    ) {
        $tournaments = Tournament::query()
            ->where('status', 'registration')
            ->whereNotNull('start_date')
            ->where('start_date', '<=', now())
            ->with('players')
            ->get();

        foreach ($tournaments as $tournament) {

            $playersCount = $tournament
                ->players()
                ->wherePivot('status', 'registered')
                ->count();

            /*
            |--------------------------------------------------------------------------
            | Tournament must be full
            |--------------------------------------------------------------------------
            */

            if (
                $playersCount < $tournament->max_players
            ) {
                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | Generate bracket + start
            |--------------------------------------------------------------------------
            */

            try {

                $result =
                    $bracketService->generate(
                        $tournament
                    );

                $this->info(
                    "Tournament #{$tournament->id} started. " .
                    "{$result['matches_created']} matches created."
                );

            } catch (RuntimeException $e) {

                $this->error(
                    "Tournament #{$tournament->id}: " .
                    $e->getMessage()
                );
            }
        }

        return self::SUCCESS;
    }
}

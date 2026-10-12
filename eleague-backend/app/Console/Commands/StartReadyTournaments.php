<?php

namespace App\Console\Commands;

use App\Models\Tournament;
use App\Services\TournamentBracketService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class StartReadyTournaments extends Command
{
    protected $signature = 'tournaments:auto-start';

    protected $description = 'Automatically start tournaments that are full and whose start date has arrived.';

    public function handle(
        TournamentBracketService $bracketService
    ): int {
        $now = Carbon::now();

        $tournaments = Tournament::query()
            ->withCount('players')
            ->whereIn('status', [
                'registration',
                'published',
            ])
            ->whereNotNull('start_date')
            ->where('start_date', '<=', $now)
            ->get();

        if ($tournaments->isEmpty()) {
            $this->info(
                'No tournaments are ready to start.'
            );

            return self::SUCCESS;
        }

        foreach ($tournaments as $tournament) {
            try {
                $this->startTournament(
                    $tournament,
                    $bracketService
                );
            } catch (\Throwable $e) {
                Log::error(
                    'Tournament auto-start failed.',
                    [
                        'tournament_id' =>
                            $tournament->id,
                        'message' =>
                            $e->getMessage(),
                        'trace' =>
                            $e->getTraceAsString(),
                    ]
                );

                $this->error(
                    "Tournament #{$tournament->id} failed: {$e->getMessage()}"
                );
            }
        }

        return self::SUCCESS;
    }

    protected function startTournament(
        Tournament $tournament,
        TournamentBracketService $bracketService
    ): void {
        $playersCount =
            (int) $tournament->players_count;

        $maxPlayers =
            (int) $tournament->max_players;

        /*
        |--------------------------------------------------------------------------
        | Tournament must be full
        |--------------------------------------------------------------------------
        */

        if ($playersCount < $maxPlayers) {
            $this->line(
                "Tournament #{$tournament->id}: waiting for players ({$playersCount}/{$maxPlayers})."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Extra protection against duplicate starts
        |--------------------------------------------------------------------------
        */

        if (
            $tournament->status ===
            'in_progress'
        ) {
            $this->line(
                "Tournament #{$tournament->id}: already in progress."
            );

            return;
        }

        if (
            in_array(
                $tournament->status,
                [
                    'completed',
                    'cancelled',
                ],
                true
            )
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Make sure we don't generate a second bracket
        |--------------------------------------------------------------------------
        */

        if (
            $tournament
                ->matches()
                ->exists()
        ) {
            $this->line(
                "Tournament #{$tournament->id}: matches already exist, skipping."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Generate the correct tournament system
        |--------------------------------------------------------------------------
        */

        $this->info(
            "Starting tournament #{$tournament->id} ({$tournament->format})..."
        );

        $bracketService->generate(
            $tournament
        );

        /*
        |--------------------------------------------------------------------------
        | Refresh and verify
        |--------------------------------------------------------------------------
        */

        $tournament->refresh();

        $this->info(
            "Tournament #{$tournament->id} started successfully."
        );

        $this->line(
            "Format: {$tournament->format}"
        );

        $this->line(
            "Players: {$playersCount}/{$maxPlayers}"
        );

        $this->line(
            "Matches: " .
            $tournament
                ->matches()
                ->count()
        );
    }
}

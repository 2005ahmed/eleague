<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;
use App\Services\TournamentBracketService;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class TournamentRegistrationController extends Controller
{
    /**
     * Register current player in a tournament.
     */
    public function store(
        Request $request,
        Tournament $tournament
    ) {
        $user = $request->user();

        // ============================================================
        // PLAYER PROFILE
        // ============================================================

        $player = $user->player;

        if (!$player) {
            return response()->json([
                'message' =>
                    'Vous devez avoir un profil joueur.'
            ], 422);
        }

        // ============================================================
        // TOURNAMENT STATUS
        // ============================================================

        if ($tournament->status !== 'registration') {
            return response()->json([
                'message' =>
                    'Les inscriptions sont fermées pour ce tournoi.'
            ], 422);
        }

        // ============================================================
        // REGISTER SAFELY
        // ============================================================

        try {
            $registration = DB::transaction(function () use (
                $tournament,
                $player
            ) {
                /*
                 * Lock tournament row.
                 *
                 * This prevents two players from taking
                 * the last available slot at the same time.
                 */
                $lockedTournament = Tournament::query()
                    ->where('id', $tournament->id)
                    ->lockForUpdate()
                    ->first();

                if (!$lockedTournament) {
                    return [
                        'error' => [
                            'message' =>
                                'Tournoi introuvable.',
                            'status' => 404,
                        ],
                    ];
                }

                // ====================================================
                // STATUS CHECK AGAIN AFTER LOCK
                // ====================================================

                if (
                    $lockedTournament->status !==
                    'registration'
                ) {
                    return [
                        'error' => [
                            'message' =>
                                'Les inscriptions sont fermées pour ce tournoi.',
                            'status' => 422,
                        ],
                    ];
                }

                // ====================================================
                // ALREADY REGISTERED
                // ====================================================

                $alreadyRegistered = $lockedTournament
                    ->players()
                    ->where('players.id', $player->id)
                    ->wherePivot(
                        'status',
                        'registered'
                    )
                    ->exists();

                if ($alreadyRegistered) {
                    return [
                        'error' => [
                            'message' =>
                                'Vous êtes déjà inscrit à ce tournoi.',
                            'status' => 409,
                        ],
                    ];
                }

                // ====================================================
                // CAPACITY
                // ====================================================

                $playersCount = $lockedTournament
                    ->players()
                    ->wherePivot(
                        'status',
                        'registered'
                    )
                    ->count();

                if (
                    $playersCount >=
                    (int) $lockedTournament->max_players
                ) {
                    return [
                        'error' => [
                            'message' =>
                                'Ce tournoi est complet.',
                            'status' => 422,
                        ],
                    ];
                }

                // ====================================================
                // REGISTER PLAYER
                // ====================================================

                $lockedTournament
                    ->players()
                    ->attach(
                        $player->id,
                        [
                            'status' => 'registered',
                            'joined_at' => now(),
                        ]
                    );

                return [
                    'success' => true,
                    'tournament' =>
                        $lockedTournament,
                    'players_count' =>
                        $playersCount + 1,
                ];
            });

            // ========================================================
            // HANDLE TRANSACTION ERROR RESPONSE
            // ========================================================

            if (isset($registration['error'])) {
                return response()->json(
                    $registration['error'],
                    $registration['error']['status']
                );
            }

        } catch (\Throwable $e) {

            Log::error(
                'Tournament registration failed.',
                [
                    'tournament_id' =>
                        $tournament->id,

                    'player_id' =>
                        $player->id,

                    'error' =>
                        $e->getMessage(),
                ]
            );

            return response()->json([
                'message' =>
                    'Impossible de rejoindre ce tournoi pour le moment.'
            ], 500);
        }

        // ============================================================
        // NOTIFICATION TO PLAYER
        // ============================================================

        NotificationService::send(
            $user,
            'tournament',
            'Inscription confirmée 🏆',
            "Tu es maintenant inscrit au tournoi {$tournament->name}.",
            [
                'tournament_id' =>
                    $tournament->id,
            ]
        );

        // ============================================================
        // NOTIFICATION TO ORGANIZER
        // ============================================================

        /*
         * Do not notify the organizer if they somehow
         * register to their own tournament.
         */

        if ($tournament->organizer_id !== $user->id) {
            NotificationService::send(
                $tournament->organizer,
                'tournament',
                'Nouveau joueur inscrit',
                "{$player->nickname} vient de rejoindre {$tournament->name}.",
                [
                    'tournament_id' =>
                        $tournament->id,

                    'player_id' =>
                        $player->id,
                ]
            );
        }

        // ============================================================
        // AUTO START
        // ============================================================
        //
        // Conditions:
        //
        // 1. Tournament is full
        // 2. start_date exists
        // 3. start_date has arrived
        //
        // Then the bracket/matches are generated automatically.
        //

        $tournament->refresh();

        $playersCount = $tournament
            ->players()
            ->wherePivot('status', 'registered')
            ->count();

        $shouldStart =
            $playersCount >=
                (int) $tournament->max_players &&
            $tournament->status === 'registration' &&
            $tournament->start_date !== null &&
            now()->greaterThanOrEqualTo(
                $tournament->start_date
            );

        if ($shouldStart) {

            try {

                app(TournamentBracketService::class)
                    ->generate($tournament);

            } catch (RuntimeException $e) {

                /*
                 * Registration succeeded.
                 *
                 * If bracket generation fails,
                 * registration remains valid and
                 * the organizer/scheduler can retry later.
                 */

                Log::warning(
                    'Tournament could not auto-start.',
                    [
                        'tournament_id' =>
                            $tournament->id,

                        'format' =>
                            $tournament->format,

                        'reason' =>
                            $e->getMessage(),
                    ]
                );
            }
        }

        // ============================================================
        // RESPONSE
        // ============================================================

        $tournament->refresh();

        return response()->json([
            'message' =>
                'Vous êtes inscrit au tournoi avec succès.',

            'tournament_id' =>
                $tournament->id,

            'player_id' =>
                $player->id,

            'players_count' =>
                $playersCount,

            'max_players' =>
                (int) $tournament->max_players,

            'status' =>
                $tournament->status,

            'format' =>
                $tournament->format,
        ], 201);
    }

    /**
     * Unregister current player.
     */
    public function destroy(
        Request $request,
        Tournament $tournament
    ) {
        $user = $request->user();

        // ============================================================
        // PLAYER PROFILE
        // ============================================================

        $player = $user->player;

        if (!$player) {
            return response()->json([
                'message' =>
                    'Profil joueur introuvable.'
            ], 404);
        }

        // ============================================================
        // TOURNAMENT STATUS
        // ============================================================

        if ($tournament->status !== 'registration') {
            return response()->json([
                'message' =>
                    'Vous ne pouvez plus quitter ce tournoi.'
            ], 422);
        }

        // ============================================================
        // CHECK ACTIVE REGISTRATION
        // ============================================================

        $registered = $tournament
            ->players()
            ->where('players.id', $player->id)
            ->wherePivot(
                'status',
                'registered'
            )
            ->exists();

        if (!$registered) {
            return response()->json([
                'message' =>
                    'Vous n\'êtes pas inscrit à ce tournoi.'
            ], 404);
        }

        // ============================================================
        // WITHDRAW PLAYER
        // ============================================================

        /*
         * We keep the pivot row and mark it as withdrawn
         * instead of deleting it completely.
         *
         * This preserves tournament history.
         */

        $tournament
            ->players()
            ->updateExistingPivot(
                $player->id,
                [
                    'status' => 'withdrawn',
                ]
            );

        return response()->json([
            'message' =>
                'Vous avez quitté le tournoi.'
        ]);
    }

    /**
     * List tournament players.
     */
    public function index(Tournament $tournament)
    {
        $players = $tournament
            ->players()
            ->wherePivot(
                'status',
                'registered'
            )
            ->orderByPivot(
                'joined_at',
                'asc'
            )
            ->get();

        return response()->json([
            'tournament_id' =>
                $tournament->id,

            'players_count' =>
                $players->count(),

            'max_players' =>
                (int) $tournament->max_players,

            'players' =>
                $players,
        ]);
    }
}

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
     * Register current player in a tournament
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
        // ALREADY REGISTERED
        // ============================================================

        $alreadyRegistered = $tournament
            ->players()
            ->where('players.id', $player->id)
            ->exists();

        if ($alreadyRegistered) {
            return response()->json([
                'message' =>
                    'Vous êtes déjà inscrit à ce tournoi.'
            ], 409);
        }

        // ============================================================
        // CAPACITY
        // ============================================================

        $playersCount = $tournament
            ->players()
            ->wherePivot('status', 'registered')
            ->count();

        if ($playersCount >= $tournament->max_players) {
            return response()->json([
                'message' =>
                    'Ce tournoi est complet.'
            ], 422);
        }

        // ============================================================
        // REGISTER PLAYER
        // ============================================================

        DB::transaction(function () use (
            $tournament,
            $player
        ) {
            $tournament->players()->attach(
                $player->id,
                [
                    'status' => 'registered',
                    'joined_at' => now(),
                ]
            );
        });

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
         * Même si l'organisateur s'inscrit à son propre tournoi,
         * on ne veut pas lui envoyer une notification à lui-même.
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
        // Then the bracket is generated automatically.
        //

        $tournament->refresh();

        $playersCount = $tournament
            ->players()
            ->wherePivot('status', 'registered')
            ->count();

        $shouldStart =
            $playersCount >= $tournament->max_players &&
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
                 * the scheduler can retry later.
                 */

                Log::warning(
                    'Tournament could not auto-start.',
                    [
                        'tournament_id' =>
                            $tournament->id,

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

            'status' =>
                $tournament->status,
        ], 201);
    }

    /**
     * Unregister current player
     */
    public function destroy(
        Request $request,
        Tournament $tournament
    ) {
        $user = $request->user();

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
        // CHECK REGISTRATION
        // ============================================================

        $registered = $tournament
            ->players()
            ->where('players.id', $player->id)
            ->exists();

        if (!$registered) {
            return response()->json([
                'message' =>
                    'Vous n\'êtes pas inscrit à ce tournoi.'
            ], 404);
        }

        // ============================================================
        // REMOVE PLAYER
        // ============================================================

        $tournament->players()
            ->detach($player->id);

        return response()->json([
            'message' =>
                'Vous avez quitté le tournoi.'
        ]);
    }

    /**
     * List tournament players
     */
    public function index(Tournament $tournament)
    {
        $players = $tournament
            ->players()
            ->orderByPivot('joined_at', 'asc')
            ->get();

        return response()->json([
            'tournament_id' =>
                $tournament->id,

            'players_count' =>
                $players->count(),

            'max_players' =>
                $tournament->max_players,

            'players' =>
                $players,
        ]);
    }
}

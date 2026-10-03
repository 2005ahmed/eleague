<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Result;
use App\Models\TournamentMatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use App\Services\NotificationService;

class MatchResultController extends Controller
{
    /**
     * Player submits a match result.
     */
    public function store(Request $request, TournamentMatch $match)
    {
        $user = $request->user();
        $player = $user->player;

        if (!$player) {
            return response()->json([
                'message' => 'Profil joueur introuvable.'
            ], 404);
        }

        // Only players participating in this match can submit the result
        if (!in_array($player->id, [
            $match->player1_id,
            $match->player2_id
        ])) {
            return response()->json([
                'message' => 'Vous ne participez pas à ce match.'
            ], 403);
        }

        if ($match->status !== 'scheduled') {
            return response()->json([
                'message' => 'Ce match ne peut plus recevoir de résultat.'
            ], 422);
        }

        // Prevent duplicate submissions
        if ($match->results()->where('verified', false)->exists()) {
            return response()->json([
                'message' => 'Un résultat est déjà en attente de vérification.'
            ], 409);
        }

        $data = $request->validate([
            'player1_score' => ['required', 'integer', 'min:0'],
            'player2_score' => ['required', 'integer', 'min:0'],
            'screenshot' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        if ($data['player1_score'] === $data['player2_score']) {
            return response()->json([
                'message' => 'Un match à élimination directe ne peut pas être nul.'
            ], 422);
        }

        /*
         * Upload screenshot to Cloudinary
         */
        $screenshotUrl = null;

        if ($request->hasFile('screenshot')) {

            $upload = Cloudinary::uploadApi()->upload(
                $request->file('screenshot')->getRealPath(),
                [
                    'folder' => 'eleague/results',
                    'resource_type' => 'image',
                ]
            );

            if (!$upload || !isset($upload['secure_url'])) {
                return response()->json([
                    'message' => 'Cloudinary upload failed.',
                    'cloudinary_response' => $upload,
                ], 500);
            }

            $screenshotUrl = $upload['secure_url'];
        }

        /*
         * Create result
         */
        $result = Result::create([
            'match_id' => $match->id,
            'submitted_by' => $user->id,
            'player1_score' => $data['player1_score'],
            'player2_score' => $data['player2_score'],
            'screenshot' => $screenshotUrl,
            'verified' => false,
        ]);

        /*
         * Notify tournament organizer
         */
        NotificationService::send(
            $match->tournament->organizer,
            'match',
            'Nouveau résultat soumis ⚔️',
            "{$player->nickname} a soumis un résultat pour le match #{$match->id}.",
            [
                'match_id' => $match->id,
                'tournament_id' => $match->tournament_id,
                'result_id' => $result->id,
            ]
        );

        return response()->json([
            'message' => 'Résultat envoyé. En attente de vérification.',
            'result' => $result,
        ], 201);
    }


    /**
     * Organizer/Admin verifies the result.
     */
    public function verify(Request $request, Result $result)
{
    $user = $request->user();

    $match = $result->match;

    if (!$match) {
        return response()->json([
            'message' => 'Match introuvable.'
        ], 404);
    }

    $tournament = $match->tournament;

    /*
     * Authorization
     */
    if ($user->role !== 'admin') {

        if (
            !$user->is_organizer &&
            $user->role !== 'organizer'
        ) {
            return response()->json([
                'message' => 'Organizer access required.'
            ], 403);
        }

        if ($tournament->organizer_id !== $user->id) {
            return response()->json([
                'message' =>
                    'Vous n\'êtes pas autorisé à vérifier ce résultat.'
            ], 403);
        }
    }

    /*
     * Already verified
     */
    if ($result->verified) {
        return response()->json([
            'message' => 'Ce résultat est déjà vérifié.'
        ], 409);
    }

    /*
     * Match must be scheduled
     */
    if ($match->status !== 'scheduled') {
        return response()->json([
            'message' => 'Ce match est déjà terminé.'
        ], 422);
    }

    /*
     * Draw is not allowed
     */
    if ($result->player1_score === $result->player2_score) {
        return response()->json([
            'message' =>
                'Un match à élimination directe ne peut pas être nul.'
        ], 422);
    }

    return DB::transaction(function () use (
        $result,
        $match,
        $tournament,
        $user
    ) {

        /*
         * Determine winner
         */
        $winnerId =
            $result->player1_score > $result->player2_score
                ? $match->player1_id
                : $match->player2_id;

        /*
         * Verify result
         */
        $result->update([
            'verified' => true,
            'verified_by' => $user->id,
        ]);

        /*
         * Complete current match
         */
        $match->update([
            'player1_score' => $result->player1_score,
            'player2_score' => $result->player2_score,
            'winner_id' => $winnerId,
            'status' => 'completed',
        ]);

        /*
         * Load players
         */
        $match->load([
            'player1.user',
            'player2.user',
        ]);

        $winner =
            $winnerId == $match->player1_id
                ? $match->player1
                : $match->player2;

        $loser =
            $winnerId == $match->player1_id
                ? $match->player2
                : $match->player1;

        /*
         * Notify winner
         */
        if ($winner && $winner->user) {

            NotificationService::send(
                $winner->user,
                'match',
                'Victoire confirmée 🏆',
                "Félicitations ! Tu as remporté le match #{$match->id}.",
                [
                    'match_id' => $match->id,
                    'tournament_id' => $match->tournament_id,
                    'result_id' => $result->id,
                    'winner_id' => $winner->id,
                ]
            );
        }

        /*
         * Notify loser
         */
        if ($loser && $loser->user) {

            NotificationService::send(
                $loser->user,
                'match',
                'Résultat du match',
                "Le résultat du match #{$match->id} a été vérifié. Tu as perdu ce match.",
                [
                    'match_id' => $match->id,
                    'tournament_id' => $match->tournament_id,
                    'result_id' => $result->id,
                    'winner_id' => $winner->id,
                ]
            );
        }

        /*
         * ======================================================
         * CURRENT ROUND
         * ======================================================
         */

        $roundMatches = $tournament->matches()
            ->where('round', $match->round)
            ->orderBy('id')
            ->get();

        /*
         * ======================================================
         * FINAL
         * ======================================================
         *
         * If there is only one match in this round,
         * this match is the final.
         */

        if ($roundMatches->count() === 1) {

            $tournament->update([
                'status' => 'completed',
            ]);

            $champion = $winner;

            /*
             * Notify champion
             */
            if ($champion && $champion->user) {

                NotificationService::send(
                    $champion->user,
                    'tournament',
                    'Champion 🏆',
                    "Félicitations ! Tu es le champion de {$tournament->name} 🏆",
                    [
                        'tournament_id' => $tournament->id,
                        'match_id' => $match->id,
                        'champion_id' => $champion->id,
                    ]
                );
            }

            /*
             * Notify organizer
             */
            if ($tournament->organizer && $champion) {

                NotificationService::send(
                    $tournament->organizer,
                    'tournament',
                    'Tournoi terminé 🏆',
                    "Le tournoi {$tournament->name} est terminé. Le champion est {$champion->nickname}.",
                    [
                        'tournament_id' => $tournament->id,
                        'match_id' => $match->id,
                        'champion_id' => $champion->id,
                    ]
                );
            }

            return response()->json([
                'message' =>
                    'Match vérifié. Le tournoi est terminé !',

                'winner_id' => $winnerId,

                'champion' => $champion,

                'tournament_completed' => true,

                'next_round_created' => false,
            ]);
        }

        /*
         * ======================================================
         * CHECK IF CURRENT ROUND IS FINISHED
         * ======================================================
         */

        $allRoundMatchesCompleted =
            $roundMatches->every(
                fn ($roundMatch) =>
                    $roundMatch->status === 'completed'
            );

        /*
         * Current round still has matches to finish.
         */
        if (!$allRoundMatchesCompleted) {

            return response()->json([
                'message' =>
                    'Résultat vérifié avec succès. En attente des autres matchs.',

                'winner_id' => $winnerId,

                'next_round_created' => false,

                'tournament_completed' => false,
            ]);
        }

        /*
         * ======================================================
         * CURRENT ROUND COMPLETED
         * ======================================================
         *
         * At this point every match of the current round
         * has a winner.
         */

        $nextRound = $match->round + 1;

        /*
         * Winners of current round
         */
        $winners = $roundMatches
            ->map(fn ($roundMatch) => $roundMatch->winner_id)
            ->filter()
            ->values();

        /*
         * Number of winners must be even
         */
        if ($winners->count() < 2) {

            return response()->json([
                'message' =>
                    'Impossible de créer le prochain tour : nombre de gagnants invalide.',
            ], 422);
        }

        /*
         * ======================================================
         * PROTECT AGAINST DUPLICATE GENERATION
         * ======================================================
         */

        $nextRoundExists = $tournament->matches()
            ->where('round', $nextRound)
            ->exists();

        if ($nextRoundExists) {

            return response()->json([
                'message' =>
                    'Le prochain tour existe déjà.',
                'winner_id' => $winnerId,
                'next_round' => $nextRound,
                'next_round_created' => false,
                'tournament_completed' => false,
            ]);
        }

        /*
         * ======================================================
         * CREATE NEXT ROUND
         * ======================================================
         */

        $createdMatches = 0;

        for (
            $i = 0;
            $i < $winners->count();
            $i += 2
        ) {

            $player1Id = $winners[$i];
            $player2Id = $winners[$i + 1];

            TournamentMatch::create([
                'tournament_id' => $tournament->id,
                'round' => $nextRound,

                'player1_id' => $player1Id,
                'player2_id' => $player2Id,

                'player1_score' => 0,
                'player2_score' => 0,

                'winner_id' => null,

                'scheduled_at' => null,

                'status' => 'scheduled',
            ]);

            $createdMatches++;
        }

        /*
         * ======================================================
         * NOTIFY NEXT ROUND PLAYERS
         * ======================================================
         */

        $nextRoundMatches = $tournament->matches()
            ->where('round', $nextRound)
            ->with([
                'player1.user',
                'player2.user',
            ])
            ->get();

        foreach ($nextRoundMatches as $nextMatch) {

            foreach ([
                $nextMatch->player1,
                $nextMatch->player2,
            ] as $nextPlayer) {

                if ($nextPlayer && $nextPlayer->user) {

                    NotificationService::send(
                        $nextPlayer->user,
                        'match',
                        'Nouveau match ⚔️',
                        "Ton prochain match dans {$tournament->name} est maintenant disponible.",
                        [
                            'match_id' => $nextMatch->id,
                            'tournament_id' => $tournament->id,
                            'round' => $nextRound,
                        ]
                    );
                }
            }
        }

        /*
         * ======================================================
         * RESPONSE
         * ======================================================
         */

        return response()->json([
            'message' =>
                "Résultat vérifié. Le Round {$nextRound} a été créé.",

            'winner_id' => $winnerId,

            'next_round' => $nextRound,

            'matches_created' => $createdMatches,

            'next_round_created' => true,

            'tournament_completed' => false,
        ]);
    });
}


    /**
     * Get pending results for organizer/admin.
     *
     * Admin:
     *      Can see all pending results.
     *
     * Organizer:
     *      Can see only results from his tournaments.
     *
     * Supports:
     *      role = organizer
     *      role = admin
     *      is_organizer = true
     */
    public function pendingResults(Request $request)
    {
        $user = $request->user();

        /*
         * Organizer authorization
         */
        if (
            $user->role !== 'admin' &&
            !$user->is_organizer &&
            $user->role !== 'organizer'
        ) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 403);
        }

        /*
         * Base query
         */
        $query = Result::with([
            'match.tournament.game',
            'match.player1',
            'match.player2',
            'submittedBy',
        ])
            ->where('verified', false);

        /*
         * Admin sees all results.
         *
         * Organizer sees only results
         * from his own tournaments.
         */
        if ($user->role !== 'admin') {

            $query->whereHas(
                'match.tournament',
                function ($q) use ($user) {
                    $q->where('organizer_id', $user->id);
                }
            );
        }

        $results = $query
            ->latest()
            ->get();

        return response()->json([
            'results' => $results,
            'count' => $results->count(),
        ]);
    }


    /**
     * Reject pending result.
     */
    public function reject(Request $request, Result $result)
    {
        $user = $request->user();

        /*
         * Organizer authorization
         */
        if (
            $user->role !== 'admin' &&
            !$user->is_organizer &&
            $user->role !== 'organizer'
        ) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 403);
        }

        $match = $result->match;

        if (!$match) {
            return response()->json([
                'message' => 'Match not found.'
            ], 404);
        }

        /*
         * Admin can reject any result.
         *
         * Organizer can reject only results
         * from his own tournament.
         */
        if (
            $user->role !== 'admin' &&
            $match->tournament->organizer_id !== $user->id
        ) {
            return response()->json([
                'message' => 'You are not the organizer of this tournament.'
            ], 403);
        }

        if ($result->verified) {
            return response()->json([
                'message' => 'This result has already been verified.'
            ], 422);
        }

        /*
         * Delete pending result
         */
        $result->delete();

        /*
         * Reset match
         */
        $match->status = 'scheduled';
        $match->winner_id = null;
        $match->player1_score = 0;
        $match->player2_score = 0;
        $match->save();

        return response()->json([
            'message' => 'Result rejected successfully.',
        ]);
    }
}

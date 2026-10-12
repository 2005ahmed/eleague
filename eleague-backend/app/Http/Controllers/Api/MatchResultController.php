<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Result;
use App\Models\TournamentMatch;
use App\Services\DoubleEliminationService;
use App\Services\NotificationService;
use App\Services\TournamentStandingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

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

        $match->load('tournament');

        $tournament = $match->tournament;

        $isRoundRobin = $tournament->isRoundRobin();
        $isGroupKnockout = $tournament->isGroupKnockout();
        $isGroupMatch = $isGroupKnockout && !empty($match->group);
        $isDoubleElimination = $tournament->isDoubleElimination();

        /*
        |----------------------------------------------------------------------
        | Knockout-like matches
        |
        | Round Robin + Group Stage allow draws.
        | Normal Knockout + Double Elimination do not.
        |----------------------------------------------------------------------
        */

        $isKnockoutMatch =
            !$isRoundRobin &&
            !$isGroupMatch;

        /*
        |----------------------------------------------------------------------
        | Player must participate
        |----------------------------------------------------------------------
        */

        if (!in_array($player->id, [
            $match->player1_id,
            $match->player2_id
        ])) {
            return response()->json([
                'message' => 'Vous ne participez pas à ce match.'
            ], 403);
        }

        /*
        |----------------------------------------------------------------------
        | Match must be playable
        |----------------------------------------------------------------------
        */

        if (!$match->player1_id || !$match->player2_id) {
            return response()->json([
                'message' => 'Ce match n\'est pas encore prêt.'
            ], 422);
        }

        if ($match->status !== 'scheduled') {
            return response()->json([
                'message' => 'Ce match ne peut plus recevoir de résultat.'
            ], 422);
        }

        /*
        |----------------------------------------------------------------------
        | Prevent duplicate pending submissions
        |----------------------------------------------------------------------
        */

        if ($match->results()->where('verified', false)->exists()) {
            return response()->json([
                'message' =>
                    'Un résultat est déjà en attente de vérification.'
            ], 409);
        }

        /*
        |----------------------------------------------------------------------
        | Validation
        |----------------------------------------------------------------------
        */

        $data = $request->validate([
            'player1_score' => [
                'required',
                'integer',
                'min:0',
            ],

            'player2_score' => [
                'required',
                'integer',
                'min:0',
            ],

            'screenshot' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        /*
        |----------------------------------------------------------------------
        | Knockout draws are not allowed
        |
        | Round Robin + Group Stage allow draws.
        | Double Elimination does NOT allow draws.
        |----------------------------------------------------------------------
        */

        if (
            $isKnockoutMatch &&
            (int) $data['player1_score'] ===
            (int) $data['player2_score']
        ) {
            return response()->json([
                'message' =>
                    'Un match à élimination directe ne peut pas être nul.'
            ], 422);
        }

        /*
        |----------------------------------------------------------------------
        | Upload screenshot
        |----------------------------------------------------------------------
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

            if (
                !$upload ||
                !isset($upload['secure_url'])
            ) {
                return response()->json([
                    'message' => 'Cloudinary upload failed.',
                    'cloudinary_response' => $upload,
                ], 500);
            }

            $screenshotUrl = $upload['secure_url'];
        }

        /*
        |----------------------------------------------------------------------
        | Create result
        |----------------------------------------------------------------------
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
        |----------------------------------------------------------------------
        | Notify organizer
        |----------------------------------------------------------------------
        */

        NotificationService::send(
            $tournament->organizer,
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
            'message' =>
                'Résultat envoyé. En attente de vérification.',

            'result' => $result,
        ], 201);
    }


    /**
     * Organizer/Admin verifies the result.
     */
    public function verify(
        Request $request,
        Result $result
    ) {
        $user = $request->user();

        $match = $result->match;

        if (!$match) {
            return response()->json([
                'message' => 'Match introuvable.'
            ], 404);
        }

        $match->load('tournament');

        $tournament = $match->tournament;

        $isRoundRobin = $tournament->isRoundRobin();
        $isGroupKnockout = $tournament->isGroupKnockout();
        $isGroupMatch = $isGroupKnockout && !empty($match->group);
        $isDoubleElimination = $tournament->isDoubleElimination();

        $isKnockoutMatch =
            !$isRoundRobin &&
            !$isGroupMatch;

        /*
        |----------------------------------------------------------------------
        | Authorization
        |----------------------------------------------------------------------
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
        |----------------------------------------------------------------------
        | Already verified
        |----------------------------------------------------------------------
        */

        if ($result->verified) {
            return response()->json([
                'message' =>
                    'Ce résultat est déjà vérifié.'
            ], 409);
        }

        /*
        |----------------------------------------------------------------------
        | Match must be scheduled
        |----------------------------------------------------------------------
        */

        if ($match->status !== 'scheduled') {
            return response()->json([
                'message' =>
                    'Ce match est déjà terminé.'
            ], 422);
        }

        /*
        |----------------------------------------------------------------------
        | Both players must exist
        |----------------------------------------------------------------------
        */

        if (
            !$match->player1_id ||
            !$match->player2_id
        ) {
            return response()->json([
                'message' =>
                    'Ce match ne contient pas encore deux joueurs.'
            ], 422);
        }

        /*
        |----------------------------------------------------------------------
        | Knockout draw is not allowed
        |----------------------------------------------------------------------
        */

        if (
            $isKnockoutMatch &&
            (int) $result->player1_score ===
            (int) $result->player2_score
        ) {
            return response()->json([
                'message' =>
                    'Un match à élimination directe ne peut pas être nul.'
            ], 422);
        }

        return DB::transaction(
            function () use (
                $result,
                $match,
                $tournament,
                $user,
                $isRoundRobin,
                $isGroupKnockout,
                $isGroupMatch,
                $isDoubleElimination,
                $isKnockoutMatch
            ) {

                /*
                |------------------------------------------------------------------
                | Determine winner
                |------------------------------------------------------------------
                */

                $winnerId = null;

                if (
                    $result->player1_score >
                    $result->player2_score
                ) {
                    $winnerId = $match->player1_id;
                } elseif (
                    $result->player2_score >
                    $result->player1_score
                ) {
                    $winnerId = $match->player2_id;
                }

                /*
                |------------------------------------------------------------------
                | Verify result
                |------------------------------------------------------------------
                */

                $result->update([
                    'verified' => true,
                    'verified_by' => $user->id,
                ]);

                /*
                |------------------------------------------------------------------
                | Complete match
                |------------------------------------------------------------------
                */

                $match->update([
                    'player1_score' => $result->player1_score,
                    'player2_score' => $result->player2_score,
                    'winner_id' => $winnerId,
                    'status' => 'completed',
                ]);

                /*
                |------------------------------------------------------------------
                | DOUBLE ELIMINATION
                |
                | This must be handled before normal Knockout logic.
                | Winners go forward.
                | Losers go to Losers Bracket.
                | Losers Bracket winners continue.
                | Grand Final controls tournament completion.
                |------------------------------------------------------------------
                */

                if ($isDoubleElimination) {

                    $doubleEliminationService =
                        app(DoubleEliminationService::class);

                    $doubleEliminationResult =
                        $doubleEliminationService->completeMatch(
                            $match->fresh()
                        );

                    return response()->json([
                        'message' =>
                            $this->doubleEliminationMessage(
                                $doubleEliminationResult
                            ),

                        'winner_id' =>
                            $winnerId,

                        'double_elimination' =>
                            $doubleEliminationResult,

                        'tournament_completed' =>
                            $tournament->fresh()->status ===
                            'completed',

                        'winner_advanced' =>
                            true,
                    ]);
                }

                /*
                |------------------------------------------------------------------
                | ROUND ROBIN
                |------------------------------------------------------------------
                */

                if ($isRoundRobin) {
                    return $this->handleRoundRobinCompletion(
                        $tournament,
                        $match,
                        $result,
                        $winnerId
                    );
                }

                /*
                |------------------------------------------------------------------
                | GROUP STAGE
                |
                | Group matches are completed independently.
                | Winners do NOT advance to the next group round.
                |------------------------------------------------------------------
                */

                if ($isGroupMatch) {
                    return $this->handleGroupMatchCompletion(
                        $tournament,
                        $match,
                        $result,
                        $winnerId
                    );
                }

                /*
                |------------------------------------------------------------------
                | KNOCKOUT
                |------------------------------------------------------------------
                */

                if ($isKnockoutMatch) {
                    return $this->handleKnockoutCompletion(
                        $tournament,
                        $match,
                        $result,
                        $winnerId
                    );
                }

                return response()->json([
                    'message' => 'Résultat vérifié.',
                    'winner_id' => $winnerId,
                    'tournament_completed' => false,
                    'winner_advanced' => false,
                ]);
            }
        );
    }


    /**
     * Create a readable response message for Double Elimination.
     */
    private function doubleEliminationMessage(
        array $result
    ): string {
        return match ($result['type'] ?? null) {

            'winners' =>
                'Résultat vérifié. Le gagnant continue dans le Winners Bracket et le perdant rejoint le Losers Bracket.',

            'winners_final' =>
                'Résultat vérifié. Le gagnant du Winners Bracket accède à la Grand Final.',

            'losers' =>
                'Résultat vérifié. Le gagnant continue dans le Losers Bracket.',

            'losers_final' =>
                'Résultat vérifié. Le gagnant du Losers Bracket accède à la Grand Final.',

            'grand_final' =>
                'Résultat vérifié. La Grand Final est terminée.',

            'grand_final_reset' =>
                'Le champion du Winners Bracket a perdu la Grand Final. Un Reset Final est maintenant nécessaire.',

            'champion' =>
                'Félicitations ! Le tournoi est terminé et le champion est confirmé 🏆',

            default =>
                'Résultat vérifié.',
        };
    }


    /**
     * Handle Round Robin completion.
     */
    private function handleRoundRobinCompletion(
        $tournament,
        TournamentMatch $match,
        Result $result,
        ?int $winnerId
    ) {
        $totalMatches = $tournament->matches()->count();

        $completedMatches = $tournament->matches()
            ->where('status', 'completed')
            ->count();

        $tournamentCompleted =
            $totalMatches > 0 &&
            $completedMatches === $totalMatches;

        if (!$tournamentCompleted) {

            $isDraw =
                (int) $result->player1_score ===
                (int) $result->player2_score;

            return response()->json([
                'message' => $isDraw
                    ? 'Résultat vérifié. Match nul enregistré. Chaque joueur reçoit 1 point.'
                    : 'Résultat vérifié. Le gagnant reçoit 3 points.',

                'winner_id' => $winnerId,

                'draw' => $isDraw,

                'tournament_completed' => false,

                'next_round_created' => false,

                'winner_advanced' => false,
            ]);
        }

        $standingsService = app(
            TournamentStandingsService::class
        );

        $standings = $standingsService->calculate(
            $tournament->fresh()
        );

        $championStanding = $standings[0] ?? null;

        $champion = null;

        if ($championStanding) {
            $champion = $tournament->players()
                ->where(
                    'players.id',
                    $championStanding['player_id']
                )
                ->first();
        }

        $tournament->update([
            'status' => 'completed',
        ]);

        if ($champion) {
            $champion->load('user');
        }

        if (
            $champion &&
            $champion->user
        ) {
            NotificationService::send(
                $champion->user,
                'tournament',
                'Champion 🏆',
                "Félicitations ! Tu es le champion de {$tournament->name} 🏆",
                [
                    'tournament_id' =>
                        $tournament->id,

                    'champion_id' =>
                        $champion->id,

                    'points' =>
                        $championStanding['points'],

                    'goal_difference' =>
                        $championStanding['goal_difference'],
                ]
            );
        }

        $tournament->load('organizer');

        if (
            $tournament->organizer &&
            $champion
        ) {
            NotificationService::send(
                $tournament->organizer,
                'tournament',
                'Tournoi terminé 🏆',
                "Le tournoi {$tournament->name} est terminé. Le champion est {$champion->nickname}.",
                [
                    'tournament_id' =>
                        $tournament->id,

                    'champion_id' =>
                        $champion->id,
                ]
            );
        }

        return response()->json([
            'message' =>
                'Résultat vérifié. Tous les matchs sont terminés. Le tournoi est terminé !',

            'winner_id' =>
                $winnerId,

            'champion' =>
                $champion,

            'standings' =>
                $standings,

            'tournament_completed' =>
                true,

            'next_round_created' =>
                false,

            'winner_advanced' =>
                false,
        ]);
    }


    /**
     * Handle a Group Stage match.
     *
     * A group match can end in a draw.
     * There is no winner advancement here.
     */
    private function handleGroupMatchCompletion(
        $tournament,
        TournamentMatch $match,
        Result $result,
        ?int $winnerId
    ) {
        $isDraw =
            (int) $result->player1_score ===
            (int) $result->player2_score;

        $remainingGroupMatches = $tournament->matches()
            ->whereNotNull('group')
            ->where('status', '!=', 'completed')
            ->count();

        $groupStageCompleted =
            $remainingGroupMatches === 0;

        if (!$groupStageCompleted) {
            return response()->json([
                'message' => $isDraw
                    ? 'Résultat vérifié. Match nul enregistré. 1 point pour chaque joueur.'
                    : 'Résultat vérifié. Le gagnant est enregistré pour le classement du groupe.',

                'winner_id' =>
                    $winnerId,

                'draw' =>
                    $isDraw,

                'group' =>
                    $match->group,

                'group_stage_completed' =>
                    false,

                'tournament_completed' =>
                    false,

                'winner_advanced' =>
                    false,

                'next_round_created' =>
                    false,
            ]);
        }

        return response()->json([
            'message' =>
                'Résultat vérifié. Tous les matchs de la phase de groupes sont terminés. La qualification vers le Knockout est maintenant disponible.',

            'winner_id' =>
                $winnerId,

            'draw' =>
                $isDraw,

            'group_stage_completed' =>
                true,

            'qualification_required' =>
                true,

            'tournament_completed' =>
                false,

            'winner_advanced' =>
                false,

            'next_round_created' =>
                false,
        ]);
    }


    /**
     * Handle Knockout completion.
     *
     * IMPORTANT:
     * Only matches with group = NULL belong to the knockout bracket.
     */
    private function handleKnockoutCompletion(
        $tournament,
        TournamentMatch $match,
        Result $result,
        ?int $winnerId
    ) {
        if (!$winnerId) {
            return response()->json([
                'message' =>
                    'Impossible de déterminer le gagnant du match à élimination directe.',
            ], 422);
        }

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
        |----------------------------------------------------------------------
        | Notify winner
        |----------------------------------------------------------------------
        */

        if ($winner && $winner->user) {
            NotificationService::send(
                $winner->user,
                'match',
                'Victoire confirmée 🏆',
                "Félicitations ! Tu as remporté le match #{$match->id}.",
                [
                    'match_id' =>
                        $match->id,

                    'tournament_id' =>
                        $match->tournament_id,

                    'result_id' =>
                        $result->id,

                    'winner_id' =>
                        $winner->id,
                ]
            );
        }

        /*
        |----------------------------------------------------------------------
        | Notify loser
        |----------------------------------------------------------------------
        */

        if ($loser && $loser->user) {
            NotificationService::send(
                $loser->user,
                'match',
                'Résultat du match',
                "Le résultat du match #{$match->id} a été vérifié. Tu as perdu ce match.",
                [
                    'match_id' =>
                        $match->id,

                    'tournament_id' =>
                        $match->tournament_id,

                    'result_id' =>
                        $result->id,

                    'winner_id' =>
                        $winner->id,
                ]
            );
        }

        $roundMatches = $tournament->matches()
            ->whereNull('group')
            ->where('round', $match->round)
            ->orderBy('id')
            ->get();

        if ($roundMatches->isEmpty()) {
            return response()->json([
                'message' =>
                    'Impossible de trouver les matchs du round Knockout.',
            ], 500);
        }

        if ($roundMatches->count() === 1) {

            $tournament->update([
                'status' => 'completed',
            ]);

            $champion = $winner;

            if (
                $champion &&
                $champion->user
            ) {
                NotificationService::send(
                    $champion->user,
                    'tournament',
                    'Champion 🏆',
                    "Félicitations ! Tu es le champion de {$tournament->name} 🏆",
                    [
                        'tournament_id' =>
                            $tournament->id,

                        'match_id' =>
                            $match->id,

                        'champion_id' =>
                            $champion->id,
                    ]
                );
            }

            $tournament->load('organizer');

            if (
                $tournament->organizer &&
                $champion
            ) {
                NotificationService::send(
                    $tournament->organizer,
                    'tournament',
                    'Tournoi terminé 🏆',
                    "Le tournoi {$tournament->name} est terminé. Le champion est {$champion->nickname}.",
                    [
                        'tournament_id' =>
                            $tournament->id,

                        'match_id' =>
                            $match->id,

                        'champion_id' =>
                            $champion->id,
                    ]
                );
            }

            return response()->json([
                'message' =>
                    'Match vérifié. Le tournoi est terminé !',

                'winner_id' =>
                    $winnerId,

                'champion' =>
                    $champion,

                'tournament_completed' =>
                    true,

                'next_round_created' =>
                    false,

                'winner_advanced' =>
                    false,
            ]);
        }

        $nextRound = $match->round + 1;

        $nextRoundMatches = $tournament->matches()
            ->whereNull('group')
            ->where('round', $nextRound)
            ->orderBy('id')
            ->get();

        if ($nextRoundMatches->isEmpty()) {
            return response()->json([
                'message' =>
                    'Le match est terminé, mais le prochain match Knockout est introuvable.',

                'winner_id' =>
                    $winnerId,

                'next_round_created' =>
                    false,

                'tournament_completed' =>
                    false,

                'winner_advanced' =>
                    false,
            ], 500);
        }

        $currentRoundIndex = $roundMatches->search(
            fn ($roundMatch) =>
                $roundMatch->id === $match->id
        );

        if ($currentRoundIndex === false) {
            return response()->json([
                'message' =>
                    'Impossible de déterminer la position du match dans le round Knockout.',
            ], 500);
        }

        $nextMatchIndex = intdiv(
            $currentRoundIndex,
            2
        );

        $nextMatch =
            $nextRoundMatches[$nextMatchIndex]
            ?? null;

        if (!$nextMatch) {
            return response()->json([
                'message' =>
                    'Le prochain match du bracket Knockout est introuvable.',
            ], 500);
        }

        if ($currentRoundIndex % 2 === 0) {
            $nextMatch->update([
                'player1_id' => $winnerId,
            ]);
        } else {
            $nextMatch->update([
                'player2_id' => $winnerId,
            ]);
        }

        $nextMatch->refresh();

        $nextMatchReady = (bool) (
            $nextMatch->player1_id &&
            $nextMatch->player2_id
        );

        if ($nextMatchReady) {

            $nextMatch->load([
                'player1.user',
                'player2.user',
            ]);

            foreach ([
                $nextMatch->player1,
                $nextMatch->player2,
            ] as $nextPlayer) {

                if (
                    $nextPlayer &&
                    $nextPlayer->user
                ) {
                    NotificationService::send(
                        $nextPlayer->user,
                        'match',
                        'Nouveau match ⚔️',
                        "Ton prochain match dans {$tournament->name} est maintenant disponible.",
                        [
                            'match_id' =>
                                $nextMatch->id,

                            'tournament_id' =>
                                $tournament->id,

                            'round' =>
                                $nextRound,
                        ]
                    );
                }
            }
        }

        return response()->json([
            'message' =>
                $nextMatchReady
                    ? "Résultat vérifié. Le Round {$nextRound} est maintenant prêt."
                    : "Résultat vérifié. En attente de l'autre match du Round {$nextRound}.",

            'winner_id' =>
                $winnerId,

            'next_round' =>
                $nextRound,

            'next_match_id' =>
                $nextMatch->id,

            'next_match_ready' =>
                $nextMatchReady,

            'next_round_created' =>
                false,

            'tournament_completed' =>
                false,

            'winner_advanced' =>
                true,
        ]);
    }


    /**
     * Get pending results for organizer/admin.
     */
    public function pendingResults(Request $request)
    {
        $user = $request->user();

        if (
            $user->role !== 'admin' &&
            !$user->is_organizer &&
            $user->role !== 'organizer'
        ) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 403);
        }

        $query = Result::with([
            'match.tournament.game',
            'match.player1',
            'match.player2',
            'submittedBy',
        ])
            ->where('verified', false);

        if ($user->role !== 'admin') {
            $query->whereHas(
                'match.tournament',
                function ($q) use ($user) {
                    $q->where(
                        'organizer_id',
                        $user->id
                    );
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
    public function reject(
        Request $request,
        Result $result
    ) {
        $user = $request->user();

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

        if (
            $user->role !== 'admin' &&
            $match->tournament->organizer_id !== $user->id
        ) {
            return response()->json([
                'message' =>
                    'You are not the organizer of this tournament.'
            ], 403);
        }

        if ($result->verified) {
            return response()->json([
                'message' =>
                    'This result has already been verified.'
            ], 422);
        }

        $result->delete();

        $match->status = 'scheduled';
        $match->winner_id = null;
        $match->player1_score = 0;
        $match->player2_score = 0;
        $match->save();

        return response()->json([
            'message' =>
                'Result rejected successfully.',
        ]);
    }
}

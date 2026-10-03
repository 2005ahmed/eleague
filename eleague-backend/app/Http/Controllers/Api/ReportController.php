<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\TournamentMatch;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Player submits a report/dispute for a match.
     */
    public function store(Request $request, TournamentMatch $match)
    {
        $user = $request->user();
        $player = $user->player;

        if (!$player) {
            return response()->json([
                'message' => 'Profil joueur introuvable.',
            ], 404);
        }

        // Only players participating in the match can report it
        if (!in_array($player->id, [
            $match->player1_id,
            $match->player2_id,
        ])) {
            return response()->json([
                'message' => 'Vous ne participez pas à ce match.',
            ], 403);
        }

        $data = $request->validate([
            'reason' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'evidence' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        // Prevent multiple pending reports from the same player
        $existingReport = Report::where('match_id', $match->id)
            ->where('reported_by', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($existingReport) {
            return response()->json([
                'message' => 'Vous avez déjà un signalement en attente pour ce match.',
            ], 409);
        }

        // Determine the opponent
        $againstPlayerId = $match->player1_id === $player->id
            ? $match->player2_id
            : $match->player1_id;

        $report = Report::create([
            'match_id' => $match->id,
            'reported_by' => $user->id,
            'against_player' => $againstPlayerId,
            'reason' => $data['reason'],
            'description' => $data['description'] ?? null,
            'evidence' => $data['evidence'] ?? null,
            'status' => 'pending',
        ]);

        /*
         * Notify tournament organizer
         */
        NotificationService::send(
            $match->tournament->organizer,
            'report',
            'Nouveau signalement ⚠️',
            "{$player->nickname} a signalé un problème concernant le match #{$match->id}.",
            [
                'report_id' => $report->id,
                'match_id' => $match->id,
                'tournament_id' => $match->tournament_id,
            ]
        );

        $report->load([
            'match.player1',
            'match.player2',
            'reportedBy',
            'againstPlayer',
        ]);

        return response()->json([
            'message' => 'Signalement envoyé avec succès.',
            'report' => $report,
        ], 201);
    }


    /**
     * Organizer/Admin gets reports.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        /*
         * Admin OR Organizer
         */
        if (
            $user->role !== 'admin' &&
            !$user->is_organizer &&
            $user->role !== 'organizer'
        ) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 403);
        }

        $query = Report::with([
            'match.tournament',
            'match.player1',
            'match.player2',
            'reportedBy',
            'againstPlayer',
            'resolvedBy',
        ]);

        /*
         * Organizer only sees reports
         * from their own tournaments.
         *
         * Admin sees everything.
         */
        if ($user->role !== 'admin') {
            $query->whereHas(
                'match.tournament',
                function ($q) use ($user) {
                    $q->where('organizer_id', $user->id);
                }
            );
        }

        $reports = $query
            ->latest()
            ->get();

        return response()->json([
            'reports' => $reports,
            'count' => $reports->count(),
        ]);
    }


    /**
     * Organizer/Admin resolves a report.
     */
    public function resolve(Request $request, Report $report)
    {
        $user = $request->user();

        /*
         * Admin OR Organizer
         */
        if (
            $user->role !== 'admin' &&
            !$user->is_organizer &&
            $user->role !== 'organizer'
        ) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 403);
        }

        $match = $report->match;

        if (!$match) {
            return response()->json([
                'message' => 'Match introuvable.',
            ], 404);
        }

        /*
         * Organizer can only manage reports
         * from their own tournaments.
         */
        if (
            $user->role !== 'admin' &&
            $match->tournament->organizer_id !== $user->id
        ) {
            return response()->json([
                'message' => 'Vous n\'êtes pas l\'organisateur de ce tournoi.',
            ], 403);
        }

        if ($report->status !== 'pending') {
            return response()->json([
                'message' => 'Ce signalement a déjà été traité.',
            ], 422);
        }

        $data = $request->validate([
            'resolution' => [
                'required',
                'string',
                'max:2000',
            ],
        ]);

        $report->update([
            'status' => 'resolved',
            'resolved_by' => $user->id,
            'resolution' => $data['resolution'],
        ]);

        /*
         * Notify the player who submitted the report
         */
        NotificationService::send(
            $report->reportedBy,
            'report',
            'Signalement résolu ✅',
            "Votre signalement concernant le match #{$match->id} a été résolu.",
            [
                'report_id' => $report->id,
                'match_id' => $match->id,
                'tournament_id' => $match->tournament_id,
                'status' => 'resolved',
            ]
        );

        $report->load([
            'match.player1',
            'match.player2',
            'reportedBy',
            'againstPlayer',
            'resolvedBy',
        ]);

        return response()->json([
            'message' => 'Signalement résolu avec succès.',
            'report' => $report,
        ]);
    }


    /**
     * Organizer/Admin rejects a report.
     */
    public function reject(Request $request, Report $report)
    {
        $user = $request->user();

        /*
         * Admin OR Organizer
         */
        if (
            $user->role !== 'admin' &&
            !$user->is_organizer &&
            $user->role !== 'organizer'
        ) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 403);
        }

        $match = $report->match;

        if (!$match) {
            return response()->json([
                'message' => 'Match introuvable.',
            ], 404);
        }

        /*
         * Organizer can only manage reports
         * from their own tournaments.
         */
        if (
            $user->role !== 'admin' &&
            $match->tournament->organizer_id !== $user->id
        ) {
            return response()->json([
                'message' => 'Vous n\'êtes pas l\'organisateur de ce tournoi.',
            ], 403);
        }

        if ($report->status !== 'pending') {
            return response()->json([
                'message' => 'Ce signalement a déjà été traité.',
            ], 422);
        }

        $data = $request->validate([
            'resolution' => [
                'required',
                'string',
                'max:2000',
            ],
        ]);

        $report->update([
            'status' => 'rejected',
            'resolved_by' => $user->id,
            'resolution' => $data['resolution'],
        ]);

        /*
         * Notify the player
         */
        NotificationService::send(
            $report->reportedBy,
            'report',
            'Signalement rejeté ❌',
            "Votre signalement concernant le match #{$match->id} a été rejeté.",
            [
                'report_id' => $report->id,
                'match_id' => $match->id,
                'tournament_id' => $match->tournament_id,
                'status' => 'rejected',
            ]
        );

        $report->load([
            'match.player1',
            'match.player2',
            'reportedBy',
            'againstPlayer',
            'resolvedBy',
        ]);

        return response()->json([
            'message' => 'Signalement rejeté.',
            'report' => $report,
        ]);
    }


    /**
     * Correct match score through a report.
     */
    public function correctScore(Request $request, Report $report)
    {
        $user = $request->user();

        /*
         * Admin OR Organizer
         */
        if (
            $user->role !== 'admin' &&
            !$user->is_organizer &&
            $user->role !== 'organizer'
        ) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 403);
        }

        $match = $report->match;

        if (!$match) {
            return response()->json([
                'message' => 'Match introuvable.',
            ], 404);
        }

        $tournament = $match->tournament;

        /*
         * Tournament already completed
         */
        if ($tournament->status === 'completed') {
            return response()->json([
                'message' => 'Impossible de corriger le score : le tournoi est déjà terminé.',
            ], 422);
        }

        /*
         * Organizer can only manage
         * his own tournament.
         */
        if (
            $user->role !== 'admin' &&
            $tournament->organizer_id !== $user->id
        ) {
            return response()->json([
                'message' => 'Vous n\'êtes pas l\'organisateur de ce tournoi.',
            ], 403);
        }

        if ($report->status !== 'pending') {
            return response()->json([
                'message' => 'Ce signalement a déjà été traité.',
            ], 422);
        }

        if ($match->status !== 'completed') {
            return response()->json([
                'message' => 'Le match doit être terminé avant de corriger le score.',
            ], 422);
        }

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

            'resolution' => [
                'required',
                'string',
                'max:2000',
            ],
        ]);

        /*
         * No draw
         */
        if (
            $data['player1_score'] === $data['player2_score']
        ) {
            return response()->json([
                'message' => 'Un match ne peut pas se terminer par un nul.',
            ], 422);
        }

        /*
         * Determine corrected winner
         */
        $oldWinnerId = $match->winner_id;

        $newWinnerId =
            $data['player1_score'] > $data['player2_score']
                ? $match->player1_id
                : $match->player2_id;

        /*
         * Check next round
         */
        $nextRoundMatch = null;

        $nextRound = $match->round + 1;

        $nextRoundMatches = $tournament->matches()
            ->where('round', $nextRound)
            ->get();

        foreach ($nextRoundMatches as $nextMatch) {

            if (
                $nextMatch->player1_id === $oldWinnerId ||
                $nextMatch->player2_id === $oldWinnerId
            ) {
                $nextRoundMatch = $nextMatch;
                break;
            }
        }

        /*
         * Don't modify an already started next match
         */
        if (
            $nextRoundMatch &&
            $nextRoundMatch->status !== 'scheduled'
        ) {
            return response()->json([
                'message' => 'Impossible de corriger ce score : le match suivant a déjà commencé ou est terminé.',
            ], 422);
        }

        /*
         * Update everything inside transaction
         */
        DB::transaction(function () use (
            $match,
            $report,
            $data,
            $newWinnerId,
            $oldWinnerId,
            $nextRoundMatch,
            $user
        ) {

            /*
             * Update match
             */
            $match->update([
                'player1_score' => $data['player1_score'],
                'player2_score' => $data['player2_score'],
                'winner_id' => $newWinnerId,
            ]);

            /*
             * Update latest verified result
             */
            $verifiedResult = $match->results()
                ->where('verified', true)
                ->latest()
                ->first();

            if ($verifiedResult) {
                $verifiedResult->update([
                    'player1_score' => $data['player1_score'],
                    'player2_score' => $data['player2_score'],
                    'verified_by' => $user->id,
                ]);
            }

            /*
             * Correct next round player
             */
            if (
                $nextRoundMatch &&
                $oldWinnerId !== $newWinnerId
            ) {

                if ($nextRoundMatch->player1_id === $oldWinnerId) {
                    $nextRoundMatch->update([
                        'player1_id' => $newWinnerId,
                    ]);
                }

                if ($nextRoundMatch->player2_id === $oldWinnerId) {
                    $nextRoundMatch->update([
                        'player2_id' => $newWinnerId,
                    ]);
                }
            }

            /*
             * Resolve report
             */
            $report->update([
                'status' => 'resolved',
                'resolved_by' => $user->id,
                'resolution' => $data['resolution'],
            ]);
        });

        /*
         * Reload match
         */
        $match->load([
            'player1.user',
            'player2.user',
            'winner.user',
            'tournament',
        ]);

        /*
         * Notify reporter
         */
        NotificationService::send(
            $report->reportedBy,
            'report',
            'Score corrigé ⚽',
            "Le score du match #{$match->id} a été corrigé par l'organisateur.",
            [
                'report_id' => $report->id,
                'match_id' => $match->id,
                'tournament_id' => $match->tournament_id,
                'status' => 'resolved',
                'type' => 'score_correction',
            ]
        );

        /*
         * Notify players if winner changed
         */
        if ($oldWinnerId !== $newWinnerId) {

            $playersToNotify = collect([
                $match->player1?->user,
                $match->player2?->user,
            ])
                ->filter()
                ->unique('id');

            foreach ($playersToNotify as $playerUser) {

                NotificationService::send(
                    $playerUser,
                    'report',
                    'Résultat du match corrigé ⚠️',
                    "Le résultat du match #{$match->id} a été corrigé après vérification d'un signalement.",
                    [
                        'match_id' => $match->id,
                        'tournament_id' => $match->tournament_id,
                        'type' => 'score_correction',
                    ]
                );
            }
        }

        $report->load([
            'match.player1',
            'match.player2',
            'match.winner',
            'reportedBy',
            'againstPlayer',
            'resolvedBy',
        ]);

        return response()->json([
            'message' => 'Le score a été corrigé avec succès.',
            'report' => $report,
            'match' => $match,
            'winner' => $match->winner,
            'next_round_match' => $nextRoundMatch,
        ]);
    }


    /**
     * Get pending reports count.
     */
    public function pendingCount(Request $request)
    {
        $user = $request->user();

        /*
         * Admin OR Organizer
         */
        if (
            $user->role !== 'admin' &&
            !$user->is_organizer &&
            $user->role !== 'organizer'
        ) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 403);
        }

        $query = Report::where('status', 'pending');

        /*
         * Admin sees all pending reports.
         *
         * Organizer sees only reports
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

        return response()->json([
            'pending_count' => $query->count(),
        ]);
    }
}

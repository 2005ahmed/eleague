<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchMessage;
use App\Models\Notification;
use App\Models\TournamentMatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MatchMessageController extends Controller
{
    /**
     * Ensure that the authenticated user participates in this match.
     */
    private function ensureParticipant(
        TournamentMatch $match,
        int $userId
    ): void {
        $match->loadMissing([
            'player1',
            'player2',
        ]);

        $player1UserId = $match->player1?->user_id;
        $player2UserId = $match->player2?->user_id;

        $isParticipant =
            ($player1UserId !== null &&
                (int) $player1UserId === $userId) ||
            ($player2UserId !== null &&
                (int) $player2UserId === $userId);

        if (!$isParticipant) {
            abort(
                403,
                'You are not a participant in this match.'
            );
        }
    }

    /**
     * Get the messages for a match.
     */
    public function index(
        Request $request,
        TournamentMatch $match
    ) {
        $user = $request->user();

        $this->ensureParticipant(
            $match,
            (int) $user->id
        );

        $messages = MatchMessage::query()
            ->where('match_id', $match->id)
            ->with('sender:id,name')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message and notify the opponent.
     */
    public function store(
        Request $request,
        TournamentMatch $match
    ) {
        $user = $request->user();

        $this->ensureParticipant(
            $match,
            (int) $user->id
        );

        $validated = $request->validate([
            'message' => [
                'required',
                'string',
                'max:2000',
            ],
        ]);

        $text = trim($validated['message']);

        if ($text === '') {
            return response()->json([
                'message' => 'The message cannot be empty.',
            ], 422);
        }

        $match->loadMissing([
            'player1',
            'player2',
            'tournament',
        ]);

        /*
         * Find the opponent's user ID.
         */
        if (
            (int) $match->player1?->user_id ===
            (int) $user->id
        ) {
            $recipientId = $match->player2?->user_id;
        } elseif (
            (int) $match->player2?->user_id ===
            (int) $user->id
        ) {
            $recipientId = $match->player1?->user_id;
        } else {
            abort(
                403,
                'You are not a participant in this match.'
            );
        }

        if (!$recipientId) {
            return response()->json([
                'message' => 'Your opponent does not have an associated user account.',
            ], 422);
        }

        /*
         * Save the message and its notification together.
         */
        $message = DB::transaction(function () use (
            $match,
            $user,
            $recipientId,
            $text
        ) {
            $newMessage = MatchMessage::create([
                'match_id' => $match->id,
                'sender_id' => $user->id,
                'message' => $text,
            ]);

            Notification::create([
                'user_id' => $recipientId,
                'type' => 'match_message',
                'title' => 'Nouveau message',
                'message' => $user->name .
                    ' vous a envoyé un message.',
                'is_read' => false,
                'data' => [
                    'match_id' => $match->id,
                    'tournament_id' => $match->tournament_id,
                    'sender_id' => $user->id,
                    'sender_name' => $user->name,
                    'url' => '/tournaments/' .
                        $match->tournament_id .
                        '/matches/' .
                        $match->id,
                ],
            ]);

            return $newMessage;
        });

        $message->load('sender:id,name');

        return response()->json([
            'message' => $message,
        ], 201);
    }

    /**
     * Mark a message as read.
     */
    public function markAsRead(
        Request $request,
        MatchMessage $message
    ) {
        $user = $request->user();

        $match = $message->match()
            ->with([
                'player1',
                'player2',
            ])
            ->firstOrFail();

        $this->ensureParticipant(
            $match,
            (int) $user->id
        );

        if (
            (int) $message->sender_id !==
            (int) $user->id
        ) {
            $message->update([
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'message' => $message->fresh(
                'sender:id,name'
            ),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchMessage;
use App\Models\TournamentMatch;
use Illuminate\Http\Request;

class MatchMessageController extends Controller
{
    private function ensureParticipant(
        TournamentMatch $match,
        int $userId
    ): void {
        $isParticipant =
            $match->player1?->user_id === $userId ||
            $match->player2?->user_id === $userId;

        if (!$isParticipant) {
            abort(403, 'You are not a participant in this match.');
        }
    }

    public function index(Request $request, TournamentMatch $match)
    {
        $user = $request->user();

        $this->ensureParticipant($match, $user->id);

        $messages = MatchMessage::query()
            ->where('match_id', $match->id)
            ->with('sender:id,name')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'messages' => $messages,
        ]);
    }

    public function store(Request $request, TournamentMatch $match)
    {
        $user = $request->user();

        $this->ensureParticipant($match, $user->id);

        $validated = $request->validate([
            'message' => [
                'required',
                'string',
                'max:2000',
            ],
        ]);

        $message = MatchMessage::create([
            'match_id' => $match->id,
            'sender_id' => $user->id,
            'message' => trim($validated['message']),
        ]);

        $message->load('sender:id,name');

        return response()->json([
            'message' => $message,
        ], 201);
    }

    public function markAsRead(
        Request $request,
        MatchMessage $message
    ) {
        $user = $request->user();

        $match = $message->match()
            ->with(['player1', 'player2'])
            ->firstOrFail();

        $this->ensureParticipant($match, $user->id);

        if ($message->sender_id !== $user->id) {
            $message->update([
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'message' => $message->fresh('sender:id,name'),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tournament;
use Illuminate\Http\Request;

class TournamentController extends Controller
{
    /**
     * جميع البطولات
     */
    public function index(Request $request)
    {
        $query = Tournament::with([
            'game',
            'organizer',
        ]);

        if ($request->has('game_id')) {
            $query->where(
                'game_id',
                $request->game_id
            );
        }

        if ($request->has('status')) {
            $query->where(
                'status',
                $request->status
            );
        }

        $tournaments = $query
            ->latest()
            ->paginate(12);

        return response()->json($tournaments);
    }

    /**
     * تفاصيل بطولة
     */
    public function show(Tournament $tournament)
    {
        $tournament->load([
            'game',
            'organizer',
            'players',
            'matches.player1',
            'matches.player2',
            'matches.winner',
        ]);

        return response()->json($tournament);
    }

    /**
     * إنشاء بطولة
     */
    public function store(Request $request)
    {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Organizer Authorization
        |--------------------------------------------------------------------------
        |
        | User can create tournaments if:
        | - admin
        | - is_organizer = true
        | - legacy role = organizer
        |
        */
        if (
            $user->role !== 'admin' &&
            !$user->is_organizer &&
            $user->role !== 'organizer'
        ) {
            return response()->json([
                'message' => 'Vous n\'êtes pas autorisé à créer un tournoi.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */
        $validated = $request->validate([
            'game_id' => [
                'required',
                'integer',
                'exists:games,id'
            ],

            'name' => [
                'required',
                'string',
                'max:255'
            ],

            'description' => [
                'nullable',
                'string'
            ],

            'format' => [
                'required',
                'in:knockout'
            ],

            'max_players' => [
    'required',
    'integer',
    'in:4,8,16,32,64,128',
],

            'entry_fee' => [
                'nullable',
                'numeric',
                'min:0'
            ],

            'prize' => [
                'nullable',
                'numeric',
                'min:0'
            ],

            'start_date' => [
                'required',
                'nullable',
                'date'
            ],

            'rules' => [
                'required',
                'nullable',
                'string'
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Create Tournament
        |--------------------------------------------------------------------------
        */
        $tournament = Tournament::create([
            ...$validated,

            'organizer_id' => $user->id,

            'entry_fee' => $validated['entry_fee'] ?? 0,

            'prize' => $validated['prize'] ?? 0,

            'status' => 'draft',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Load relationships
        |--------------------------------------------------------------------------
        */
        $tournament->load([
            'game',
            'organizer',
        ]);

        return response()->json([
            'message' => 'Tournoi créé avec succès.',
            'tournament' => $tournament,
        ], 201);
    }

    /**
     * Modifier une البطولة
     */
    public function update(
        Request $request,
        Tournament $tournament
    ) {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Authorization
        |--------------------------------------------------------------------------
        */
        if (
            $user->role !== 'admin' &&
            (
                !$user->is_organizer &&
                $user->role !== 'organizer'
            )
        ) {
            return response()->json([
                'message' => 'Organizer access required.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Tournament ownership
        |--------------------------------------------------------------------------
        */
        if (
            $user->role !== 'admin' &&
            $tournament->organizer_id !== $user->id
        ) {
            return response()->json([
                'message' => 'Vous n\'êtes pas autorisé à modifier ce tournoi.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Status check
        |--------------------------------------------------------------------------
        */
        if (
            !in_array(
                $tournament->status,
                ['draft', 'registration']
            )
        ) {
            return response()->json([
                'message' => 'Ce tournoi ne peut plus être modifié.'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */
        $validated = $request->validate([
            'game_id' => [
                'sometimes',
                'integer',
                'exists:games,id'
            ],

            'name' => [
                'sometimes',
                'string',
                'max:255'
            ],

            'description' => [
                'nullable',
                'string'
            ],

            'format' => [
                'sometimes',
                'in:knockout'
            ],

            'max_players' => [
                'sometimes',
                'integer',
                'min:2',
                'max:128'
            ],

            'entry_fee' => [
                'sometimes',
                'numeric',
                'min:0'
            ],

            'prize' => [
                'sometimes',
                'numeric',
                'min:0'
            ],

            'start_date' => [
                'nullable',
                'date'
            ],

            'status' => [
                'sometimes',
                'in:draft,registration'
            ],

            'rules' => [
                'nullable',
                'string'
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Update
        |--------------------------------------------------------------------------
        */
        $tournament->update($validated);

        return response()->json([
            'message' => 'Tournoi modifié avec succès.',
            'tournament' => $tournament->fresh([
                'game',
                'organizer'
            ]),
        ]);
    }

    /**
     * حذف بطولة
     */
    public function destroy(
        Request $request,
        Tournament $tournament
    ) {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Authorization
        |--------------------------------------------------------------------------
        */
        if (
            $user->role !== 'admin' &&
            (
                !$user->is_organizer &&
                $user->role !== 'organizer'
            )
        ) {
            return response()->json([
                'message' => 'Organizer access required.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Tournament ownership
        |--------------------------------------------------------------------------
        */
        if (
            $user->role !== 'admin' &&
            $tournament->organizer_id !== $user->id
        ) {
            return response()->json([
                'message' => 'Vous n\'êtes pas autorisé à supprimer ce tournoi.'
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Status check
        |--------------------------------------------------------------------------
        */
        if (
            !in_array(
                $tournament->status,
                ['draft', 'cancelled']
            )
        ) {
            return response()->json([
                'message' => 'Ce tournoi ne peut pas être supprimé.'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Delete
        |--------------------------------------------------------------------------
        */
        $tournament->delete();

        return response()->json([
            'message' => 'Tournoi supprimé avec succès.'
        ]);
    }

    public function publish(
    Request $request,
    Tournament $tournament
) {
    $user = $request->user();

    if (
        $user->role !== 'admin' &&
        !$user->is_organizer &&
        $user->role !== 'organizer'
    ) {
        return response()->json([
            'message' => 'Organizer access required.'
        ], 403);
    }

    if (
        $user->role !== 'admin' &&
        $tournament->organizer_id !== $user->id
    ) {
        return response()->json([
            'message' =>
                'Vous n\'êtes pas autorisé à publier ce tournoi.'
        ], 403);
    }

    if ($tournament->status !== 'draft') {
        return response()->json([
            'message' =>
                'Seul un tournoi en brouillon peut être publié.'
        ], 422);
    }

    if (!$tournament->start_date) {
        return response()->json([
            'message' =>
                'La date de début est obligatoire avant de publier le tournoi.'
        ], 422);
    }

    $tournament->update([
        'status' => 'registration',
    ]);

    return response()->json([
        'message' =>
            'Le tournoi est maintenant ouvert aux inscriptions.',
        'tournament' => $tournament->fresh([
            'game',
            'organizer',
        ]),
    ]);
}

public function cancel(
    Request $request,
    Tournament $tournament
) {
    $user = $request->user();

    if (
        $user->role !== 'admin' &&
        !$user->is_organizer &&
        $user->role !== 'organizer'
    ) {
        return response()->json([
            'message' => 'Organizer access required.'
        ], 403);
    }

    if (
        $user->role !== 'admin' &&
        $tournament->organizer_id !== $user->id
    ) {
        return response()->json([
            'message' =>
                'Vous n\'êtes pas autorisé à annuler ce tournoi.'
        ], 403);
    }

    if (!in_array(
        $tournament->status,
        ['draft', 'registration']
    )) {
        return response()->json([
            'message' =>
                'Ce tournoi ne peut plus être annulé.'
        ], 422);
    }

    $tournament->update([
        'status' => 'cancelled',
    ]);

    return response()->json([
        'message' =>
            'Le tournoi a été annulé avec succès.',
        'tournament' => $tournament->fresh([
            'game',
            'organizer',
        ]),
    ]);
}

    /**
     * Champion d'une البطولة
     */
    public function champion(Tournament $tournament)
    {
        if ($tournament->status !== 'completed') {
            return response()->json([
                'message' => 'Le tournoi n\'est pas encore terminé.'
            ], 422);
        }

        $final = $tournament->matches()
            ->where('status', 'completed')
            ->orderByDesc('round')
            ->first();

        if (!$final || !$final->winner_id) {
            return response()->json([
                'message' => 'Le champion n\'a pas encore été déterminé.'
            ], 404);
        }

        $final->load([
            'winner',
            'player1',
            'player2',
        ]);

        return response()->json([
            'tournament_id' => $tournament->id,

            'tournament_name' => $tournament->name,

            'champion' => $final->winner,

            'final' => [
                'match_id' => $final->id,

                'player1' => $final->player1,

                'player1_score' => $final->player1_score,

                'player2' => $final->player2,

                'player2_score' => $final->player2_score,
            ],
        ]);
    }

    public function updateStatus(Request $request, Tournament $tournament)
{
    $user = $request->user();

    // Organizer access
    if (
        $user->role !== 'admin' &&
        !$user->is_organizer &&
        $user->role !== 'organizer'
    ) {
        return response()->json([
            'message' => 'Organizer access required.'
        ], 403);
    }

    // Only owner organizer can change his tournament
    if (
        $user->role !== 'admin' &&
        $tournament->organizer_id !== $user->id
    ) {
        return response()->json([
            'message' => 'Vous n\'êtes pas autorisé à modifier ce tournoi.'
        ], 403);
    }

    $validated = $request->validate([
        'status' => [
            'required',
            'in:draft,registration,in_progress,completed,cancelled'
        ],
    ]);

    $newStatus = $validated['status'];
    $currentStatus = $tournament->status;

    // Allowed transitions
    $allowedTransitions = [
        'draft' => [
            'registration',
            'cancelled',
        ],

        'registration' => [
            'in_progress',
            'cancelled',
        ],

        'in_progress' => [
            'completed',
            'cancelled',
        ],

        'completed' => [],

        'cancelled' => [],
    ];

    if (
        !in_array(
            $newStatus,
            $allowedTransitions[$currentStatus] ?? []
        )
    ) {
        return response()->json([
            'message' => "Impossible de changer le status de {$currentStatus} vers {$newStatus}."
        ], 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Extra checks
    |--------------------------------------------------------------------------
    */

    if (
        $newStatus === 'in_progress' &&
        $tournament->matches()->count() === 0
    ) {
        return response()->json([
            'message' => 'Vous devez générer le bracket avant de commencer le tournoi.'
        ], 422);
    }

    if ($newStatus === 'completed') {
        $unfinishedMatches = $tournament
            ->matches()
            ->where('status', '!=', 'completed')
            ->count();

        if ($unfinishedMatches > 0) {
            return response()->json([
                'message' => 'Tous les matchs doivent être terminés avant de clôturer le tournoi.'
            ], 422);
        }
    }

    $tournament->update([
        'status' => $newStatus,
    ]);

    return response()->json([
        'message' => 'Status du tournoi mis à jour avec succès.',
        'tournament' => $tournament->fresh([
            'game',
            'organizer',
        ]),
    ]);
}

public function myTournaments(Request $request)
{
    $user = $request->user();

    if (
        $user->role !== 'admin' &&
        !$user->is_organizer
    ) {
        return response()->json([
            'message' => 'Unauthorized.'
        ], 403);
    }

    $query = Tournament::query()
        ->with(['game'])
        ->withCount([
            'players as registered_players' => function ($query) {
                $query->where(
                    'tournament_players.status',
                    'registered'
                );
            },
        ]);

    // Admin يشوف جميع tournaments
    // Organizer يشوف غير ديالو
    if ($user->role !== 'admin') {
        $query->where('organizer_id', $user->id);
    }

    $tournaments = $query
        ->latest()
        ->get();

    return response()->json($tournaments);
}
}

<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Player;


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
        'in:' . implode(',', Tournament::availableFormats()),
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
    'in:' . implode(',', Tournament::availableFormats()),
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

    /*
    |--------------------------------------------------------------------------
    | ROUND ROBIN
    |--------------------------------------------------------------------------
    */

    if ($tournament->isRoundRobin()) {
        $standingsService = app(
            \App\Services\TournamentStandingsService::class
        );

        $standings = $standingsService->calculate($tournament);

        $championStanding = $standings[0] ?? null;

        if (!$championStanding) {
            return response()->json([
                'message' =>
                    'Le champion n\'a pas encore été déterminé.'
            ], 404);
        }

        $champion = $tournament->players()
            ->where(
                'players.id',
                $championStanding['player_id']
            )
            ->first();

        if (!$champion) {
            return response()->json([
                'message' =>
                    'Le joueur champion est introuvable.'
            ], 404);
        }

        return response()->json([
            'tournament_id' => $tournament->id,

            'tournament_name' => $tournament->name,

            'format' => $tournament->format,

            'champion' => $champion,

            'standings' => $standings,

            'final' => null,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | KNOCKOUT
    |--------------------------------------------------------------------------
    */

    $final = $tournament->matches()
        ->where('status', 'completed')
        ->orderByDesc('round')
        ->first();

    if (!$final || !$final->winner_id) {
        return response()->json([
            'message' =>
                'Le champion n\'a pas encore été déterminé.'
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

        'format' => $tournament->format,

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

/**
 * Get tournament players.
 */
public function players(Tournament $tournament)
{
    $players = $tournament->players()
        ->wherePivot('status', 'registered')
        ->with('user')
        ->orderByPivot('joined_at')
        ->get();

    return response()->json([
        'tournament_id' => $tournament->id,
        'players_count' => $players->count(),
        'max_players' => $tournament->max_players,
        'players' => $players,
    ]);
}

/**
 * Register current player in tournament.
 */
public function register(
    Request $request,
    Tournament $tournament
) {
    $user = $request->user();

    /*
    |--------------------------------------------------------------------------
    | Player account
    |--------------------------------------------------------------------------
    */

    $player = Player::where(
        'user_id',
        $user->id
    )->first();

    if (!$player) {
        return response()->json([
            'message' =>
                'Vous devez avoir un profil joueur avant de rejoindre un tournoi.'
        ], 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Tournament status
    |--------------------------------------------------------------------------
    */

    if ($tournament->status !== 'registration') {
        return response()->json([
            'message' =>
                'Les inscriptions pour ce tournoi ne sont pas ouvertes.'
        ], 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Check if already registered
    |--------------------------------------------------------------------------
    */

    $alreadyRegistered = $tournament->players()
        ->where('players.id', $player->id)
        ->wherePivot('status', 'registered')
        ->exists();

    if ($alreadyRegistered) {
        return response()->json([
            'message' =>
                'Vous êtes déjà inscrit à ce tournoi.'
        ], 409);
    }

    /*
    |--------------------------------------------------------------------------
    | Register safely
    |--------------------------------------------------------------------------
    */

    $result = DB::transaction(function () use (
        $tournament,
        $player
    ) {
        /*
        | Lock tournament row to prevent two players
        | taking the last available slot at the same time.
        */

        $lockedTournament = Tournament::query()
            ->where('id', $tournament->id)
            ->lockForUpdate()
            ->first();

        if (!$lockedTournament) {
            throw new \RuntimeException(
                'Tournoi introuvable.'
            );
        }

        if (
            $lockedTournament->status !==
            'registration'
        ) {
            return [
                'error' => [
                    'message' =>
                        'Les inscriptions pour ce tournoi ne sont plus ouvertes.',
                    'status' => 422,
                ],
            ];
        }

        $registeredCount =
            $lockedTournament
                ->players()
                ->wherePivot(
                    'status',
                    'registered'
                )
                ->count();

        if (
            $registeredCount >=
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

        $alreadyRegistered =
            $lockedTournament
                ->players()
                ->where(
                    'players.id',
                    $player->id
                )
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

        $lockedTournament
            ->players()
            ->attach(
                $player->id,
                [
                    'seed' => null,
                    'status' => 'registered',
                    'joined_at' => now(),
                ]
            );

        return [
            'success' => true,
            'registered_count' =>
                $registeredCount + 1,
            'max_players' =>
                (int) $lockedTournament->max_players,
        ];
    });

    if (isset($result['error'])) {
        return response()->json(
            $result['error'],
            $result['error']['status']
        );
    }

    return response()->json([
        'message' =>
            'Vous êtes inscrit au tournoi avec succès.',
        'registered_count' =>
            $result['registered_count'],
        'max_players' =>
            $result['max_players'],
        'player' => $player,
    ], 201);
}

/**
 * Leave tournament registration.
 */
public function unregister(
    Request $request,
    Tournament $tournament
) {
    $user = $request->user();

    /*
    |--------------------------------------------------------------------------
    | Player account
    |--------------------------------------------------------------------------
    */

    $player = Player::where(
        'user_id',
        $user->id
    )->first();

    if (!$player) {
        return response()->json([
            'message' =>
                'Profil joueur introuvable.'
        ], 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Tournament status
    |--------------------------------------------------------------------------
    */

    if ($tournament->status !== 'registration') {
        return response()->json([
            'message' =>
                'Vous ne pouvez plus quitter ce tournoi.'
        ], 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Registration
    |--------------------------------------------------------------------------
    */

    $registered = $tournament->players()
        ->where('players.id', $player->id)
        ->wherePivot('status', 'registered')
        ->exists();

    if (!$registered) {
        return response()->json([
            'message' =>
                'Vous n\'êtes pas inscrit à ce tournoi.'
        ], 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Remove registration
    |--------------------------------------------------------------------------
    */

    $tournament->players()->updateExistingPivot(
        $player->id,
        [
            'status' => 'withdrawn',
        ]
    );

    return response()->json([
        'message' =>
            'Vous avez quitté le tournoi.',
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

public function standings(
    \App\Models\Tournament $tournament,
    \App\Services\TournamentStandingsService $standingsService,
    \App\Services\TournamentGroupStageService $groupStageService
) {
    if ($tournament->isRoundRobin()) {
        return response()->json([
            'tournament' => $tournament->load('game'),
            'format' => $tournament->format,
            'standings' => $standingsService->calculate($tournament),
        ]);
    }

    if ($tournament->isGroupKnockout()) {
        $standings = $groupStageService->calculateStandings($tournament);

        $qualified = [];

        foreach ($standings as $groupName => $groupStandings) {
            $qualified[$groupName] = [
                'first' => $groupStandings[0] ?? null,
                'second' => $groupStandings[1] ?? null,
            ];
        }

        return response()->json([
            'tournament' => $tournament->load('game'),
            'format' => $tournament->format,
            'groups' => $standings,
            'qualified' => $qualified,
            'all_group_matches_completed' =>
                $groupStageService->allGroupMatchesCompleted($tournament),
        ]);
    }

    return response()->json([
        'message' => 'Standings are not available for this tournament format.',
        'format' => $tournament->format,
        'standings' => [],
    ]);
}

public function qualifyGroups(
    Request $request,
    \App\Models\Tournament $tournament,
    \App\Services\TournamentGroupStageService $groupStageService
) {
    $user = $request->user();

    $isAdmin = $user && $user->role === 'admin';

    $isOrganizer =
        $user && (
            $tournament->organizer_id === $user->id
            || $user->is_organizer === true
            || $user->role === 'organizer'
        );

    if (!$isAdmin && !$isOrganizer) {
        return response()->json([
            'message' => 'Unauthorized.',
        ], 403);
    }

    if (!$tournament->isGroupKnockout()) {
        return response()->json([
            'message' => 'This tournament is not a Group Stage tournament.',
        ], 422);
    }

    try {
        $result = $groupStageService->qualify($tournament);

        return response()->json([
            'message' => $result['already_qualified']
                ? 'Players were already qualified.'
                : 'Group qualification completed successfully.',

            'tournament_id' => $tournament->id,

            'qualified' => $result['qualified'],

            'knockout_matches' => $result['knockout_matches'],

            'already_qualified' => $result['already_qualified'],
        ]);
    } catch (\RuntimeException $e) {
        return response()->json([
            'message' => $e->getMessage(),
        ], 422);
    }
}

/**
 * Get tournament matches.
 */
public function matches(Tournament $tournament)
{
    $matches = $tournament->matches()
        ->with([
            'player1.user',
            'player2.user',
            'winner.user',
        ])
        ->orderBy('round')
        ->orderBy('id')
        ->get();

    return response()->json([
        'tournament_id' => $tournament->id,
        'matches' => $matches,
    ]);
}
}

<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\TournamentController;
use App\Http\Controllers\Api\TournamentRegistrationController;
use App\Http\Controllers\Api\BracketController;
use App\Http\Controllers\Api\MatchResultController;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\OrganizerDashboardController;
use App\Http\Controllers\Api\MatchMessageController;


/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {

    Route::post('/register', [
        AuthController::class,
        'register'
    ]);

    Route::post('/login', [
        AuthController::class,
        'login'
    ]);

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/me', [
            AuthController::class,
            'me'
        ]);

        Route::post('/logout', [
            AuthController::class,
            'logout'
        ]);

        Route::post('/become-organizer', [
            AuthController::class,
            'becomeOrganizer'
        ]);
    });
});


/*
|--------------------------------------------------------------------------
| Games
|--------------------------------------------------------------------------
*/

Route::get('/games', [
    GameController::class,
    'index'
]);

Route::get('/games/{game}', [
    GameController::class,
    'show'
]);


/*
|--------------------------------------------------------------------------
| Public Tournaments
|--------------------------------------------------------------------------
*/

Route::get('/tournaments', [
    TournamentController::class,
    'index'
]);

Route::get('/tournaments/{tournament}', [
    TournamentController::class,
    'show'
])->whereNumber('tournament');


/*
|--------------------------------------------------------------------------
| Public Tournament Players
|--------------------------------------------------------------------------
*/

Route::get(
    '/tournaments/{tournament}/players',
    [
        TournamentRegistrationController::class,
        'index'
    ]
)->whereNumber('tournament');


/*
|--------------------------------------------------------------------------
| Public Tournament Matches
|--------------------------------------------------------------------------
*/

Route::get(
    '/tournaments/{tournament}/matches',
    [
        MatchController::class,
        'index'
    ]
)->whereNumber('tournament');

Route::get(
    '/matches/{match}',
    [
        MatchController::class,
        'show'
    ]
)->whereNumber('match');


/*
|--------------------------------------------------------------------------
| Tournament Champion
|--------------------------------------------------------------------------
*/

Route::get(
    '/tournaments/{tournament}/champion',
    [
        TournamentController::class,
        'champion'
    ]
)->whereNumber('tournament');


/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get('/dashboard', [
        DashboardController::class,
        'index'
    ]);

    Route::get('/organizer/dashboard', [
        OrganizerDashboardController::class,
        'index'
    ]);


    /*
    |--------------------------------------------------------------------------
    | Profile
    |--------------------------------------------------------------------------
    */

    Route::get('/profile', [
        ProfileController::class,
        'show'
    ]);

    Route::put('/profile', [
        ProfileController::class,
        'update'
    ]);


    /*
    |--------------------------------------------------------------------------
    | Leaderboard
    |--------------------------------------------------------------------------
    */

    Route::get('/leaderboard', [
        LeaderboardController::class,
        'index'
    ]);


    /*
    |--------------------------------------------------------------------------
    | Tournaments - Organizer
    |--------------------------------------------------------------------------
    */

    Route::post('/tournaments', [
        TournamentController::class,
        'store'
    ]);

    Route::put('/tournaments/{tournament}', [
        TournamentController::class,
        'update'
    ])->whereNumber('tournament');

    Route::delete('/tournaments/{tournament}', [
        TournamentController::class,
        'destroy'
    ])->whereNumber('tournament');

    Route::put(
        '/tournaments/{tournament}/status',
        [
            TournamentController::class,
            'updateStatus'
        ]
    )->whereNumber('tournament');

    Route::get('/organizer/tournaments', [
        TournamentController::class,
        'myTournaments'
    ]);


    /*
    |--------------------------------------------------------------------------
    | Tournament Registration
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/tournaments/{tournament}/register',
        [
            TournamentRegistrationController::class,
            'store'
        ]
    )->whereNumber('tournament');

    Route::delete(
        '/tournaments/{tournament}/register',
        [
            TournamentRegistrationController::class,
            'destroy'
        ]
    )->whereNumber('tournament');


    /*
    |--------------------------------------------------------------------------
    | Tournament Publish / Cancel
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/tournaments/{tournament}/publish',
        [
            TournamentController::class,
            'publish'
        ]
    )->whereNumber('tournament');

    Route::post(
        '/tournaments/{tournament}/cancel',
        [
            TournamentController::class,
            'cancel'
        ]
    )->whereNumber('tournament');


    /*
    |--------------------------------------------------------------------------
    | Tournament Standings
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/tournaments/{tournament}/standings',
        [
            TournamentController::class,
            'standings'
        ]
    )->whereNumber('tournament');


    /*
    |--------------------------------------------------------------------------
    | Tournament Group Qualification
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/tournaments/{tournament}/groups/qualify',
        [
            TournamentController::class,
            'qualifyGroups'
        ]
    )->whereNumber('tournament');


    /*
    |--------------------------------------------------------------------------
    | Tournament Bracket
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/tournaments/{tournament}/bracket/generate',
        [
            BracketController::class,
            'generate'
        ]
    )->whereNumber('tournament');


    /*
    |--------------------------------------------------------------------------
    | Match Chat
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/matches/{match}/messages',
        [
            MatchMessageController::class,
            'index'
        ]
    )->whereNumber('match');

    Route::post(
        '/matches/{match}/messages',
        [
            MatchMessageController::class,
            'store'
        ]
    )->whereNumber('match');

    Route::patch(
        '/messages/{message}/read',
        [
            MatchMessageController::class,
            'markAsRead'
        ]
    )->whereNumber('message');


    /*
    |--------------------------------------------------------------------------
    | Matches
    |--------------------------------------------------------------------------
    */

    Route::get('/my-matches', [
        MatchController::class,
        'myMatches'
    ]);
    Route::get(
    '/tournaments/{tournament}/matches',
    [TournamentController::class, 'matches']
)->whereNumber('tournament');


    /*
    |--------------------------------------------------------------------------
    | Match Results
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/matches/{match}/result',
        [
            MatchResultController::class,
            'store'
        ]
    )->whereNumber('match');

    Route::post(
        '/results/{result}/verify',
        [
            MatchResultController::class,
            'verify'
        ]
    )->whereNumber('result');

    Route::post(
        '/results/{result}/reject',
        [
            MatchResultController::class,
            'reject'
        ]
    )->whereNumber('result');


    /*
    |--------------------------------------------------------------------------
    | Organizer Results
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/organizer/results',
        [
            MatchResultController::class,
            'pendingResults'
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

    Route::get('/notifications', [
        NotificationController::class,
        'index'
    ]);

    Route::get(
        '/notifications/unread-count',
        [
            NotificationController::class,
            'unreadCount'
        ]
    );

    Route::put(
        '/notifications/{notification}/read',
        [
            NotificationController::class,
            'markAsRead'
        ]
    )->whereNumber('notification');

    Route::put(
        '/notifications/read-all',
        [
            NotificationController::class,
            'markAllAsRead'
        ]
    );

    Route::delete(
        '/notifications/{notification}',
        [
            NotificationController::class,
            'destroy'
        ]
    )->whereNumber('notification');


    /*
    |--------------------------------------------------------------------------
    | Reports / Disputes
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/matches/{match}/reports',
        [
            ReportController::class,
            'store'
        ]
    )->whereNumber('match');

    Route::get('/reports', [
        ReportController::class,
        'index'
    ]);

    Route::get(
        '/reports/pending-count',
        [
            ReportController::class,
            'pendingCount'
        ]
    );

    Route::put(
        '/reports/{report}/resolve',
        [
            ReportController::class,
            'resolve'
        ]
    )->whereNumber('report');

    Route::put(
        '/reports/{report}/reject',
        [
            ReportController::class,
            'reject'
        ]
    )->whereNumber('report');

    Route::put(
        '/reports/{report}/correct-score',
        [
            ReportController::class,
            'correctScore'
        ]
    )->whereNumber('report');


    /*
    |--------------------------------------------------------------------------
    | Admin
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/admin/dashboard',
        [
            AdminDashboardController::class,
            'index'
        ]
    );
});

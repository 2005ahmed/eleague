<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Player extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nickname',
        'avatar',
        'country',
        'bio',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tournaments()
    {
        return $this->belongsToMany(
            Tournament::class,
            'tournament_players'
        )->withPivot([
            'seed',
            'status',
            'joined_at',
        ])->withTimestamps();
    }

    public function matchesAsPlayer1()
    {
        return $this->hasMany(
            TournamentMatch::class,
            'player1_id'
        );
    }

    public function matchesAsPlayer2()
    {
        return $this->hasMany(
            TournamentMatch::class,
            'player2_id'
        );
    }

    public function wonMatches()
    {
        return $this->hasMany(
            TournamentMatch::class,
            'winner_id'
        );
    }

    public function reportsAgainst()
    {
        return $this->hasMany(
            Report::class,
            'against_player'
        );
    }
}

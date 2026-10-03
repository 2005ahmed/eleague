<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TournamentMatch extends Model
{
    use HasFactory;

    protected $table = 'tournament_matches';

    protected $fillable = [
    'tournament_id',
    'round',
    'player1_id',
    'player2_id',
    'player1_score',
    'player2_score',
    'winner_id',
    'scheduled_at',
    'status',
];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    public function tournament()
    {
        return $this->belongsTo(Tournament::class);
    }

    public function player1()
    {
        return $this->belongsTo(
            Player::class,
            'player1_id'
        );
    }

    public function player2()
    {
        return $this->belongsTo(
            Player::class,
            'player2_id'
        );
    }

    public function winner()
    {
        return $this->belongsTo(
            Player::class,
            'winner_id'
        );
    }

    public function results()
    {
        return $this->hasMany(Result::class, 'match_id');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'match_id');
    }
}

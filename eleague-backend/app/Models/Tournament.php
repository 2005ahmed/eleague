<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\TournamentMatch;

class Tournament extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_id',
        'organizer_id',
        'name',
        'description',
        'format',
        'max_players',
        'entry_fee',
        'prize',
        'start_date',
        'status',
        'rules',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'entry_fee' => 'decimal:2',
        'prize' => 'decimal:2',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function organizer()
    {
        return $this->belongsTo(
            User::class,
            'organizer_id'
        );
    }

    public function players()
    {
        return $this->belongsToMany(
            Player::class,
            'tournament_players'
        )->withPivot([
            'seed',
            'status',
            'joined_at',
        ])->withTimestamps();
    }

    public function matches()
{
    return $this->hasMany(TournamentMatch::class);
}
}

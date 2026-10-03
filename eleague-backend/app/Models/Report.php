<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'match_id',
        'reported_by',
        'against_player',
        'reason',
        'description',
        'evidence',
        'status',
        'resolved_by',
        'resolution',
    ];

    public function match()
    {
        return $this->belongsTo(
            TournamentMatch::class,
            'match_id'
        );
    }

    public function reportedBy()
    {
        return $this->belongsTo(
            User::class,
            'reported_by'
        );
    }

    public function againstPlayer()
    {
        return $this->belongsTo(
            Player::class,
            'against_player'
        );
    }

    public function resolvedBy()
    {
        return $this->belongsTo(
            User::class,
            'resolved_by'
        );
    }
}

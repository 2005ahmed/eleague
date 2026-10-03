<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Result extends Model
{
    use HasFactory;

    protected $fillable = [
        'match_id',
        'submitted_by',
        'player1_score',
        'player2_score',
        'screenshot',
        'verified',
        'verified_by',
    ];

    protected $casts = [
        'verified' => 'boolean',
    ];

    public function match()
    {
        return $this->belongsTo(
            TournamentMatch::class,
            'match_id'
        );
    }

    public function submittedBy()
    {
        return $this->belongsTo(
            User::class,
            'submitted_by'
        );
    }

    public function verifiedBy()
    {
        return $this->belongsTo(
            User::class,
            'verified_by'
        );
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tournament extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Tournament Formats
    |--------------------------------------------------------------------------
    */

    public const FORMAT_KNOCKOUT = 'knockout';

    public const FORMAT_ROUND_ROBIN = 'round_robin';

    public const FORMAT_GROUP_KNOCKOUT = 'group_knockout';

    public const FORMAT_DOUBLE_ELIMINATION = 'double_elimination';

    public const FORMATS = [
        self::FORMAT_KNOCKOUT,
        self::FORMAT_ROUND_ROBIN,
        self::FORMAT_GROUP_KNOCKOUT,
        self::FORMAT_DOUBLE_ELIMINATION,
    ];

    /*
    |--------------------------------------------------------------------------
    | Fillable
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Casts
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'start_date' => 'datetime',
        'entry_fee' => 'decimal:2',
        'prize' => 'decimal:2',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function organizer()
    {
        return $this->belongsTo(User::class, 'organizer_id');
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

    /*
    |--------------------------------------------------------------------------
    | Format Helpers
    |--------------------------------------------------------------------------
    */

    public function isKnockout(): bool
    {
        return $this->format === self::FORMAT_KNOCKOUT;
    }

    public function isRoundRobin(): bool
    {
        return $this->format === self::FORMAT_ROUND_ROBIN;
    }

    public function isGroupKnockout(): bool
    {
        return $this->format === self::FORMAT_GROUP_KNOCKOUT;
    }

    public function isDoubleElimination(): bool
    {
        return $this->format === self::FORMAT_DOUBLE_ELIMINATION;
    }

    public static function availableFormats(): array
    {
        return self::FORMATS;
    }
}

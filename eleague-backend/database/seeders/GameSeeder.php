<?php

namespace Database\Seeders;

use App\Models\Game;
use Illuminate\Database\Seeder;

class GameSeeder extends Seeder
{
    public function run(): void
    {
        Game::updateOrCreate(
            ['slug' => 'fc-mobile'],
            [
                'name' => 'FC Mobile',
                'logo' => null,
                'is_active' => true,
            ]
        );

        Game::updateOrCreate(
            ['slug' => 'efootball'],
            [
                'name' => 'eFootball',
                'logo' => null,
                'is_active' => true,
            ]
        );
    }
}

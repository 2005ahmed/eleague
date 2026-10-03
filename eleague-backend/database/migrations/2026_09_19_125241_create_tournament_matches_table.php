<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tournament_matches', function (Blueprint $table) {
            $table->id();

            $table->foreignId('tournament_id')
                ->constrained('tournaments')
                ->cascadeOnDelete();

            $table->unsignedInteger('round');

            $table->foreignId('player1_id')
                ->nullable()
                ->constrained('players')
                ->nullOnDelete();

            $table->foreignId('player2_id')
                ->nullable()
                ->constrained('players')
                ->nullOnDelete();

            $table->unsignedInteger('player1_score')->default(0);
            $table->unsignedInteger('player2_score')->default(0);

            $table->foreignId('winner_id')
                ->nullable()
                ->constrained('players')
                ->nullOnDelete();

            $table->timestamp('scheduled_at')->nullable();

            $table->string('status')->default('scheduled');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tournament_matches');
    }
};

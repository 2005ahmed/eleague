<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('match_id')
                ->constrained('tournament_matches')
                ->cascadeOnDelete();

            $table->foreignId('reported_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('against_player')
                ->nullable()
                ->constrained('players')
                ->nullOnDelete();

            $table->string('reason');
            $table->text('description')->nullable();
            $table->string('evidence')->nullable();

            $table->string('status')->default('pending');

            $table->foreignId('resolved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('resolution')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};

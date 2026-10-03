<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tournaments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('game_id')
                ->constrained('games')
                ->restrictOnDelete();

            $table->foreignId('organizer_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('name');
            $table->text('description')->nullable();

            $table->string('format')->default('knockout');

            $table->unsignedInteger('max_players')->default(16);

            $table->decimal('entry_fee', 10, 2)->default(0);
            $table->decimal('prize', 10, 2)->default(0);

            $table->timestamp('start_date')->nullable();

            $table->string('status')->default('draft');

            $table->text('rules')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tournaments');
    }
};

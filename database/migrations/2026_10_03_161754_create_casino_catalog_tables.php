<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_providers', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->string('symbol');
            $table->timestamps();
        });
        Schema::create('games', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('game_provider_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('category');
            $table->json('tags');
            $table->string('image');
            $table->string('color');
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('popularity')->default(0);
            $table->timestamps();
            $table->index(['category', 'popularity']);
        });
        Schema::create('tournaments', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('description');
            $table->string('image');
            $table->unsignedBigInteger('prize_pool');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->timestamps();
        });
        Schema::create('tournament_user', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tournament_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['tournament_id', 'user_id']);
        });
        Schema::create('bonus_codes', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->unsignedInteger('amount');
            $table->boolean('is_active')->default(true);
            $table->dateTime('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bonus_codes');
        Schema::dropIfExists('tournament_user');
        Schema::dropIfExists('tournaments');
        Schema::dropIfExists('games');
        Schema::dropIfExists('game_providers');
    }
};

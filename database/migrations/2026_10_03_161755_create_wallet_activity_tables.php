<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('game_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('amount');
            $table->uuid('request_id');
            $table->timestamps();
            $table->unique(['user_id', 'request_id']);
        });
        Schema::create('wins', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('bet_id')->unique()->constrained()->restrictOnDelete();
            $table->unsignedInteger('amount');
            $table->unsignedInteger('multiplier');
            $table->timestamps();
        });
        Schema::create('wallet_transactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('type');
            $table->bigInteger('amount');
            $table->unsignedBigInteger('balance_after');
            $table->string('description');
            $table->uuid('request_id')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'request_id']);
            $table->index(['user_id', 'created_at']);
        });
        Schema::create('bonus_redemptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('bonus_code_id')->constrained()->restrictOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'bonus_code_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bonus_redemptions');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wins');
        Schema::dropIfExists('bets');
    }
};

<?php

namespace Database\Factories;

use App\Models\Bet;
use App\Models\Game;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Bet> */
class BetFactory extends Factory
{
    public function definition(): array
    {
        return ['user_id' => User::factory(), 'game_id' => Game::factory(), 'amount' => 100, 'request_id' => fake()->uuid()];
    }
}

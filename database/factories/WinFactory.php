<?php

namespace Database\Factories;

use App\Models\Bet;
use App\Models\Win;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Win> */
class WinFactory extends Factory
{
    public function definition(): array
    {
        return ['bet_id' => Bet::factory(), 'amount' => 0, 'multiplier' => 0];
    }
}

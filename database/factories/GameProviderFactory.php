<?php

namespace Database\Factories;

use App\Models\GameProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<GameProvider> */
class GameProviderFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => fake()->unique()->company(), 'slug' => fake()->unique()->slug(), 'symbol' => '✦'];
    }
}

<?php

namespace Database\Factories;

use App\Models\Game;
use App\Models\GameProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Game> */
class GameFactory extends Factory
{
    public function definition(): array
    {
        return ['game_provider_id' => GameProvider::factory(), 'name' => fake()->words(2, true), 'slug' => fake()->unique()->slug(), 'category' => 'Slots', 'tags' => ['Adventure'], 'image' => '0', 'color' => '#174b44', 'is_popular' => false, 'is_featured' => false, 'popularity' => 50];
    }
}

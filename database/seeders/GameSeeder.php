<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\GameProvider;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class GameSeeder extends Seeder
{
    public function run(): void
    {
        $providers = GameProvider::orderBy('id')->pluck('id')->all();
        $names = ['Golden Pharaoh', 'Octopus Odyssey', 'Sugar Rush', 'Wild Jungle', 'Sun of Fortune', 'Clover Club', 'Moonlit Wolf', 'Cherry Pop', 'Cosmic Quest', 'Pineapple Party', 'Pirate Cove', 'Frost Dragon'];
        $colors = ['#094e5a', '#68529c', '#dd408c', '#1c573d', '#bb4c12', '#22734c', '#273767', '#942e45', '#53347e', '#258c7a', '#245b60', '#326c9a'];
        $categories = ['Slots', 'Arcade', 'Table games', 'Instant win'];
        $tags = ['Adventure', 'Sweet', 'Classic', 'Fantasy', 'Tropical'];
        $editions = ['', 'After Dark', 'Paradise', 'Neon Nights', 'Treasure Trail', 'Wild Escape', 'Golden Hour', 'Moonrise', 'Deluxe', 'Island Edition'];
        for ($index = 0; $index < 120; $index++) {
            $art = $index % 12;
            $edition = intdiv($index, 12);
            $name = trim($names[$art].' '.$editions[$edition]);
            Game::updateOrCreate(['slug' => Str::slug($name)], [
                'name' => $name, 'game_provider_id' => $providers[$index % count($providers)],
                'category' => $categories[$edition % 4], 'tags' => [$tags[$art % 5], $edition < 2 ? 'New' : 'Island favorite'],
                'image' => (string) $art, 'color' => $colors[$art], 'is_popular' => $index < 12,
                'is_featured' => $index >= 12 && $index < 24, 'popularity' => 1000 - $index,
            ]);
        }
    }
}

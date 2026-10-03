<?php

namespace Database\Seeders;

use App\Models\Tournament;
use Illuminate\Database\Seeder;

class TournamentSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([['Island Rush', 'A little friendly competition. A whole lot of island energy.', '9', 2500000], ['Treasure Hunters', 'Follow the golden trail and explore our adventure favorites.', '10', 1500000], ['Cosmic Carnival', 'A stellar escape for the dreamers and night owls.', '8', 1000000]] as [$name, $description, $image, $pool]) {
            Tournament::updateOrCreate(['name' => $name], ['description' => $description, 'image' => $image, 'prize_pool' => $pool, 'starts_at' => now()->subDay(), 'ends_at' => now()->addDays(7)->endOfDay()]);
        }
    }
}

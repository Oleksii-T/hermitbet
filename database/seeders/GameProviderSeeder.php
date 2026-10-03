<?php

namespace Database\Seeders;

use App\Models\GameProvider;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class GameProviderSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Shell Studio' => '◉', 'Palm Play' => '✳', 'Orbit Games' => '◈', 'Coral Labs' => '✦', 'Lucky Mango' => '❋', 'Wildwave' => '≋'] as $name => $symbol) {
            GameProvider::updateOrCreate(['slug' => Str::slug($name)], ['name' => $name, 'symbol' => $symbol]);
        }
    }
}

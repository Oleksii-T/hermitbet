<?php

namespace Database\Seeders;

use App\Models\BonusCode;
use Illuminate\Database\Seeder;

class BonusCodeSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['SHELL100' => 10000, 'ISLAND50' => 5000] as $code => $amount) {
            BonusCode::updateOrCreate(['code' => $code], ['amount' => $amount, 'is_active' => true]);
        }
    }
}

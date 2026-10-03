<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([GameProviderSeeder::class, GameSeeder::class, BonusCodeSeeder::class, TournamentSeeder::class]);
        if (app()->environment('local', 'testing') && ! User::where('email', 'demo@hermit.test')->exists()) {
            $user = User::create(['name' => 'Island Explorer', 'username' => 'islandexplorer', 'email' => 'demo@hermit.test', 'phone' => '+420 777 123 456', 'birth_date' => '1995-06-15', 'password' => Hash::make('IslandDemo123!')]);
            $user->forceFill(['balance' => 125000])->save();
            WalletTransaction::create(['user_id' => $user->id, 'type' => 'deposit', 'amount' => 125000, 'balance_after' => 125000, 'description' => 'Welcome demo credits']);
        }
    }
}

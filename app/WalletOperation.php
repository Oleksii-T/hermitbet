<?php

namespace App;

use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Validation\ValidationException;

class WalletOperation
{
    public function cents(string $amount): int
    {
        $parts = explode('.', $amount);

        return ((int) $parts[0] * 100) + (int) str_pad($parts[1] ?? '', 2, '0');
    }

    public function record(User $user, int $amount, string $type, string $description, ?string $requestId = null): WalletTransaction
    {
        $balanceAfter = $user->balance + $amount;

        if ($balanceAfter < 0) {
            throw ValidationException::withMessages(['amount' => 'Not enough demo credits. Top up your wallet to keep exploring.']);
        }
        $user->balance = $balanceAfter;
        $user->save();

        return WalletTransaction::create([
            'user_id' => $user->id, 'amount' => $amount, 'type' => $type,
            'description' => $description, 'balance_after' => $user->balance, 'request_id' => $requestId,
        ]);
    }
}

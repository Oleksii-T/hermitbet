<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'type', 'amount', 'balance_after', 'description', 'request_id'])]
class WalletTransaction extends Model
{
    /** @return array{amount: 'integer', balance_after: 'integer'} */
    protected function casts(): array
    {
        return ['amount' => 'integer', 'balance_after' => 'integer'];
    }
}

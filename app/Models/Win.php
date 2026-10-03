<?php

namespace App\Models;

use Database\Factories\WinFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['bet_id', 'amount', 'multiplier'])]
class Win extends Model
{
    /** @use HasFactory<WinFactory> */
    use HasFactory;

    /** @return BelongsTo<Bet, $this> */
    public function bet(): BelongsTo
    {
        return $this->belongsTo(Bet::class);
    }
}

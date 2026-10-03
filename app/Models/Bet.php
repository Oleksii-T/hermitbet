<?php

namespace App\Models;

use Database\Factories\BetFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['user_id', 'game_id', 'amount', 'request_id'])]
class Bet extends Model
{
    /** @use HasFactory<BetFactory> */
    use HasFactory;

    /** @return HasOne<Win, $this> */
    public function win(): HasOne
    {
        return $this->hasOne(Win::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Game, $this> */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}

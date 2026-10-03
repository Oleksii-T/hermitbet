<?php

namespace App\Models;

use Database\Factories\GameProviderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'slug', 'symbol'])]
class GameProvider extends Model
{
    /** @use HasFactory<GameProviderFactory> */
    use HasFactory;

    /** @return HasMany<Game, $this> */
    public function games(): HasMany
    {
        return $this->hasMany(Game::class);
    }
}

<?php

namespace App\Models;

use Database\Factories\GameFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['game_provider_id', 'name', 'slug', 'category', 'tags', 'image', 'color', 'is_popular', 'is_featured', 'popularity'])]
class Game extends Model
{
    /** @use HasFactory<GameFactory> */
    use HasFactory;

    /** @return array{tags: 'array', is_popular: 'boolean', is_featured: 'boolean'} */
    protected function casts(): array
    {
        return ['tags' => 'array', 'is_popular' => 'boolean', 'is_featured' => 'boolean'];
    }

    /** @return BelongsTo<GameProvider, $this> */
    public function provider(): BelongsTo
    {
        return $this->belongsTo(GameProvider::class, 'game_provider_id');
    }
}

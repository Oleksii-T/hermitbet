<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'description', 'image', 'prize_pool', 'starts_at', 'ends_at'])]
class Tournament extends Model
{
    /** @return array{starts_at: 'datetime', ends_at: 'datetime'} */
    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'ends_at' => 'datetime'];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['code', 'amount', 'is_active', 'expires_at'])]
class BonusCode extends Model
{
    /** @return array{expires_at: 'datetime', is_active: 'boolean'} */
    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'is_active' => 'boolean'];
    }
}

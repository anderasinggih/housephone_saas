<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Buyer extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'address'
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}

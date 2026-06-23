<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    protected $fillable = [
        'store_id',
        'user_id',
        'start_cash',
        'end_cash',
        'expected_end_cash',
        'difference',
        'status',
        'opened_at',
        'closed_at'
    ];

    protected $casts = [
        'start_cash' => 'decimal:2',
        'end_cash' => 'decimal:2',
        'expected_end_cash' => 'decimal:2',
        'difference' => 'decimal:2',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime'
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function pettyCash(): HasMany
    {
        return $this->hasMany(PettyCash::class);
    }
}

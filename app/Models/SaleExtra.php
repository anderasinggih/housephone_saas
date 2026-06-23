<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleExtra extends Model
{
    protected $fillable = [
        'sale_id',
        'extra_id',
        'charge_to',
        'sell_price',
        'buy_price'
    ];

    protected $casts = [
        'sell_price' => 'decimal:2',
        'buy_price' => 'decimal:2'
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function extra(): BelongsTo
    {
        return $this->belongsTo(Stock::class, 'extra_id');
    }
}

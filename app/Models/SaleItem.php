<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'stock_id',
        'qty',
        'actual_sell_price',
        'buy_price_snap',
        'is_trade_in_item'
    ];

    protected $casts = [
        'qty' => 'integer',
        'actual_sell_price' => 'decimal:2',
        'buy_price_snap' => 'decimal:2',
        'is_trade_in_item' => 'boolean'
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class)->withTrashed();
    }
}

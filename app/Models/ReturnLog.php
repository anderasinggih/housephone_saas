<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnLog extends Model
{
    protected $table = 'returns'; // explicitly use returns

    protected $fillable = [
        'sale_id',
        'stock_id',
        'restocking_fee',
        'refund_amount',
        'notes'
    ];

    protected $casts = [
        'restocking_fee' => 'decimal:2',
        'refund_amount' => 'decimal:2'
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class);
    }
}

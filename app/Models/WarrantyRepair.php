<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarrantyRepair extends Model
{
    protected $fillable = [
        'sale_id',
        'stock_id',
        'damage_description',
        'repair_cost',
        'status',
        'notes',
        'approved_by'
    ];

    protected $casts = [
        'repair_cost' => 'decimal:2'
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}

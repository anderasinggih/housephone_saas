<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MoneyNote extends Model
{
    protected $fillable = [
        'type',
        'amount',
        'category',
        'description',
        'date',
    ];
}

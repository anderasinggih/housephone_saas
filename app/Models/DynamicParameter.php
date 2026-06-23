<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DynamicParameter extends Model
{
    protected $fillable = [
        'category',
        'name'
    ];

    public function values(): HasMany
    {
        return $this->hasMany(DynamicParameterValue::class, 'parameter_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    protected $fillable = [
        'user_id',
        'month',
        'year',
        'basic_salary',
        'commission',
        'allowance',
        'deductions',
        'net_salary',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'commission' => 'decimal:2',
        'allowance' => 'decimal:2',
        'deductions' => 'decimal:2',
        'net_salary' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

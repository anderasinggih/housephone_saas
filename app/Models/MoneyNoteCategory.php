<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MoneyNoteCategory extends Model
{
    protected $fillable = [
        'name',
        'type',
    ];
}

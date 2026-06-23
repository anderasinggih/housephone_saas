<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneralSetting extends Model
{
    protected $fillable = [
        'company_name',
        'work_start_time',
        'work_end_time',
        'grace_period_minutes',
        'geofence_lock_enabled',
        'notification_emails',
    ];
}

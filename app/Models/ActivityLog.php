<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function log(string $action, ?string $modelType = null, ?int $modelId = null, ?array $newValues = null, ?array $oldValues = null): void
    {
        $log = self::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'new_values' => $newValues,
            'old_values' => $oldValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent()
        ]);

        try {
            $settings = \App\Models\GeneralSetting::first();
            if ($settings && !empty($settings->notification_emails)) {
                $emails = array_filter(array_map('trim', explode(',', $settings->notification_emails)));
                if (!empty($emails)) {
                    \Illuminate\Support\Facades\Mail::to($emails)->send(new \App\Mail\TimelineActivityMail($log));
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send timeline email notification: ' . $e->getMessage());
        }
    }
}

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aktivitas Timeline Baru</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #1f2937;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px border #e5e7eb;">
        <!-- Header -->
        <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">
                {{ config('app.name', 'House Phone') }} - Timeline Activity
            </h1>
        </div>

        <!-- Body -->
        <div style="padding: 24px; line-height: 1.6;">
            <p style="font-size: 14px; margin-top: 0; color: #4b5563;">Ada log aktivitas baru yang tercatat di timeline sistem. Berikut adalah rinciannya:</p>

            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #f3f4f6;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold; color: #9ca3af; text-transform: uppercase; width: 120px;">Operator</td>
                        <td style="padding: 6px 0; color: #111827; font-weight: 600;">
                            {{ $activityLog->user ? $activityLog->user->name : 'Sistem / Guest' }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold; color: #9ca3af; text-transform: uppercase;">Aktivitas</td>
                        <td style="padding: 6px 0; color: #4f46e5; font-weight: 700;">
                            {{ $activityLog->action }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold; color: #9ca3af; text-transform: uppercase;">Waktu</td>
                        <td style="padding: 6px 0; color: #111827; font-mono: true;">
                            {{ $activityLog->created_at->setTimezone('Asia/Jakarta')->format('d F Y, H:i') }} WIB
                        </td>
                    </tr>
                    @if($activityLog->model_type)
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold; color: #9ca3af; text-transform: uppercase;">Tipe Data</td>
                        <td style="padding: 6px 0; color: #4b5563;">
                            {{ class_basename($activityLog->model_type) }} (#{{ $activityLog->model_id }})
                        </td>
                    </tr>
                    @endif
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold; color: #9ca3af; text-transform: uppercase;">IP Address</td>
                        <td style="padding: 6px 0; color: #6b7280; font-family: monospace;">
                            {{ $activityLog->ip_address }}
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Changed Values -->
            @if($activityLog->new_values || $activityLog->old_values)
            <div style="margin-top: 24px;">
                <h3 style="font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #111827; text-transform: uppercase;">Detail Perubahan</h3>
                
                @if($activityLog->new_values)
                <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; border-radius: 4px; margin-bottom: 12px; font-size: 12px;">
                    <strong style="color: #065f46; display: block; margin-bottom: 4px;">Data Baru / Perubahan:</strong>
                    <pre style="margin: 0; white-space: pre-wrap; font-family: monospace; color: #047857;">{{ json_encode($activityLog->new_values, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</pre>
                </div>
                @endif

                @if($activityLog->old_values)
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px; font-size: 12px;">
                    <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Data Lama:</strong>
                    <pre style="margin: 0; white-space: pre-wrap; font-family: monospace; color: #b91c1c;">{{ json_encode($activityLog->old_values, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</pre>
                </div>
                @endif
            </div>
            @endif
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af;">
            Email ini dikirim secara otomatis oleh sistem {{ config('app.name', 'House Phone') }}. Harap tidak membalas email ini.
        </div>
    </div>
</body>
</html>

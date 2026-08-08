<?php

namespace App\Mail;

use App\Models\ActivityLog;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TimelineActivityMail extends Mailable
{
    use Queueable, SerializesModels;

    public ActivityLog $activityLog;

    /**
     * Create a new message instance.
     */
    public function __construct(ActivityLog $activityLog)
    {
        $this->activityLog = $activityLog;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $companyName = config('app.name', 'House Phone');
        $actionName = $this->activityLog->action;
        
        $subjectMap = [
            'shift_clock_in' => '🔔 Absen Masuk (Clock-In) Karyawan Baru',
            'shift_clock_out' => '🔒 Absen Keluar (Clock-Out) Shift Kasir',
            'sale_checkout' => '🛍️ Transaksi Penjualan Baru (Checkout)',
            'sale_void' => '⚠️ Pembatalan Transaksi Penjualan (Void)',
            'sale_return' => '🔄 Pengembalian Barang (Return)',
        ];

        $subjectText = $subjectMap[$actionName] ?? "Aktivitas: {$actionName}";

        return new Envelope(
            subject: "[{$companyName}] {$subjectText}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.activity_log_notification',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

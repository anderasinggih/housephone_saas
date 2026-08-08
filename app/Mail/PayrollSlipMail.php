<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PayrollSlipMail extends Mailable
{
    use Queueable, SerializesModels;

    public \App\Models\Payroll $payroll;

    /**
     * Create a new message instance.
     */
    public function __construct(\App\Models\Payroll $payroll)
    {
        $this->payroll = $payroll;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $appName = config('app.name', 'House Phone');
        return new Envelope(
            subject: "[{$appName}] Slip Gaji Periode Bulan {$this->payroll->month}/{$this->payroll->year}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.payroll_slip',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

<?php

namespace App\Mail;

use App\Models\ActivityApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ActivityApplicationSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ActivityApplication $application)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Activity application awaiting admin approval',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.activity-application-submitted',
        );
    }
}
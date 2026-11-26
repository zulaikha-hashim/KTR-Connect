<?php

namespace App\Mail;

use App\Models\ActivityApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ActivityApplicationDecision extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ActivityApplication $application)
    {
    }

    public function envelope(): Envelope
    {
        $decision = $this->application->status === 'approved' ? 'approved' : 'rejected';

        return new Envelope(
            subject: "Activity application {$decision}: " . ($this->application->activity_name ?: 'Untitled activity'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.activity-application-decision',
        );
    }
}

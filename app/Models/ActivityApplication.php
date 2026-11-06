<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityApplication extends Model
{
    protected $fillable = [
        'activity_name',
        'organization',
        'start_at',
        'end_at',
        'venue',
        'expected_turnout',
        'committee_quota',
        'participant_quota',
        'merit_tier',
        'merit_notes',
        'status',
        'proposal_document_path',
    ];

    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'expected_turnout' => 'integer',
            'committee_quota' => 'integer',
            'participant_quota' => 'integer',
        ];
    }

    protected $hidden = [
        'proposal_document_path',
    ];
}

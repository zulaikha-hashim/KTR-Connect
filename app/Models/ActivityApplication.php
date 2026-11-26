<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityApplication extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'activity_name',
        'director_name',
        'academic_year',
        'semester',
        'felo_id',
        'organization',
        'start_at',
        'end_at',
        'venue',
        'google_sheet_url',
        'remarks',
        'latitude',
        'longitude',
        'expected_turnout',
        'committee_quota',
        'participant_quota',
        'merit_tier',
        'merit_notes',
        'status',
        'review_notes',
        'proposal_document_path',
    ];

    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'expected_turnout' => 'integer',
            'committee_quota' => 'integer',
            'participant_quota' => 'integer',
        ];
    }

    protected $hidden = [
        'proposal_document_path',
    ];

    public function felo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'felo_id');
    }

    public function paperworkDocuments(): HasMany
    {
        return $this->hasMany(ActivityApplicationDocument::class);
    }
}

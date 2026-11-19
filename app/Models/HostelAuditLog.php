<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HostelAuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'hostel_restriction_id',
        'hostel_bed_id',
        'hostel_academic_session_id',
        'actor_id',
        'action',
        'previous_state',
        'new_state',
        'reason',
        'occurred_at',
        'batch_reference',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
        ];
    }

    public function restriction(): BelongsTo
    {
        return $this->belongsTo(
            HostelRestriction::class,
            'hostel_restriction_id'
        );
    }

    public function bed(): BelongsTo
    {
        return $this->belongsTo(
            HostelBed::class,
            'hostel_bed_id'
        );
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(
            HostelAcademicSession::class,
            'hostel_academic_session_id'
        );
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'actor_id'
        );
    }
}
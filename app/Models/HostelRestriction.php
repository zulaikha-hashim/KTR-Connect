<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HostelRestriction extends Model
{
    protected $fillable = [
        'reference',
        'hostel_bed_id',
        'hostel_academic_session_id',
        'type',
        'reason',
        'starts_at',
        'created_by',
        'ended_at',
        'ended_by',
        'end_reason',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    public function endedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'ended_by'
        );
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(
            HostelAuditLog::class,
            'hostel_restriction_id'
        );
    }
}
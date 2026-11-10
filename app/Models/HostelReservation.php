<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HostelReservation extends Model
{
    protected $fillable = [
        'reference',
        'user_id',
        'hostel_bed_id',
        'hostel_academic_session_id',
        'status',
        'hold_started_at',
        'hold_expires_at',
        'confirmed_at',
        'released_at',
    ];

    protected function casts(): array
    {
        return [
            'hold_started_at' => 'datetime',
            'hold_expires_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'user_id'
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
}
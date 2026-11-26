<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParticipationImportBatch extends Model
{
    protected $fillable = [
        'academic_session_id', 'type', 'original_filename',
        'activity_name', 'activity_date', 'imported_count', 'duplicate_count', 'invalid_count',
    ];

    protected $casts = ['activity_date' => 'date:Y-m-d'];

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function participations(): HasMany
    {
        return $this->hasMany(StudentParticipation::class, 'import_batch_id');
    }

    public function committees(): HasMany
    {
        return $this->hasMany(StudentCommitteePosition::class, 'import_batch_id');
    }
}

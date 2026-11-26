<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentParticipation extends Model
{
    protected $fillable = ['academic_session_id', 'import_batch_id', 'matric_number', 'student_name', 'activity_name', 'activity_date'];

    protected $casts = ['activity_date' => 'date:Y-m-d'];

    public function importBatch(): BelongsTo
    {
        return $this->belongsTo(ParticipationImportBatch::class, 'import_batch_id');
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }
}

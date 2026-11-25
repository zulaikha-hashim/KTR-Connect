<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusSchedule extends Model
{
    protected $fillable = [
        'title',
        'original_name',
        'file_path',
        'size',
        'academic_session_id',
    ];

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }
}

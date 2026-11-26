<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityParticipation extends Model
{
    protected $fillable = [
        'activity_application_id',
        'academic_year',
        'semester',
        'student_id',
        'student_name',
        'gender',
        'ic_number',
        'phone_number',
        'faculty',
        'current_college',
        'role',
        'student_email',
        'additional_data',
        'merit_allocation',
    ];

    protected function casts(): array
    {
        return [
            'semester' => 'integer',
            'additional_data' => 'array',
            'merit_allocation' => 'integer',
        ];
    }

    public function activityApplication(): BelongsTo
    {
        return $this->belongsTo(ActivityApplication::class);
    }
}

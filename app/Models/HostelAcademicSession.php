<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HostelAcademicSession extends Model
{
    protected $fillable = [
        'name',
        'academic_year',
        'semester',
        'registration_opens_at',
        'registration_closes_at',
    ];

    protected function casts(): array
    {
        return [
            'semester' => 'integer',
            'registration_opens_at' => 'datetime',
            'registration_closes_at' => 'datetime',
        ];
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(
            HostelReservation::class,
            'hostel_academic_session_id'
        );
    }
}
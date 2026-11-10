<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HostelBed extends Model
{
    protected $fillable = [
        'hostel_room_id',
        'label',
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(
            HostelRoom::class,
            'hostel_room_id'
        );
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(
            HostelReservation::class,
            'hostel_bed_id'
        );
    }

    public function restrictions(): HasMany
    {
        return $this->hasMany(
            HostelRestriction::class,
            'hostel_bed_id'
        );
    }
}
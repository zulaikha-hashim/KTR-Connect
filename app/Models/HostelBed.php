<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
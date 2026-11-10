<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HostelRoom extends Model
{
    protected $fillable = [
        'hostel_block_id',
        'room_number',
        'floor_level',
        'wing',
        'category',
        'floor_area_sqm',
        'mattress_width_cm',
        'mattress_length_cm',
        'ceiling_height_m',
        'amenities',
        'sample_photo_path',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'floor_level' => 'integer',
            'floor_area_sqm' => 'decimal:2',
            'mattress_width_cm' => 'integer',
            'mattress_length_cm' => 'integer',
            'ceiling_height_m' => 'decimal:2',
            'amenities' => 'array',
        ];
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(
            HostelBlock::class,
            'hostel_block_id'
        );
    }

    public function beds(): HasMany
    {
        return $this->hasMany(
            HostelBed::class,
            'hostel_room_id'
        );
    }
}
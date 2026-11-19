<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeritType extends Model
{
    protected $fillable = [
        'name',
        'code',
        'points',
        'badge_color',
        'criteria',
        'semester_cap',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'points' => 'integer',
        'semester_cap' => 'integer',
    ];
}

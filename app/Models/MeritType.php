<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeritType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'points',
        'badge_color',
    ];

    protected $casts = [
        'points' => 'integer',
    ];
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class AcademicSession extends Model
{
    protected $table = 'academic_sessions';

    protected $fillable = [
        'name',
        'is_current',
    ];

    protected $casts = [
        'is_current' => 'boolean',
    ];

    public function picDirectories(): BelongsToMany
    {
        return $this->belongsToMany(
            PicDirectory::class,
            'pic_directory_academic_session',
            'academic_session_id',
            'pic_directory_id'
        )->withTimestamps();
    }
}

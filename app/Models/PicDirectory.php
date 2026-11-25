<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PicDirectory extends Model
{
    protected $table = 'pic_directory';

    protected $fillable = [
        'photo_path',
        'name',
        'contact_number',
        'email',
        'role',
    ];

    public function academicSessions(): BelongsToMany
    {
        return $this->belongsToMany(
            AcademicSession::class,
            'pic_directory_academic_session',
            'pic_directory_id',
            'academic_session_id'
        )->withTimestamps();
    }

}

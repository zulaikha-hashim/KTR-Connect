<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}

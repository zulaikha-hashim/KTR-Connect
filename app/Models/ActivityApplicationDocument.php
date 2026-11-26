<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityApplicationDocument extends Model
{
    protected $fillable = [
        'activity_application_id',
        'original_name',
        'file_path',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(ActivityApplication::class, 'activity_application_id');
    }
}

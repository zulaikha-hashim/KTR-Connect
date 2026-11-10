<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HostelBlock extends Model
{
    protected $fillable = [
        'code',
        'name',
        'residential_zone',
    ];

    public function rooms(): HasMany
    {
        return $this->hasMany(
            HostelRoom::class,
            'hostel_block_id'
        );
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatbotInfo extends Model
{
    use HasFactory;

    protected $fillable = [
        'content_id',
        'category',
        'target_audience',
        'title',
        'keywords',
        'content',
        'admin_id',
        'status',
    ];
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotInfoLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'chatbot_info_id',
        'action',
        'status',
        'admin_id',
        'created_at',
    ];
}

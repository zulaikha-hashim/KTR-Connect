<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chatbot_infos', function (Blueprint $table) {
            $table->json('faqs')->nullable();
        });

        Schema::create('chatbot_info_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chatbot_info_id')->constrained()->cascadeOnDelete();
            $table->string('action');
            $table->string('status');
            $table->string('admin_id')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chatbot_info_logs');

        Schema::table('chatbot_infos', function (Blueprint $table) {
            $table->dropColumn('faqs');
        });
    }
};

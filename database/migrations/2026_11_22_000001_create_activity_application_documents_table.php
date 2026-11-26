<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_application_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_application_id')
                ->constrained('activity_applications')
                ->cascadeOnDelete();
            $table->string('original_name');
            $table->string('file_path');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_application_documents');
    }
};

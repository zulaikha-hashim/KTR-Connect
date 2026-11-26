<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_participations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_application_id')->constrained()->cascadeOnDelete();
            $table->string('academic_year', 9);
            $table->unsignedTinyInteger('semester');
            $table->string('student_id', 64);
            $table->string('student_name');
            $table->string('student_email')->nullable();
            $table->json('additional_data')->nullable();
            $table->unsignedSmallInteger('merit_allocation');
            $table->timestamps();

            $table->unique(
                ['activity_application_id', 'academic_year', 'semester', 'student_id'],
                'activity_participations_activity_session_student_unique',
            );
            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_participations');
    }
};

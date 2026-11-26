<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_participations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_session_id')->constrained('academic_sessions')->restrictOnDelete();
            $table->string('matric_number', 40);
            $table->string('student_name');
            $table->string('activity_name');
            $table->date('activity_date');
            $table->timestamps();
            $table->unique(['academic_session_id', 'matric_number', 'activity_name', 'activity_date'], 'participation_unique_record');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_participations');
    }
};

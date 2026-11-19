<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hostel_student_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('matric_number', 20)->unique();

            $table->string('faculty', 120);

            $table->enum('gender', [
                'male',
                'female',
            ]);

            // Identifies these records as simulation data.
            $table->string('source', 40)
                ->default('mock_utmdigital');

            $table->dateTime('synced_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hostel_student_profiles');
    }
};
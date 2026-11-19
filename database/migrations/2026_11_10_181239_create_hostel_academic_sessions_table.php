<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hostel_academic_sessions', function (Blueprint $table) {
            $table->id();

            $table->string('name', 100);
            $table->string('academic_year', 9);
            $table->unsignedTinyInteger('semester');

            $table->dateTime('registration_opens_at')->nullable();
            $table->dateTime('registration_closes_at')->nullable();

            $table->timestamps();

            $table->unique(['academic_year', 'semester']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hostel_academic_sessions');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hostel_restrictions', function (Blueprint $table) {
            $table->id();

            $table->string('reference', 40)->unique();

            $table->foreignId('hostel_bed_id')
                ->constrained('hostel_beds')
                ->restrictOnDelete();

            $table->foreignId('hostel_academic_session_id')
                ->nullable()
                ->constrained('hostel_academic_sessions')
                ->restrictOnDelete();

            $table->enum('type', [
                'maintenance',
                'administrative_block',
            ]);

            $table->text('reason');
            $table->dateTime('starts_at');

            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->dateTime('ended_at')->nullable();

            $table->foreignId('ended_by')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();

            $table->text('end_reason')->nullable();

            $table->timestamps();

            $table->index(
                [
                    'hostel_bed_id',
                    'hostel_academic_session_id',
                    'ended_at',
                ],
                'hostel_restrictions_bed_session_end'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hostel_restrictions');
    }
};
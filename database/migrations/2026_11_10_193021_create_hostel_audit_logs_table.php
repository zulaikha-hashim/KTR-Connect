<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hostel_audit_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('hostel_restriction_id')
                ->constrained('hostel_restrictions')
                ->restrictOnDelete();

            $table->foreignId('hostel_bed_id')
                ->constrained('hostel_beds')
                ->restrictOnDelete();

            $table->foreignId('hostel_academic_session_id')
                ->nullable()
                ->constrained('hostel_academic_sessions')
                ->restrictOnDelete();

            $table->foreignId('actor_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->enum('action', [
                'restricted',
                'restored',
            ]);

            $table->enum('previous_state', [
                'available',
                'unavailable',
            ]);

            $table->enum('new_state', [
                'available',
                'unavailable',
            ]);

            $table->text('reason');
            $table->dateTime('occurred_at');

            $table->uuid('batch_reference')->nullable()->index();

            $table->index(
                ['hostel_bed_id', 'occurred_at'],
                'hostel_audit_bed_time'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hostel_audit_logs');
    }
};
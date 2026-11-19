<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hostel_reservations', function (Blueprint $table) {
            $table->id();

            $table->string('reference', 40)->unique();

            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('hostel_bed_id')
                ->constrained('hostel_beds')
                ->restrictOnDelete();

            $table->foreignId('hostel_academic_session_id')
                ->constrained('hostel_academic_sessions')
                ->restrictOnDelete();

            $table->enum('status', [
                'held',
                'confirmed',
                'expired',
                'released',
            ]);

            $table->dateTime('hold_started_at');
            $table->dateTime('hold_expires_at');

            $table->dateTime('confirmed_at')->nullable();
            $table->dateTime('released_at')->nullable();

            $table->unsignedTinyInteger('active_slot')
                ->nullable()
                ->storedAs(
                    "CASE WHEN status IN ('held', 'confirmed') THEN 1 ELSE NULL END"
                );

            $table->timestamps();

            $table->unique(
                [
                    'hostel_bed_id',
                    'hostel_academic_session_id',
                    'active_slot',
                ],
                'hostel_res_bed_session_active'
            );

            $table->unique(
                [
                    'user_id',
                    'hostel_academic_session_id',
                    'active_slot',
                ],
                'hostel_res_user_session_active'
            );

            $table->index(
                ['status', 'hold_expires_at'],
                'hostel_res_status_expiry'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hostel_reservations');
    }
};
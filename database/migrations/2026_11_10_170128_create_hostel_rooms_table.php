<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hostel_rooms', function (Blueprint $table) {
            $table->id();

            $table->foreignId('hostel_block_id')
                ->constrained('hostel_blocks')
                ->restrictOnDelete();

            $table->string('room_number', 40)->unique();
            $table->unsignedTinyInteger('floor_level');
            $table->string('wing', 20)->nullable();

            $table->enum('category', [
                'single_standard',
                'single_attached_bathroom',
                'double_sharing',
            ]);

            $table->decimal('floor_area_sqm', 6, 2)->nullable();
            $table->unsignedSmallInteger('mattress_width_cm')->nullable();
            $table->unsignedSmallInteger('mattress_length_cm')->nullable();
            $table->decimal('ceiling_height_m', 4, 2)->nullable();

            $table->json('amenities')->nullable();
            $table->string('sample_photo_path')->nullable();
            $table->text('description')->nullable();

            $table->timestamps();

            $table->index(['hostel_block_id', 'floor_level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hostel_rooms');
    }
};
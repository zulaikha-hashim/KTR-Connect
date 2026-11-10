<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hostel_beds', function (Blueprint $table) {
            $table->id();

            $table->foreignId('hostel_room_id')
                ->constrained('hostel_rooms')
                ->restrictOnDelete();

            $table->string('label', 10);

            $table->timestamps();

            $table->unique(['hostel_room_id', 'label']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hostel_beds');
    }
};
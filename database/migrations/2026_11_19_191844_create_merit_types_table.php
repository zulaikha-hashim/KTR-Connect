<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('merit_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Merit Merah (Red merit)
            $table->string('code')->unique(); // MRT-RED-02
            $table->integer('points'); // 2 or 1
            $table->string('badge_color')->default('crimson'); // crimson or blue
            $table->text('criteria')->nullable(); // Eligibility scope & activity criteria
            $table->integer('semester_cap')->nullable(); // Null = Uncapped
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('merit_types');
    }
};

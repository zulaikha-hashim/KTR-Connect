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
   Schema::create('chatbot_infos', function (Blueprint $table) {
    $table->id();
    $table->string('content_id')->default('INFO-KTR-001');
    $table->string('category')->default('Registration Guidelines');
    $table->string('target_audience')->default('All Undergraduate Residents');
    $table->string('title');
    $table->text('keywords')->nullable(); // e.g. registration, guidelines, room booking
    $table->text('content');
    $table->string('admin_id')->default('En. Razak'); // Tracks admin who last updated
    $table->string('status')->default('pending');
    $table->timestamps();
});
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chatbot_infos');
    }
};

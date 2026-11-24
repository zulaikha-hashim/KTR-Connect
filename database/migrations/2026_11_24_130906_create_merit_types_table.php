<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merit_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->unsignedInteger('points')->default(2);
            $table->string('badge_color')->default('red');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merit_types');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pic_directory', function (Blueprint $table) {
            $table->id();
            $table->string('photo_path');
            $table->string('name');
            $table->string('contact_number', 30);
            $table->string('email')->unique();
            $table->string('role', 100);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pic_directory');
    }
};

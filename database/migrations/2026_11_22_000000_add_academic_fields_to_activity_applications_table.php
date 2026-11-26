<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_applications', function (Blueprint $table) {
            $table->string('academic_year', 9)->nullable()->after('director_name');
            $table->unsignedTinyInteger('semester')->nullable()->after('academic_year');
        });
    }

    public function down(): void
    {
        Schema::table('activity_applications', function (Blueprint $table) {
            $table->dropColumn(['semester', 'academic_year']);
        });
    }
};

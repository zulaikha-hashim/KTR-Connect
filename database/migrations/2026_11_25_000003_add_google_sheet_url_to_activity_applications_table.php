<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_applications', function (Blueprint $table) {
            $table->text('google_sheet_url')->nullable()->after('venue');
        });
    }

    public function down(): void
    {
        Schema::table('activity_applications', function (Blueprint $table) {
            $table->dropColumn('google_sheet_url');
        });
    }
};

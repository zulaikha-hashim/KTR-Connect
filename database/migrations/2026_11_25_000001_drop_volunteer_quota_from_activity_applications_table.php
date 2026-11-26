<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('activity_applications', 'volunteer_quota')) {
            Schema::table('activity_applications', function (Blueprint $table) {
                $table->dropColumn('volunteer_quota');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('activity_applications', 'volunteer_quota')) {
            Schema::table('activity_applications', function (Blueprint $table) {
                $table->unsignedInteger('volunteer_quota')->nullable()->after('participant_quota');
            });
        }
    }
};

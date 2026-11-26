<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasIcNumber = Schema::hasColumn('activity_participations', 'ic_number');
        $hasPhoneNumber = Schema::hasColumn('activity_participations', 'phone_number');
        $hasFaculty = Schema::hasColumn('activity_participations', 'faculty');
        $hasCurrentCollege = Schema::hasColumn('activity_participations', 'current_college');

        Schema::table('activity_participations', function (Blueprint $table) use (
            $hasIcNumber,
            $hasPhoneNumber,
            $hasFaculty,
            $hasCurrentCollege,
        ) {
            $table->string('student_id', 64)->nullable()->change();
            $table->string('student_name')->nullable()->change();
            if (! $hasIcNumber) {
                $table->string('ic_number', 32)->nullable();
            }
            if (! $hasPhoneNumber) {
                $table->string('phone_number', 32)->nullable();
            }
            if (! $hasFaculty) {
                $table->string('faculty')->nullable();
            }
            if (! $hasCurrentCollege) {
                $table->string('current_college')->nullable();
            }
        });
    }

    public function down(): void
    {
        DB::table('activity_participations')
            ->whereNull('student_id')
            ->orderBy('id')
            ->get(['id'])
            ->each(fn ($record) => DB::table('activity_participations')
                ->where('id', $record->id)
                ->update(['student_id' => 'MISSING-' . $record->id]));

        DB::table('activity_participations')
            ->whereNull('student_name')
            ->update(['student_name' => '']);

        Schema::table('activity_participations', function (Blueprint $table) {
            $table->dropColumn(['ic_number', 'phone_number', 'faculty', 'current_college']);
            $table->string('student_id', 64)->nullable(false)->change();
            $table->string('student_name')->nullable(false)->change();
        });
    }
};

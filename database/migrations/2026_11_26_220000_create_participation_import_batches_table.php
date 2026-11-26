<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('participation_import_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_session_id')->constrained('academic_sessions')->restrictOnDelete();
            $table->string('type', 20); // participation or committee
            $table->string('original_filename');
            $table->string('activity_name');
            $table->date('activity_date');
            $table->unsignedInteger('imported_count')->default(0);
            $table->unsignedInteger('duplicate_count')->default(0);
            $table->unsignedInteger('invalid_count')->default(0);
            $table->timestamps();
        });

        Schema::table('student_participations', function (Blueprint $table) {
            $table->foreignId('import_batch_id')->nullable()
                ->constrained('participation_import_batches')->nullOnDelete();
        });
        Schema::table('student_committee_positions', function (Blueprint $table) {
            $table->foreignId('import_batch_id')->nullable()
                ->constrained('participation_import_batches')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('student_committee_positions', fn (Blueprint $table) => $table->dropConstrainedForeignId('import_batch_id'));
        Schema::table('student_participations', fn (Blueprint $table) => $table->dropConstrainedForeignId('import_batch_id'));
        Schema::dropIfExists('participation_import_batches');
    }
};

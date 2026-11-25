<?php

use App\Models\PicDirectory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_current')->default(false);
            $table->timestamps();
        });

        // Use the table configured by your existing model.
        $picTable = (new PicDirectory())->getTable();

        Schema::create('pic_directory_academic_session', function (Blueprint $table) use ($picTable) {
            $table->id();

            $table->foreignId('pic_directory_id')
                ->constrained($picTable)
                ->cascadeOnDelete();

            $table->foreignId('academic_session_id')
                ->constrained('academic_sessions')
                ->cascadeOnDelete();

            $table->unique([
                'pic_directory_id',
                'academic_session_id'
            ]);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pic_directory_academic_session');
        Schema::dropIfExists('academic_sessions');
    }
};

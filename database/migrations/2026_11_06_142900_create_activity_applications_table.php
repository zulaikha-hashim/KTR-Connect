<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_applications', function (Blueprint $table) {
            $table->id();
            $table->string('activity_name')->nullable();
            $table->string('organization')->nullable();
            $table->dateTime('start_at')->nullable();
            $table->dateTime('end_at')->nullable();
            $table->string('venue')->nullable();
            $table->unsignedInteger('expected_turnout')->nullable();
            $table->unsignedInteger('committee_quota')->nullable();
            $table->unsignedInteger('participant_quota')->nullable();
            $table->string('merit_tier')->nullable();
            $table->text('merit_notes')->nullable();
            $table->string('proposal_document_path')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_applications');
    }
};

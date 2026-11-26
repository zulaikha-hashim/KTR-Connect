<?php

namespace App\Console\Commands;

use App\Models\StudentCommitteePosition;
use App\Models\StudentParticipation;
use App\Support\ParticipationText;
use Illuminate\Console\Command;
use Illuminate\Database\UniqueConstraintViolationException;

class NormalizeParticipationRecords extends Command
{
    protected $signature = 'participation:normalize {--apply : Save changes (otherwise preview only)}';
    protected $description = 'Standardize old student and activity capitalization in both participation tables';

    public function handle(): int
    {
        $changed = $skipped = 0;
        foreach ([StudentParticipation::class, StudentCommitteePosition::class] as $model) {
            $this->info(class_basename($model));
            $model::query()->orderBy('id')->chunkById(200, function ($records) use (&$changed, &$skipped, $model) {
                foreach ($records as $record) {
                    $name = ParticipationText::normalize($record->student_name);
                    $activity = ParticipationText::normalize($record->activity_name, true);
                    if ($name === $record->student_name && $activity === $record->activity_name) continue;
                    $this->line("#{$record->id}: {$record->student_name} / {$record->activity_name} => {$name} / {$activity}");
                    $changed++;
                    if (!$this->option('apply')) continue;
                    // Skip rows that would become duplicates after activity name normalization.
                    $clash = $model::query()
                        ->where('academic_session_id', $record->academic_session_id)
                        ->where('matric_number', $record->matric_number)
                        ->where('activity_name', $activity)
                        ->whereDate('activity_date', $record->activity_date)
                        ->whereKeyNot($record->id)
                        ->exists();
                    if ($clash) { $skipped++; $this->warn("Skipped conflicting record #{$record->id}"); continue; }
                    try {
                        $record->update(['student_name' => $name, 'activity_name' => $activity]);
                    } catch (UniqueConstraintViolationException $e) {
                        $skipped++; $this->warn("Skipped conflicting record #{$record->id}");
                    }
                }
            });
        }
        $this->info("{$changed} row(s) need normalization; {$skipped} conflict(s) skipped. ".($this->option('apply') ? 'Changes saved.' : 'Dry run only; use --apply to save.'));
        return self::SUCCESS;
    }
}

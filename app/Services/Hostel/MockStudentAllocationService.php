<?php

namespace App\Services\Hostel;

use App\Models\HostelAcademicSession;
use App\Models\HostelBed;
use App\Models\HostelReservation;
use App\Models\HostelRestriction;
use App\Models\HostelStudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MockStudentAllocationService
{
    public function allocate(
        int $studentProfileId,
        int $academicSessionId,
        int $bedId
    ): HostelReservation {
        abort_unless(app()->environment('local'), 403);

        return DB::transaction(function () use (
            $studentProfileId,
            $academicSessionId,
            $bedId
        ) {
            // Lock the profile before its user, matching the import service.
            $profile = HostelStudentProfile::query()
                ->where('source', 'mock_utmdigital')
                ->lockForUpdate()
                ->findOrFail($studentProfileId);

            $student = User::query()
                ->lockForUpdate()
                ->findOrFail($profile->user_id);

            $academicSession = HostelAcademicSession::query()
                ->findOrFail($academicSessionId);

            // Availability changes also lock the bed before modifying it.
            $bed = HostelBed::query()
                ->lockForUpdate()
                ->findOrFail($bedId);

            $bed->load('room.block');

            $block = $bed->room?->block;

            if ($block === null) {
                throw ValidationException::withMessages([
                    'hostel_bed_id' =>
                        'This bed does not have a valid room and block.',
                ]);
            }

            if ($block->residential_zone !== $profile->gender) {
                throw ValidationException::withMessages([
                    'hostel_bed_id' =>
                        'Choose a bed in a block matching the student’s gender.',
                ]);
            }

            $asOf = now()->utc();

            $hasRestriction = HostelRestriction::query()
                ->where('hostel_bed_id', $bed->id)
                ->whereNull('ended_at')
                ->where('starts_at', '<=', $asOf)
                ->where(function ($query) use ($academicSession) {
                    $query->whereNull('hostel_academic_session_id')
                        ->orWhere(
                            'hostel_academic_session_id',
                            $academicSession->id
                        );
                })
                ->exists();

            if ($hasRestriction) {
                throw ValidationException::withMessages([
                    'hostel_bed_id' =>
                        'This bed has an active restriction for this session.',
                ]);
            }

            $studentHasAllocation = HostelReservation::query()
                ->where('user_id', $student->id)
                ->where(
                    'hostel_academic_session_id',
                    $academicSession->id
                )
                ->whereIn('status', ['held', 'confirmed'])
                ->exists();

            if ($studentHasAllocation) {
                throw ValidationException::withMessages([
                    'student_profile_id' =>
                        'This student already has a booking or hold in this session.',
                ]);
            }

            $bedHasAllocation = HostelReservation::query()
                ->where('hostel_bed_id', $bed->id)
                ->where(
                    'hostel_academic_session_id',
                    $academicSession->id
                )
                ->whereIn('status', ['held', 'confirmed'])
                ->exists();

            if ($bedHasAllocation) {
                throw ValidationException::withMessages([
                    'hostel_bed_id' =>
                        'This bed already has a booking or hold in this session.',
                ]);
            }

            return HostelReservation::query()->create([
                'reference' => 'SIM-' . Str::uuid(),
                'user_id' => $student->id,
                'hostel_bed_id' => $bed->id,
                'hostel_academic_session_id' => $academicSession->id,
                'status' => 'confirmed',

                // Required columns: this simulation confirms immediately.
                'hold_started_at' => $asOf,
                'hold_expires_at' => $asOf,
                'confirmed_at' => $asOf,
                'released_at' => null,
            ]);
        }, 3);
    }
}
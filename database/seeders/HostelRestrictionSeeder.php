<?php

namespace Database\Seeders;

use App\Models\HostelAcademicSession;
use App\Models\HostelAuditLog;
use App\Models\HostelBed;
use App\Models\HostelReservation;
use App\Models\HostelRestriction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class HostelRestrictionSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            throw new \RuntimeException(
                'This sample restriction seeder is for local development only.'
            );
        }

        DB::transaction(function () {
            $session = HostelAcademicSession::query()
                ->where('academic_year', '2026/2027')
                ->where('semester', 1)
                ->firstOrFail();

            // Demonstration identity only; this does not grant Admin access.
            $actor = User::firstOrCreate(
                [
                    'email' => 'hostel-demo-admin@example.invalid',
                ],
                [
                    'name' => 'Demo Hostel Administrator',
                    'password' => Hash::make(Str::random(40)),
                ]
            );

            $samples = [
                [
                    'reference' => 'DEMO-MAINT-K11-01-105-A',
                    'room' => 'K11-01-105',
                    'bed' => 'A',
                    'type' => 'maintenance',
                    'session_id' => null,
                    'reason' => 'Demo: Ceiling fan repair.',
                ],
                [
                    'reference' => 'DEMO-ADMIN-S1-K11-02-216-B',
                    'room' => 'K11-02-216',
                    'bed' => 'B',
                    'type' => 'administrative_block',
                    'session_id' => $session->id,
                    'reason' => 'Demo: Temporarily withheld from registration.',
                ],
            ];

            foreach ($samples as $sample) {
                $bed = HostelBed::query()
                    ->where('label', $sample['bed'])
                    ->whereHas('room', function ($query) use ($sample) {
                        $query->where(
                            'room_number',
                            $sample['room']
                        );
                    })
                    ->lockForUpdate()
                    ->firstOrFail();

                $restriction = HostelRestriction::query()
                    ->where('reference', $sample['reference'])
                    ->first();

                if (! $restriction) {
                    $now = now()->utc();

                    $hasBooking = HostelReservation::query()
                        ->where('hostel_bed_id', $bed->id)
                        ->when(
                            $sample['session_id'] !== null,
                            fn ($query) => $query->where(
                                'hostel_academic_session_id',
                                $sample['session_id']
                            )
                        )
                        ->where(function ($query) use ($now) {
                            $query->where('status', 'confirmed')
                                ->orWhere(function ($query) use ($now) {
                                    $query->where('status', 'held')
                                        ->where(
                                            'hold_expires_at',
                                            '>',
                                            $now
                                        );
                                });
                        })
                        ->exists();

                    if ($hasBooking) {
                        throw new \RuntimeException(
                            "Cannot seed restriction: {$sample['room']} "
                            . "Bed {$sample['bed']} has an active booking."
                        );
                    }

                    $hasRestriction = HostelRestriction::query()
                        ->where('hostel_bed_id', $bed->id)
                        ->whereNull('ended_at')
                        ->where('starts_at', '<=', $now)
                        ->when(
                            $sample['session_id'] !== null,
                            function ($query) use ($sample) {
                                $query->where(function ($query) use ($sample) {
                                    $query
                                        ->whereNull(
                                            'hostel_academic_session_id'
                                        )
                                        ->orWhere(
                                            'hostel_academic_session_id',
                                            $sample['session_id']
                                        );
                                });
                            }
                        )
                        ->exists();

                    if ($hasRestriction) {
                        throw new \RuntimeException(
                            "Cannot seed restriction: {$sample['room']} "
                            . "Bed {$sample['bed']} is already restricted."
                        );
                    }

                    $restriction = HostelRestriction::create([
                        'reference' => $sample['reference'],
                        'hostel_bed_id' => $bed->id,
                        'hostel_academic_session_id' => $sample['session_id'],
                        'type' => $sample['type'],
                        'reason' => $sample['reason'],
                        'starts_at' => $now,
                        'created_by' => $actor->id,
                    ]);
                }

                HostelAuditLog::firstOrCreate(
                    [
                        'hostel_restriction_id' => $restriction->id,
                        'action' => 'restricted',
                    ],
                    [
                        'hostel_bed_id' => $restriction->hostel_bed_id,
                        'hostel_academic_session_id' =>
                            $restriction->hostel_academic_session_id,
                        'actor_id' => $restriction->created_by,
                        'previous_state' => 'available',
                        'new_state' => 'unavailable',
                        'reason' => $restriction->reason,
                        'occurred_at' => $restriction->starts_at,
                    ]
                );
            }
        });
    }
}
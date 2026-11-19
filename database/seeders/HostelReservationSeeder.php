<?php

namespace Database\Seeders;

use App\Models\HostelAcademicSession;
use App\Models\HostelBed;
use App\Models\HostelReservation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class HostelReservationSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            throw new \RuntimeException(
                'This sample reservation seeder is for local development only.'
            );
        }

        DB::transaction(function () {
            $session = HostelAcademicSession::query()
                ->where('academic_year', '2026/2027')
                ->where('semester', 1)
                ->firstOrFail();

            // Fictional development accounts and allocations.
            $allocations = [
                [
                    'name' => 'Irfan Hakim',
                    'email' => 'hostel-demo-irfan@example.invalid',
                    'room' => 'K11-03-314',
                    'bed' => 'A',
                    'reference' => 'DEMO-S1-K11-03-314-A',
                ],
                [
                    'name' => 'Muhammad Afiq',
                    'email' => 'hostel-demo-afiq@example.invalid',
                    'room' => 'K11-03-314',
                    'bed' => 'B',
                    'reference' => 'DEMO-S1-K11-03-314-B',
                ],
                [
                    'name' => 'Ahmad Danish',
                    'email' => 'hostel-demo-danish@example.invalid',
                    'room' => 'K11-02-214',
                    'bed' => 'A',
                    'reference' => 'DEMO-S1-K11-02-214-A',
                ],
            ];

            foreach ($allocations as $allocation) {
                $bed = HostelBed::query()
                    ->where('label', $allocation['bed'])
                    ->whereHas('room', function ($query) use ($allocation) {
                        $query->where(
                            'room_number',
                            $allocation['room']
                        );
                    })
                    ->firstOrFail();

                $student = User::firstOrCreate(
                    ['email' => $allocation['email']],
                    [
                        'name' => $allocation['name'],
                        'password' => Hash::make(Str::random(40)),
                    ]
                );

                $confirmedAt = now()->utc()->subDay();
                $holdStartedAt = $confirmedAt->copy()->subSeconds(60);
                $holdExpiresAt = $holdStartedAt->copy()->addSeconds(180);

                HostelReservation::firstOrCreate(
                    ['reference' => $allocation['reference']],
                    [
                        'user_id' => $student->id,
                        'hostel_bed_id' => $bed->id,
                        'hostel_academic_session_id' => $session->id,
                        'status' => 'confirmed',
                        'hold_started_at' => $holdStartedAt,
                        'hold_expires_at' => $holdExpiresAt,
                        'confirmed_at' => $confirmedAt,
                    ]
                );
            }
        });
    }
}
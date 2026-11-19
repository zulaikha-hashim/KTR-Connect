<?php

namespace App\Services\Hostel;

use App\Models\HostelReservation;
use App\Models\HostelStudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use JsonException;

class MockStudentImportService
{
    public function preview(): array
    {
        $source = $this->readSource();

        return [
            'source' => 'mock_utmdigital',
            'hash' => $source['hash'],
            'total' => count($source['students']),
            'students' => $source['students'],
        ];
    }

    public function import(string $expectedHash): array
    {
        $source = $this->readSource();

        // Require another preview if the source file has changed.
        if (!hash_equals($source['hash'], $expectedHash)) {
            throw ValidationException::withMessages([
                'simulation' =>
                    'The source file changed. Refresh the preview before importing.',
            ]);
        }

        return DB::transaction(function () use ($source) {
            $counts = [
                'created' => 0,
                'updated' => 0,
                'unchanged' => 0,
            ];

            foreach ($source['students'] as $student) {
                $profile = HostelStudentProfile::query()
                    ->where('matric_number', $student['matric_number'])
                    ->lockForUpdate()
                    ->first();

                $isNew = $profile === null;

                if ($profile !== null) {
                    if ($profile->source !== 'mock_utmdigital') {
                        throw ValidationException::withMessages([
                            'simulation' =>
                                'This import cannot overwrite a student '
                                . 'from another source: '
                                . $student['matric_number'],
                        ]);
                    }

                    $user = User::query()
                        ->whereKey($profile->user_id)
                        ->lockForUpdate()
                        ->firstOrFail();

                    $this->checkGenderChange($profile, $student);
                } else {
                    // Internal placeholder required by the existing users table.
                    // This address is not supplied by UTMDigital.
                    $email = strtolower($student['matric_number'])
                        . '@mock-utmdigital.example.invalid';

                    if (User::query()->where('email', $email)->exists()) {
                        throw ValidationException::withMessages([
                            'simulation' =>
                                'A conflicting user record already exists for '
                                . $student['matric_number']
                                . '. No student data was imported.',
                        ]);
                    }

                    $user = User::create([
                        'name' => $student['full_name'],
                        'email' => $email,
                        'password' => Str::random(64),
                    ]);

                    $profile = new HostelStudentProfile([
                        'user_id' => $user->id,
                    ]);
                }

                $user->name = $student['full_name'];

                $profile->fill([
                    'matric_number' => $student['matric_number'],
                    'faculty' => $student['faculty'],
                    'gender' => $student['gender'],
                    'source' => 'mock_utmdigital',
                ]);

                // Check actual student-field changes before updating sync time.
                $hasChanges = $user->isDirty('name')
                    || $profile->isDirty();

                $user->save();

                $profile->synced_at = now()->utc();
                $profile->save();

                if ($isNew) {
                    $counts['created']++;
                } elseif ($hasChanges) {
                    $counts['updated']++;
                } else {
                    $counts['unchanged']++;
                }
            }

            return [
                ...$counts,
                'total' => count($source['students']),
            ];
        });
    }

    private function readSource(): array
    {
        $path = resource_path(
            'data/hostel/mock_utmdigital_students.json'
        );

        if (!File::exists($path)) {
            throw ValidationException::withMessages([
                'simulation' => 'The mock student source file was not found.',
            ]);
        }

        $contents = File::get($path);

        try {
            $payload = json_decode(
                $contents,
                true,
                512,
                JSON_THROW_ON_ERROR
            );
        } catch (JsonException) {
            throw ValidationException::withMessages([
                'simulation' =>
                    'The mock student file contains invalid JSON.',
            ]);
        }

        if (!is_array($payload)) {
            throw ValidationException::withMessages([
                'simulation' =>
                    'The mock student file must contain a JSON object.',
            ]);
        }

        // Normalise text before checking required values and duplicates.
        if (
            isset($payload['students'])
            && is_array($payload['students'])
        ) {
            foreach ($payload['students'] as &$student) {
                if (!is_array($student)) {
                    continue;
                }

                foreach (
                    ['matric_number', 'full_name', 'faculty', 'gender']
                    as $field
                ) {
                    if (
                        isset($student[$field])
                        && is_string($student[$field])
                    ) {
                        $student[$field] = trim($student[$field]);
                    }
                }

                if (is_string($student['matric_number'] ?? null)) {
                    $student['matric_number'] = strtoupper(
                        $student['matric_number']
                    );
                }

                if (is_string($student['gender'] ?? null)) {
                    $student['gender'] = strtolower($student['gender']);
                }
            }

            unset($student);
        }

        $validated = Validator::make($payload, [
            'source' => [
                'required',
                'in:mock_utmdigital',
            ],
            'students' => [
                'required',
                'array',
                'list',
                'min:1',
                'max:100',
            ],
            'students.*' => [
                'required',
                'array:matric_number,full_name,faculty,gender',
            ],
            'students.*.matric_number' => [
                'required',
                'string',
                'max:20',
                'regex:/^SIM[0-9]{4,}$/',
                'distinct',
            ],
            'students.*.full_name' => [
                'required',
                'string',
                'max:255',
            ],
            'students.*.faculty' => [
                'required',
                'string',
                'max:120',
            ],
            'students.*.gender' => [
                'required',
                'in:male,female',
            ],
        ])->validate();

        return [
            'hash' => hash('sha256', $contents),
            'students' => $validated['students'],
        ];
    }

    private function checkGenderChange(
        HostelStudentProfile $profile,
        array $student
    ): void {
        if ($profile->gender === $student['gender']) {
            return;
        }

        $now = now()->utc();

        $hasConflictingBooking = HostelReservation::query()
            ->where('user_id', $profile->user_id)
            ->where(function ($query) use ($now) {
                $query
                    ->where('status', 'confirmed')
                    ->orWhere(function ($query) use ($now) {
                        $query
                            ->where('status', 'held')
                            ->where('hold_expires_at', '>', $now);
                    });
            })
            ->whereHas('bed.room.block', function ($query) use ($student) {
                $query->where(
                    'residential_zone',
                    '!=',
                    $student['gender']
                );
            })
            ->exists();

        if ($hasConflictingBooking) {
            throw ValidationException::withMessages([
                'simulation' =>
                    'The gender change conflicts with an active booking for '
                    . $student['matric_number']
                    . '. Resolve the allocation before importing this change.',
            ]);
        }
    }
}
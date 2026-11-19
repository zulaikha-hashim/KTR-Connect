<?php

namespace App\Http\Controllers\Admin\Hostel;

use App\Http\Controllers\Controller;
use App\Models\HostelAcademicSession;
use App\Models\HostelBed;
use App\Models\HostelReservation;
use App\Models\HostelStudentProfile;
use App\Services\Hostel\MockStudentAllocationService;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MockStudentAllocationController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensureLocalPreview($request);

        $validated = $request->validate([
            'session' => [
                'nullable',
                'integer',
                'exists:hostel_academic_sessions,id',
            ],
        ]);

        $academicSessions = HostelAcademicSession::query()
            ->orderByDesc('academic_year')
            ->orderByDesc('semester')
            ->get(['id', 'name']);

        $selectedSessionId = isset($validated['session'])
            ? (int) $validated['session']
            : $academicSessions->first()?->id;

        $activeReservations = HostelReservation::query()
            ->where('hostel_academic_session_id', $selectedSessionId)
            ->whereIn('status', ['held', 'confirmed'])
            ->with([
                'student:id,name',
                'bed.room.block',
            ])
            ->get();

        $reservationsByUser = $activeReservations->keyBy('user_id');
        $reservedBedIds = $activeReservations
            ->pluck('hostel_bed_id')
            ->all();

        $students = HostelStudentProfile::query()
            ->where('source', 'mock_utmdigital')
            ->with('user:id,name')
            ->orderBy('matric_number')
            ->get()
            ->map(function ($profile) use ($reservationsByUser) {
                $reservation = $reservationsByUser->get(
                    $profile->user_id
                );

                return [
                    'id' => $profile->id,
                    'matric_number' => $profile->matric_number,
                    'full_name' => $profile->user?->name,
                    'faculty' => $profile->faculty,
                    'gender' => $profile->gender,
                    'has_active_allocation' => $reservation !== null,
                ];
            })
            ->values();

        $asOf = now()->utc();

        $beds = HostelBed::query()
            ->with([
                'room.block',
                'restrictions' => function ($query) use (
                    $selectedSessionId,
                    $asOf
                ) {
                    $query->whereNull('ended_at')
                        ->where('starts_at', '<=', $asOf)
                        ->where(function ($query) use (
                            $selectedSessionId
                        ) {
                            $query
                                ->whereNull('hostel_academic_session_id')
                                ->orWhere(
                                    'hostel_academic_session_id',
                                    $selectedSessionId
                                );
                        });
                },
            ])
            ->get()
            ->map(function ($bed) use ($reservedBedIds) {
                $room = $bed->room;
                $block = $room?->block;

                return [
                    'id' => $bed->id,
                    'label' => $bed->label,
                    'room_number' => $room?->room_number,
                    'block_code' => $block?->code,
                    'gender' => $block?->residential_zone,
                    'available' =>
                        $room !== null
                        && $block !== null
                        && !in_array($bed->id, $reservedBedIds, true)
                        && $bed->restrictions->isEmpty(),
                ];
            })
            ->sortBy(fn ($bed) =>
                $bed['room_number'] . '-' . $bed['label']
            )
            ->values();

        $allocations = $activeReservations
            ->filter(fn ($reservation) =>
                $reservation->status === 'confirmed'
                && str_starts_with($reservation->reference, 'SIM-')
            )
            ->map(fn ($reservation) => [
                'id' => $reservation->id,
                'reference' => $reservation->reference,
                'student_name' => $reservation->student?->name,
                'room_number' => $reservation->bed?->room?->room_number,
                'bed_label' => $reservation->bed?->label,
                'confirmed_at' => $reservation->confirmed_at
                    ?->copy()
                    ->utc()
                    ->toIso8601String(),
            ])
            ->values();

        return Inertia::render('Hostel/AllocationSimulation', [
            'academicSessions' => $academicSessions,
            'selectedSessionId' => $selectedSessionId,
            'students' => $students,
            'beds' => $beds,
            'allocations' => $allocations,
            'successMessage' => $request->session()->get(
                'simulationAllocationSuccess'
            ),
        ]);
    }

    public function store(
        Request $request,
        MockStudentAllocationService $allocator
    ): RedirectResponse {
        $this->ensureLocalPreview($request);

        $validated = $request->validate([
            'student_profile_id' => [
                'required',
                'integer',
                'exists:hostel_student_profiles,id',
            ],
            'hostel_academic_session_id' => [
                'required',
                'integer',
                'exists:hostel_academic_sessions,id',
            ],
            'hostel_bed_id' => [
                'required',
                'integer',
                'exists:hostel_beds,id',
            ],
        ]);

        try {
            $reservation = $allocator->allocate(
                (int) $validated['student_profile_id'],
                (int) $validated['hostel_academic_session_id'],
                (int) $validated['hostel_bed_id'],
            );
        } catch (QueryException $exception) {
            if ((int) ($exception->errorInfo[1] ?? 0) !== 1062) {
                throw $exception;
            }

            throw ValidationException::withMessages([
                'simulation' =>
                    'The student or bed was allocated by another request. Refresh the page and try again.',
            ]);
        }

        return redirect()
            ->route('admin.hostel.simulation.allocations.index', [
                'session' => $validated['hostel_academic_session_id'],
            ])
            ->with(
                'simulationAllocationSuccess',
                'Simulation allocation confirmed. Reference: '
                    . $reservation->reference
            );
    }

    private function ensureLocalPreview(Request $request): void
    {
        abort_unless(
            app()->environment('local')
            && in_array(
                $request->server('REMOTE_ADDR'),
                ['127.0.0.1', '::1'],
                true
            )
            && in_array(
                $request->getHost(),
                ['127.0.0.1', 'localhost', '::1', '[::1]'],
                true
            ),
            403,
            'Allocation simulation is only available locally.'
        );
    }
}
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HostelAcademicSession;
use App\Models\HostelRoom;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HostelInventoryController extends Controller
{
    public function index(Request $request): Response
    {
        // Local preview until the team's authentication and roles are connected.
        abort_unless(app()->environment('local'), 404);

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
        ->get([
            'id',
            'name',
            'academic_year',
            'semester',
        ]);

    $selectedSessionId = isset($validated['session'])
        ? (int) $validated['session']
        : $academicSessions->first()?->id;

        $asOf = now()->utc();
        $rooms = HostelRoom::query()
            ->with([
                'block',

                'beds' => fn ($query) => $query->orderBy('label'),

                'beds.restrictions' => function ($query) use (
                    $selectedSessionId,
                    $asOf
                ) {
                    $query
                        ->whereNull('ended_at')
                        ->where('starts_at', '<=', $asOf)
                        ->where(function ($query) use ($selectedSessionId) {
                            $query
                                ->whereNull('hostel_academic_session_id')
                                ->orWhere(
                                    'hostel_academic_session_id',
                                    $selectedSessionId
                                );
                        })
                        ->with([
                            'createdBy:id,name',
                            'academicSession:id,name',
                        ])
                        ->orderBy('starts_at');
                },

                'beds.reservations' => function ($query) use (
                    $selectedSessionId,
                    $asOf
                ) {
                    $query
                        ->where(
                            'hostel_academic_session_id',
                            $selectedSessionId
                        )
                        ->where(function ($query) use ($asOf) {
                            $query->where('status', 'confirmed')
                                ->orWhere(function ($query) use ($asOf) {
                                    $query->where('status', 'held')
                                        ->where('hold_expires_at', '>', $asOf);
                                });
                        })
                        ->with('student:id,name');
                },
            ])
            ->orderBy('room_number')
            ->get()
            ->map(fn (HostelRoom $room) => [
                'id' => $room->id,
                'room_number' => $room->room_number,
                'floor_level' => $room->floor_level,
                'wing' => $room->wing,
                'category' => $room->category,
                'floor_area_sqm' => $room->floor_area_sqm,
                'mattress_width_cm' => $room->mattress_width_cm,
                'mattress_length_cm' => $room->mattress_length_cm,
                'ceiling_height_m' => $room->ceiling_height_m,
                'amenities' => $room->amenities,
                'description' => $room->description,
                'block' => [
                    'id' => $room->block->id,
                    'code' => $room->block->code,
                    'name' => $room->block->name,
                    'residential_zone' => $room->block->residential_zone,
                ],
                'beds' => $room->beds
                    ->map(function ($bed) use ($selectedSessionId) {
                        $reservation = $bed->reservations->first();

                        if ($selectedSessionId === null) {
                            $availabilityStatus = 'not_assessed';
                        } elseif ($reservation?->status === 'confirmed') {
                            $availabilityStatus = 'occupied';
                        } elseif ($reservation?->status === 'held') {
                            $availabilityStatus = 'held';
                        } elseif ($bed->restrictions->isNotEmpty()) {
                            $availabilityStatus = 'unavailable';
                        } else {
                            $availabilityStatus = 'available';
                        }

                        return [
                            'id' => $bed->id,
                            'label' => $bed->label,
                            'availability_status' => $availabilityStatus,

                            'restrictions' => $bed->restrictions
                                ->map(fn ($restriction) => [
                                    'id' => $restriction->id,
                                    'reference' => $restriction->reference,
                                    'type' => $restriction->type,
                                    'reason' => $restriction->reason,

                                    'scope' => $restriction->hostel_academic_session_id === null
                                        ? 'All academic sessions'
                                        : $restriction->academicSession?->name,

                                    'created_by_name' => $restriction->createdBy?->name,

                                    'starts_at' => $restriction->starts_at
                                        ->copy()
                                        ->utc()
                                        ->toIso8601String(),
                                ])
                                ->values(),

                            'reservation' => $reservation ? [
                                'reference' => $reservation->reference,
                                'status' => $reservation->status,
                                'student_name' => $reservation->student?->name,

                                'confirmed_at' => $reservation->confirmed_at
                                    ?->copy()
                                    ->utc()
                                    ->toIso8601String(),

                                'hold_expires_at' => $reservation->hold_expires_at
                                    ?->copy()
                                    ->utc()
                                    ->toIso8601String(),
                            ] : null,
                        ];
                    })
                    ->values(),
            ])
            ->values();

        return Inertia::render('Hostel/AdminInventory', [
            'rooms' => $rooms,
            'academicSessions' => $academicSessions,
            'selectedSessionId' => $selectedSessionId,
        ]);
    }
}
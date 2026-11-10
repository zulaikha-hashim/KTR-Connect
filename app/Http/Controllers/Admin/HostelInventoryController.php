<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HostelRoom;
use Inertia\Inertia;
use Inertia\Response;

class HostelInventoryController extends Controller
{
    public function index(): Response
    {
        // Local preview until the team's authentication and roles are connected.
        abort_unless(app()->environment('local'), 404);

        $rooms = HostelRoom::query()
            ->with([
                'block',
                'beds' => fn ($query) => $query->orderBy('label'),
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
                    ->map(fn ($bed) => [
                        'id' => $bed->id,
                        'label' => $bed->label,
                    ])
                    ->values(),
            ])
            ->values();

        return Inertia::render('Hostel/AdminInventory', [
            'rooms' => $rooms,
        ]);
    }
}
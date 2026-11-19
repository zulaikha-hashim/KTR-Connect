<?php

namespace Database\Seeders;

use App\Models\HostelBed;
use App\Models\HostelBlock;
use App\Models\HostelRoom;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HostelSimulationFemaleInventorySeeder extends Seeder
{
    public function run(): void
    {
        abort_unless(app()->environment('local'), 403);

        DB::transaction(function () {
            $legacyRoom = HostelRoom::query()
                ->where('room_number', 'SIM-F01-01-001')
                ->lockForUpdate()
                ->first();

            // Verify the old simulation room before moving it.
            if ($legacyRoom !== null) {
                $legacyBlock = HostelBlock::query()
                    ->findOrFail($legacyRoom->hostel_block_id);

                if (
                    $legacyBlock->code !== 'SIM-F01'
                    || $legacyBlock->residential_zone !== 'female'
                ) {
                    throw new \RuntimeException(
                        'The old simulation room has an unexpected block.'
                    );
                }
            }

            foreach (['K09', 'K08', 'K07'] as $blockCode) {
                $block = HostelBlock::query()->firstOrCreate(
                    [
                        'code' => $blockCode,
                    ],
                    [
                        'name' => 'Block ' . $blockCode,
                        'residential_zone' => 'female',
                    ]
                );

                if ($block->residential_zone !== 'female') {
                    throw new \RuntimeException(
                        $blockCode . ' already exists with a different designated gender.'
                    );
                }

                for ($level = 1; $level <= 4; $level++) {
                    $roomNumber = sprintf(
                        '%s-%02d-%03d',
                        $blockCode,
                        $level,
                        ($level * 100) + 1
                    );

                    $room = HostelRoom::query()
                        ->where('room_number', $roomNumber)
                        ->lockForUpdate()
                        ->first();

                    // Preserve the original bed IDs and Nur Alya's allocation.
                    if (
                        $blockCode === 'K09'
                        && $level === 1
                        && $legacyRoom !== null
                    ) {
                        if ($room !== null) {
                            throw new \RuntimeException(
                                'K09-01-101 already exists. The old simulation room cannot be moved automatically.'
                            );
                        }

                        $legacyRoom->update([
                            'hostel_block_id' => $block->id,
                            'room_number' => $roomNumber,
                            'floor_level' => 1,
                            'wing' => 'A',
                            'category' => 'double_sharing',
                            'description' =>
                                'Illustrative development room. Sample inventory only.',
                        ]);

                        $room = $legacyRoom;
                    }

                    if ($room === null) {
                        $room = HostelRoom::query()->create([
                            'hostel_block_id' => $block->id,
                            'room_number' => $roomNumber,
                            'floor_level' => $level,
                            'wing' => 'A',
                            'category' => 'double_sharing',
                            'description' =>
                                'Illustrative development room. Sample inventory only.',
                        ]);
                    }

                    // Avoid silently changing incompatible existing rooms.
                    if (
                        (int) $room->hostel_block_id !== (int) $block->id
                        || (int) $room->floor_level !== $level
                        || $room->category !== 'double_sharing'
                    ) {
                        throw new \RuntimeException(
                            $roomNumber . ' exists with different room details.'
                        );
                    }

                    foreach (['A', 'B'] as $label) {
                        HostelBed::query()->firstOrCreate([
                            'hostel_room_id' => $room->id,
                            'label' => $label,
                        ]);
                    }
                }
            }

            // Remove the old fictional block only when it has no rooms.
            $oldBlock = HostelBlock::query()
                ->where('code', 'SIM-F01')
                ->first();

            if ($oldBlock !== null) {
                $hasRooms = HostelRoom::query()
                    ->where('hostel_block_id', $oldBlock->id)
                    ->exists();

                if (!$hasRooms) {
                    $oldBlock->delete();
                }
            }
        });
    }
}
<?php

namespace Database\Seeders;

use App\Models\HostelBed;
use App\Models\HostelBlock;
use App\Models\HostelRoom;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HostelInventorySeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            throw new \RuntimeException(
                'This sample inventory seeder is for local development only.'
            );
        }

        DB::transaction(function () {
            $block = HostelBlock::firstOrCreate(
                ['code' => 'K11'],
                [
                    'name' => 'Block K11',
                    'residential_zone' => 'male',
                ]
            );

            // Illustrative development inventory, not verified KTR master data.
            $rooms = [
                [
                    'K11-04-467',
                    4,
                    'C',
                    'single_attached_bathroom',
                    ['A'],
                ],
                [
                    'K11-04-468',
                    4,
                    'C',
                    'single_attached_bathroom',
                    ['A'],
                ],
                [
                    'K11-03-314',
                    3,
                    'B',
                    'double_sharing',
                    ['A', 'B'],
                ],
                [
                    'K11-02-214',
                    2,
                    'B',
                    'double_sharing',
                    ['A', 'B'],
                ],
                [
                    'K11-01-105',
                    1,
                    'A',
                    'single_standard',
                    ['A'],
                ],
                [
                    'K11-02-216',
                    2,
                    'B',
                    'double_sharing',
                    ['A', 'B'],
                ],
            ];

            foreach ($rooms as [
                $roomNumber,
                $floor,
                $wing,
                $category,
                $bedLabels,
            ]) {
                $room = HostelRoom::firstOrCreate(
                    ['room_number' => $roomNumber],
                    [
                        'hostel_block_id' => $block->id,
                        'floor_level' => $floor,
                        'wing' => $wing,
                        'category' => $category,
                        'description' => 'Illustrative development room.',
                    ]
                );

                foreach ($bedLabels as $label) {
                    HostelBed::firstOrCreate([
                        'hostel_room_id' => $room->id,
                        'label' => $label,
                    ]);
                }
            }
        });
    }
}
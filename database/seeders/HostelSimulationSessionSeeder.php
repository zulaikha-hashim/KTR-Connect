<?php

namespace Database\Seeders;

use App\Models\HostelAcademicSession;
use Illuminate\Database\Seeder;

class HostelSimulationSessionSeeder extends Seeder
{
    public function run(): void
    {
        abort_unless(app()->environment('local'), 403);

        HostelAcademicSession::query()->firstOrCreate(
            [
                'academic_year' => '2026/2027',
                'semester' => 2,
            ],
            [
                'name' => 'Sem 2, 2026/2027',
            ]
        );
    }
}
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AcademicSession;

class AcademicSessionSeeder extends Seeder
{
    public function run(): void
    {
        AcademicSession::updateOrCreate(
            ['name' => '2024/2025'],
            ['is_current' => false]
        );

        AcademicSession::updateOrCreate(
            ['name' => '2025/2026'],
            ['is_current' => false]
        );

        AcademicSession::updateOrCreate(
            ['name' => '2026/2027'],
            ['is_current' => true]
        );
    }
}

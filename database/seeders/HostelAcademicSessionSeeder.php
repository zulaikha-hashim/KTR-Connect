<?php

namespace Database\Seeders;

use App\Models\HostelAcademicSession;
use Illuminate\Database\Seeder;

class HostelAcademicSessionSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            throw new \RuntimeException(
                'This sample session seeder is for local development only.'
            );
        }

        HostelAcademicSession::firstOrCreate(
            [
                'academic_year' => '2026/2027',
                'semester' => 1,
            ],
            [
                'name' => 'Sem 1, 2026/2027',
            ]
        );
    }
}
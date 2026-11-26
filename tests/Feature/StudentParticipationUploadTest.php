<?php

namespace Tests\Feature;

use App\Models\ActivityApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentParticipationUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_upload_page_lists_only_approved_applications_with_a_session(): void
    {
        $approved = $this->makeActivityApplication('approved');
        $approved->update([
            'google_sheet_url' => 'https://docs.google.com/spreadsheets/d/activity-sheet/edit',
        ]);
        $this->makeActivityApplication('pending', 'Pending Activity');
        $this->makeActivityApplication('approved', 'Missing Session', null);

        $this->get('/admin/students/upload')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('UploadStudentName')
                ->has('approvedApplications', 1)
                ->where('approvedApplications.0.id', $approved->id)
                ->where('approvedApplications.0.google_sheet_url', 'https://docs.google.com/spreadsheets/d/activity-sheet/edit'));
    }

    public function test_csv_upload_stores_student_data_and_merit_for_the_approved_activity(): void
    {
        $application = $this->makeActivityApplication('approved');

        $uploadData = [
            'academic_year' => '2026/2027',
            'semester' => '1',
            'activity_application_id' => $application->id,
            'merit_allocation' => '12',
            'role' => 'Participant',
            'csv_file' => UploadedFile::fake()->createWithContent(
                'students.csv',
                "student_id,name,gender,ic_number,phone_number,faculty,email,program\nA23CS0001,Sample Student,Female,000000-00-0000,0123456789,Computing,student@example.test,Computer Science\n",
            ),
        ];
        $this->post('/admin/students/upload/preview', $uploadData)
            ->assertRedirect(route('admin.students.upload.create', [
                'academic_year' => '2026/2027',
                'semester' => 1,
            ]));

        $this->assertDatabaseCount('activity_participations', 0);
        $this->get(route('admin.students.upload.create', [
            'academic_year' => '2026/2027',
            'semester' => 1,
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('studentPreview.activity_name', 'Approved Activity')
                ->where('studentPreview.rows.0.gender', 'Female')
                ->where('studentPreview.rows.0.current_college', null));

        $this->post('/admin/students/upload', [
            'academic_year' => '2026/2027',
            'semester' => 1,
            'activity_application_id' => $application->id,
            'merit_allocation' => 12,
            'role' => 'Participant',
            'rows' => [[
                'student_id' => 'A23CS0001',
                'student_name' => 'Sample Student',
                'gender' => 'Female',
                'ic_number' => '000000-00-0000',
                'phone_number' => '0123456789',
                'faculty' => 'Computing',
                'current_college' => null,
                'student_email' => 'student@example.test',
                'additional_data' => ['program' => 'Computer Science'],
            ]],
        ])
            ->assertSessionHas('success', 'Imported 1 students: 1 new and 0 updated.');

        $this->assertDatabaseHas('activity_participations', [
            'activity_application_id' => $application->id,
            'academic_year' => '2026/2027',
            'semester' => 1,
            'student_id' => 'A23CS0001',
            'student_name' => 'Sample Student',
            'gender' => 'Female',
            'student_email' => 'student@example.test',
            'merit_allocation' => 12,
            'role' => 'Participant',
        ]);

        $record = DB::table('activity_participations')->first();
        $this->assertSame(
            ['program' => 'Computer Science'],
            json_decode($record->additional_data, true),
        );
    }

    public function test_reupload_updates_existing_student_and_merit_record(): void
    {
        $application = $this->makeActivityApplication('approved');

        foreach ([
            ['First Name', '10'],
            ['Corrected Name', '15'],
        ] as [$name, $merit]) {
            $uploadData = [
                'academic_year' => '2026/2027',
                'semester' => '1',
                'activity_application_id' => $application->id,
                'merit_allocation' => $merit,
                'role' => 'MT',
                'csv_file' => UploadedFile::fake()->createWithContent(
                    'students.csv',
                    "student_id,name,ic_number,phone_number,faculty,current_college\nA23CS0001,{$name},,,,\n",
                ),
            ];
            $this->post('/admin/students/upload/preview', $uploadData)
                ->assertRedirect(route('admin.students.upload.create', [
                    'academic_year' => '2026/2027',
                    'semester' => 1,
                ]));
            $this->get(route('admin.students.upload.create', [
                'academic_year' => '2026/2027',
                'semester' => 1,
            ]))->assertOk();
            $this->post('/admin/students/upload', [
                'academic_year' => '2026/2027',
                'semester' => 1,
                'activity_application_id' => $application->id,
                'merit_allocation' => $merit,
                'role' => 'MT',
                'rows' => [[
                    'student_id' => 'A23CS0001',
                    'student_name' => $name,
                    'gender' => null,
                    'ic_number' => null,
                    'phone_number' => null,
                    'faculty' => null,
                    'current_college' => null,
                    'student_email' => null,
                    'additional_data' => [],
                ]],
            ])->assertRedirect(route('admin.students.upload.create', [
                'academic_year' => '2026/2027',
                'semester' => 1,
            ]));
        }

        $this->assertDatabaseCount('activity_participations', 1);
        $this->assertDatabaseHas('activity_participations', [
            'student_id' => 'A23CS0001',
            'student_name' => 'Corrected Name',
            'merit_allocation' => 15,
        ]);
    }

    public function test_invalid_csv_record_is_rejected_without_partial_import(): void
    {
        $application = $this->makeActivityApplication('approved');

        $this->from('/admin/students/upload')->post('/admin/students/upload/preview', [
            'academic_year' => '2026/2027',
            'semester' => '1',
            'activity_application_id' => $application->id,
            'merit_allocation' => '12',
            'role' => 'Participant',
            'csv_file' => UploadedFile::fake()->createWithContent(
                'students.csv',
                "student_id,name,ic_number,phone_number,faculty,current_college\nA23CS0001,Valid Student,000000-00-0000,0123456789,Computing,KTR\nA23CS0002\n",
            ),
        ])
            ->assertRedirect('/admin/students/upload')
            ->assertSessionHasErrors('csv_file');

        $this->assertDatabaseCount('activity_participations', 0);
    }

    public function test_upload_rejects_an_activity_that_is_not_approved_or_in_the_selected_session(): void
    {
        $application = $this->makeActivityApplication('pending');

        $this->from('/admin/students/upload')->post('/admin/students/upload/preview', [
            'academic_year' => '2026/2027',
            'semester' => '1',
            'activity_application_id' => $application->id,
            'merit_allocation' => '12',
            'role' => 'Participant',
            'csv_file' => UploadedFile::fake()->createWithContent(
                'students.csv',
                "student_id,name,ic_number,phone_number,faculty,current_college\nA23CS0001,Sample Student,000000-00-0000,0123456789,Computing,KTR\n",
            ),
        ])
            ->assertRedirect('/admin/students/upload')
            ->assertSessionHasErrors('activity_application_id');

        $this->assertDatabaseCount('activity_participations', 0);
    }

    public function test_incomplete_student_row_can_be_corrected_after_import(): void
    {
        $application = $this->makeActivityApplication('approved');

        $this->post('/admin/students/upload/preview', [
            'academic_year' => '2026/2027',
            'semester' => '1',
            'activity_application_id' => $application->id,
            'merit_allocation' => '12',
            'role' => 'Crew',
            'csv_file' => UploadedFile::fake()->createWithContent(
                'students.csv',
                "student_id,name,ic_number,phone_number,faculty,current_college\n,Partially Listed,,,,\n",
            ),
        ])->assertRedirect(route('admin.students.upload.create', [
            'academic_year' => '2026/2027',
            'semester' => 1,
        ]));

        $this->assertDatabaseCount('activity_participations', 0);
        $this->get(route('admin.students.upload.create', [
            'academic_year' => '2026/2027',
            'semester' => 1,
        ]))->assertOk();
        $this->post('/admin/students/upload', [
            'academic_year' => '2026/2027',
            'semester' => 1,
            'activity_application_id' => $application->id,
            'merit_allocation' => 12,
            'role' => 'Crew',
            'rows' => [[
                'student_id' => null,
                'student_name' => 'Partially Listed',
                'gender' => null,
                'ic_number' => null,
                'phone_number' => null,
                'faculty' => null,
                'current_college' => null,
                'student_email' => null,
                'additional_data' => [],
            ]],
        ])->assertRedirect(route('admin.students.upload.create', [
            'academic_year' => '2026/2027',
            'semester' => 1,
        ]));

        $student = DB::table('activity_participations')->first();
        $this->assertNull($student->student_id);

        $this->patch("/admin/students/{$student->id}", [
            'student_id' => 'A23CS0001',
            'student_name' => 'Sample Student',
            'gender' => 'Female',
            'role' => 'Participant',
            'ic_number' => '000000-00-0000',
            'phone_number' => '0123456789',
            'faculty' => 'Computing',
            'current_college' => 'Kolej Tun Razak',
            'student_email' => '',
            'additional_data' => '{}',
        ])->assertRedirect(route('admin.students.upload.create', [
            'academic_year' => '2026/2027',
            'semester' => 1,
        ]));

        $this->assertDatabaseHas('activity_participations', [
            'id' => $student->id,
            'student_id' => 'A23CS0001',
            'student_name' => 'Sample Student',
            'gender' => 'Female',
            'role' => 'Participant',
            'ic_number' => '000000-00-0000',
            'phone_number' => '0123456789',
            'faculty' => 'Computing',
            'current_college' => 'Kolej Tun Razak',
        ]);
    }

    public function test_student_list_is_filtered_to_the_selected_semester_and_session(): void
    {
        $firstActivity = $this->makeActivityApplication('approved');
        $otherActivity = $this->makeActivityApplication('approved', 'Another Activity');
        $secondActivity = $this->makeActivityApplication('approved', 'Next Semester Activity');
        $secondActivity->update(['academic_year' => '2027/2028', 'semester' => 2]);

        foreach ([
            [$firstActivity->id, '2026/2027', 1, 'A23CS0001'],
            [$otherActivity->id, '2026/2027', 1, 'A23CS0002'],
            [$secondActivity->id, '2027/2028', 2, 'A24CS0001'],
        ] as [$activityId, $academicYear, $semester, $studentId]) {
            DB::table('activity_participations')->insert([
                'activity_application_id' => $activityId,
                'academic_year' => $academicYear,
                'semester' => $semester,
                'student_id' => $studentId,
                'student_name' => 'Sample Student',
                'merit_allocation' => 12,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->get('/admin/students/upload?academic_year=2026%2F2027&semester=1')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selectedSession', '2026/2027|1')
                ->where('activitySearch', '')
                ->has('participations.data', 0));

        $this->get('/admin/students/upload?academic_year=2026%2F2027&semester=1&activity_search=Approved')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('activitySearch', 'Approved')
                ->has('participations.data', 1)
                ->where('participations.data.0.student_id', 'A23CS0001'));
    }

    public function test_rules_are_downloaded_as_a_pdf(): void
    {
        $this->get('/admin/students/upload/rules')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf')
            ->assertSee('%PDF-1.4', false)
            ->assertSee('student_id or matric_no, name, ic_number, phone_number, faculty', false)
            ->assertSee('Optional columns: current_college, gender, and email.', false);
    }

    private function makeActivityApplication(
        string $status,
        string $name = 'Approved Activity',
        ?string $academicYear = '2026/2027',
    ): ActivityApplication {
        return ActivityApplication::create([
            'activity_name' => $name,
            'academic_year' => $academicYear,
            'semester' => $academicYear === null ? null : 1,
            'status' => $status,
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\ActivityApplication;
use App\Models\ActivityParticipation;
use App\Models\User;
use App\Mail\ActivityApplicationDecision;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ActivityApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_page_loads_applications_from_the_database(): void
    {
        ActivityApplication::create([
            'activity_name' => 'Database Activity',
            'status' => 'pending',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ActivityApplication')
                ->has('applications', 1)
                ->where('applications.0.activity_name', 'Database Activity'));
    }

    public function test_authenticated_felo_only_sees_their_activity_applications(): void
    {
        $felo = User::factory()->create();
        ActivityApplication::create([
            'felo_id' => $felo->id,
            'activity_name' => 'My Activity',
            'status' => 'pending',
        ]);
        ActivityApplication::create([
            'activity_name' => 'Another Felo Activity',
            'status' => 'pending',
        ]);

        $this->actingAs($felo)
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ActivityApplication')
                ->has('applications', 1)
                ->where('applications.0.activity_name', 'My Activity'));
    }

    public function test_felo_can_view_and_filter_students_for_their_activity(): void
    {
        $felo = User::factory()->create();
        $application = ActivityApplication::create([
            'felo_id' => $felo->id,
            'activity_name' => 'My Activity',
            'academic_year' => '2026/2027',
            'semester' => 1,
            'status' => 'approved',
        ]);
        ActivityParticipation::create([
            'activity_application_id' => $application->id,
            'academic_year' => '2026/2027',
            'semester' => 1,
            'student_id' => 'A23CS0001',
            'student_name' => 'Participant Student',
            'role' => 'Participant',
            'merit_allocation' => 12,
        ]);
        ActivityParticipation::create([
            'activity_application_id' => $application->id,
            'academic_year' => '2026/2027',
            'semester' => 1,
            'student_id' => 'A23CS0002',
            'student_name' => 'MT Student',
            'role' => 'MT',
            'merit_allocation' => 15,
        ]);

        $this->actingAs($felo)
            ->get("/activity-applications/{$application->id}/students?role=Participant")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ActivityApplicationStudents')
                ->where('application.activity_name', 'My Activity')
                ->where('selectedRole', 'Participant')
                ->where('roleCounts.MT', 1)
                ->where('roleCounts.Participant', 1)
                ->has('participations.data', 1)
                ->where('participations.data.0.student_name', 'Participant Student'));
    }

    public function test_felo_cannot_view_another_felos_student_list(): void
    {
        $application = ActivityApplication::create([
            'felo_id' => User::factory()->create()->id,
            'activity_name' => 'Private Activity',
            'status' => 'approved',
        ]);

        $this->actingAs(User::factory()->create())
            ->get("/activity-applications/{$application->id}/students")
            ->assertForbidden();
    }

    public function test_felo_can_download_csv_for_all_students_in_their_activity(): void
    {
        $felo = User::factory()->create();
        $application = ActivityApplication::create([
            'felo_id' => $felo->id,
            'activity_name' => 'My Activity',
            'academic_year' => '2026/2027',
            'semester' => 1,
            'status' => 'approved',
        ]);
        foreach ([
            ['A23CS0001', 'Participant Student', 'Participant'],
            ['A23CS0002', 'MT Student', 'MT'],
        ] as [$studentId, $studentName, $role]) {
            ActivityParticipation::create([
                'activity_application_id' => $application->id,
                'academic_year' => '2026/2027',
                'semester' => 1,
                'student_id' => $studentId,
                'student_name' => $studentName,
                'role' => $role,
                'merit_allocation' => 12,
            ]);
        }

        $response = $this->actingAs($felo)
            ->get("/activity-applications/{$application->id}/students/csv");

        $response
            ->assertOk()
            ->assertDownload('my-activity-students.csv');
        $this->assertStringContainsString('Participant Student', $response->streamedContent());
        $this->assertStringContainsString('MT Student', $response->streamedContent());
    }

    public function test_felo_cannot_download_another_felos_student_csv(): void
    {
        $application = ActivityApplication::create([
            'felo_id' => User::factory()->create()->id,
            'activity_name' => 'Private Activity',
            'status' => 'approved',
        ]);

        $this->actingAs(User::factory()->create())
            ->get("/activity-applications/{$application->id}/students/csv")
            ->assertForbidden();
    }

    public function test_admin_review_queue_loads_submitted_applications_but_not_drafts(): void
    {
        ActivityApplication::create([
            'activity_name' => 'Application for Admin',
            'status' => 'pending',
        ]);
        ActivityApplication::create([
            'activity_name' => 'Private Draft',
            'status' => 'draft',
        ]);

        $this->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin')
                ->has('applications', 1)
                ->where('applications.0.activity_name', 'Application for Admin'));
    }

    public function test_valid_application_is_saved_and_submitted_for_approval(): void
    {
        Storage::fake('local');
        Mail::fake();
        config(['mail.admin_address' => 'admin@example.test']);
        $felo = User::factory()->create();
        $startAt = now()->addDays(30)->setTime(8, 30);
        $endAt = $startAt->copy()->setTime(18, 0);

        $response = $this->actingAs($felo)->from('/')->post('/activity-applications', [
            'status' => 'pending',
            'activity_name' => 'KTR Sports Day',
            'director_name' => 'Afiq Rahman',
            'academic_year' => '2026/2027',
            'semester' => '1',
            'organization' => 'KTR Sports Club',
            'start_at' => $startAt->format('Y-m-d\TH:i'),
            'end_at' => $endAt->format('Y-m-d\TH:i'),
            'venue' => 'Dewan Sri Meranti',
            'google_sheet_url' => 'https://docs.google.com/spreadsheets/d/example-sheet-id/edit',
            'remarks' => 'Bring reusable water bottles.',
            'latitude' => '1.5594000',
            'longitude' => '103.6382000',
            'committee_quota' => '25',
            'participant_quota' => '225',
            'merit_tier' => 'standard',
            'merit_notes' => 'Sports charter event.',
            'proposal_document' => UploadedFile::fake()->create('proposal.pdf', 100, 'application/pdf'),
        ]);

        $response->assertRedirect('/');
        $this->assertDatabaseHas('activity_applications', [
            'activity_name' => 'KTR Sports Day',
            'director_name' => 'Afiq Rahman',
            'organization' => 'KTR Sports Club',
            'status' => 'pending',
            'google_sheet_url' => 'https://docs.google.com/spreadsheets/d/example-sheet-id/edit',
            'remarks' => 'Bring reusable water bottles.',
            'felo_id' => $felo->id,
            'academic_year' => '2026/2027',
            'semester' => 1,
            'latitude' => '1.5594000',
            'longitude' => '103.6382000',
            'participant_quota' => 225,
        ]);

        $application = ActivityApplication::query()->firstOrFail();
        $this->assertNotNull($application->proposal_document_path);
        Storage::disk('local')->assertExists($application->proposal_document_path);
        Mail::assertSent(\App\Mail\ActivityApplicationSubmitted::class, fn ($mail) =>
            $mail->application->is($application)
            && str_contains($mail->render(), 'KTR Sports Day'));
    }

    public function test_incomplete_application_can_be_saved_as_a_draft(): void
    {
        $endAt = now()->addDays(30)->setTime(18, 0);

        $response = $this->from('/')->post('/activity-applications', [
            'status' => 'draft',
            'activity_name' => 'Early idea',
            'end_at' => $endAt->format('Y-m-d\TH:i'),
        ]);

        $response->assertRedirect('/');
        $this->assertDatabaseHas('activity_applications', [
            'activity_name' => 'Early idea',
            'end_at' => $endAt->format('Y-m-d H:i:s'),
            'status' => 'draft',
        ]);
    }

    public function test_felo_can_resubmit_an_owned_rejected_application(): void
    {
        $felo = User::factory()->create();
        $application = ActivityApplication::create([
            'felo_id' => $felo->id,
            'activity_name' => 'Rejected activity',
            'status' => 'rejected',
            'review_notes' => 'Please confirm the venue.',
        ]);

        $this->actingAs($felo)
            ->patch("/activity-applications/{$application->id}", [
                'status' => 'pending',
                'activity_name' => 'Amended activity',
                'director_name' => 'Afiq Rahman',
                'academic_year' => '2026/2027',
                'semester' => '1',
                'organization' => 'KTR Sports Club',
                'start_at' => now()->addDays(30)->format('Y-m-d\TH:i'),
                'end_at' => now()->addDays(31)->format('Y-m-d\TH:i'),
                'venue' => 'Dewan Sri Meranti',
                'latitude' => '1.5594000',
                'longitude' => '103.6382000',
                'committee_quota' => '25',
                'participant_quota' => '225',
                'merit_tier' => 'standard',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('activity_applications', [
            'id' => $application->id,
            'activity_name' => 'Amended activity',
            'status' => 'pending',
            'review_notes' => null,
        ]);
    }

    public function test_felo_can_edit_an_owned_draft_application(): void
    {
        $felo = User::factory()->create();
        $application = ActivityApplication::create([
            'felo_id' => $felo->id,
            'activity_name' => 'Original draft',
            'status' => 'draft',
        ]);

        $this->actingAs($felo)
            ->patch("/activity-applications/{$application->id}", [
                'status' => 'draft',
                'activity_name' => 'Updated draft',
                'director_name' => 'Afiq Rahman',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('activity_applications', [
            'id' => $application->id,
            'activity_name' => 'Updated draft',
            'director_name' => 'Afiq Rahman',
            'status' => 'draft',
        ]);
    }

    public function test_felo_cannot_edit_another_felos_application(): void
    {
        $applicationOwner = User::factory()->create();
        $anotherFelo = User::factory()->create();
        $application = ActivityApplication::create([
            'felo_id' => $applicationOwner->id,
            'activity_name' => 'Private draft',
            'status' => 'draft',
        ]);

        $this->actingAs($anotherFelo)
            ->patch("/activity-applications/{$application->id}", [
                'status' => 'draft',
            ])
            ->assertForbidden();
    }

    public function test_staff_delete_endpoint_is_unavailable(): void
    {
        Storage::fake('local');
        $felo = User::factory()->create();
        $path = 'activity-proposals/delete-me.pdf';
        Storage::disk('local')->put($path, '%PDF-1.4 test proposal');
        $application = ActivityApplication::create([
            'felo_id' => $felo->id,
            'activity_name' => 'Application that must be retained',
            'proposal_document_path' => $path,
            'status' => 'draft',
        ]);

        $this->actingAs($felo)
            ->delete("/activity-applications/{$application->id}")
            ->assertStatus(405);

        $this->assertDatabaseHas('activity_applications', [
            'id' => $application->id,
            'deleted_at' => null,
        ]);
        Storage::disk('local')->assertExists($path);
    }

    public function test_admin_can_soft_delete_and_retain_application_paperwork(): void
    {
        Storage::fake('local');
        $path = 'activity-proposals/admin-delete-me.pdf';
        Storage::disk('local')->put($path, '%PDF-1.4 test proposal');
        $application = ActivityApplication::create([
            'activity_name' => 'Application to archive',
            'proposal_document_path' => $path,
            'status' => 'rejected',
        ]);

        $this->delete("/admin/activity-applications/{$application->id}")
            ->assertRedirect();

        $this->assertSoftDeleted('activity_applications', ['id' => $application->id]);
        Storage::disk('local')->assertExists($path);
    }

    public function test_admin_cannot_delete_an_application_that_is_not_rejected(): void
    {
        $application = ActivityApplication::create([
            'activity_name' => 'Pending application',
            'status' => 'pending',
        ]);

        $this->delete("/admin/activity-applications/{$application->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('activity_applications', [
            'id' => $application->id,
            'status' => 'pending',
            'deleted_at' => null,
        ]);
    }

    public function test_proposal_pdf_is_saved_with_the_application(): void
    {
        Storage::fake('local');

        $this->from('/')->post('/activity-applications', [
            'status' => 'draft',
            'activity_name' => 'Draft with proposal',
            'proposal_document' => UploadedFile::fake()->create('proposal.pdf', 100, 'application/pdf'),
        ])->assertRedirect('/');

        $application = ActivityApplication::query()->firstOrFail();

        $this->assertNotNull($application->proposal_document_path);
        Storage::disk('local')->assertExists($application->proposal_document_path);
    }

    public function test_application_can_store_up_to_three_paperwork_pdfs(): void
    {
        Storage::fake('local');

        $this->from('/')->post('/activity-applications', [
            'status' => 'draft',
            'activity_name' => 'Draft with multiple paperwork files',
            'proposal_documents' => [
                UploadedFile::fake()->create('approval.pdf', 100, 'application/pdf'),
                UploadedFile::fake()->create('budget.pdf', 100, 'application/pdf'),
                UploadedFile::fake()->create('schedule.pdf', 100, 'application/pdf'),
            ],
        ])->assertRedirect('/');

        $application = ActivityApplication::query()->firstOrFail();
        $documents = $application->paperworkDocuments;

        $this->assertCount(3, $documents);
        foreach ($documents as $document) {
            Storage::disk('local')->assertExists($document->file_path);
        }
    }

    public function test_application_rejects_more_than_three_paperwork_pdfs(): void
    {
        Storage::fake('local');

        $this->from('/')->post('/activity-applications', [
            'status' => 'draft',
            'proposal_documents' => [
                UploadedFile::fake()->create('one.pdf', 100, 'application/pdf'),
                UploadedFile::fake()->create('two.pdf', 100, 'application/pdf'),
                UploadedFile::fake()->create('three.pdf', 100, 'application/pdf'),
                UploadedFile::fake()->create('four.pdf', 100, 'application/pdf'),
            ],
        ])
            ->assertRedirect('/')
            ->assertSessionHasErrors('proposal_documents');

        $this->assertDatabaseCount('activity_applications', 0);
    }

    public function test_pending_application_can_be_submitted_without_a_proposal_pdf(): void
    {
        $startAt = now()->addDays(30)->setTime(8, 30);
        $endAt = $startAt->copy()->setTime(18, 0);

        $this->from('/')->post('/activity-applications', [
            'status' => 'pending',
            'activity_name' => 'KTR Sports Day',
            'director_name' => 'Afiq Rahman',
            'academic_year' => '2026/2027',
            'semester' => '1',
            'organization' => 'KTR Sports Club',
            'start_at' => $startAt->format('Y-m-d\TH:i'),
            'end_at' => $endAt->format('Y-m-d\TH:i'),
            'venue' => 'Dewan Sri Meranti',
            'latitude' => '1.5594000',
            'longitude' => '103.6382000',
            'committee_quota' => '25',
            'participant_quota' => '225',
            'merit_tier' => 'standard',
        ])
            ->assertRedirect('/');

        $application = ActivityApplication::query()->firstOrFail();
        $this->assertNull($application->proposal_document_path);
    }

    public function test_admin_can_view_an_uploaded_proposal_pdf(): void
    {
        Storage::fake('local');
        $path = 'activity-proposals/proposal.pdf';
        Storage::disk('local')->put($path, '%PDF-1.4 test proposal');
        $application = ActivityApplication::create([
            'activity_name' => 'Application with PDF',
            'proposal_document_path' => $path,
            'status' => 'pending',
        ]);

        $this->get("/admin/activity-applications/{$application->id}/document")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf')
            ->assertHeader('content-disposition', 'attachment; filename=proposal.pdf');
    }

    public function test_pending_application_requires_all_required_fields(): void
    {
        $this->from('/')
            ->post('/activity-applications', [
                'status' => 'pending',
                'google_sheet_url' => 'https://example.com/student-data',
            ])
            ->assertRedirect('/')
            ->assertSessionHasErrors([
                'activity_name',
                'director_name',
                'academic_year',
                'semester',
                'organization',
                'participant_quota',
                'google_sheet_url',
                'start_at',
                'end_at',
                'venue',
                'latitude',
                'longitude',
            ]);

        $this->assertDatabaseCount('activity_applications', 0);
    }

    public function test_application_dates_cannot_be_before_today_or_the_start_date(): void
    {
        $yesterday = now()->subDay()->format('Y-m-d\TH:i');
        $tomorrow = now()->addDay()->setTime(8, 0);

        $this->from('/')
            ->post('/activity-applications', [
                'status' => 'draft',
                'start_at' => $yesterday,
                'end_at' => $yesterday,
            ])
            ->assertRedirect('/')
            ->assertSessionHasErrors(['start_at', 'end_at']);

        $this->from('/')
            ->post('/activity-applications', [
                'status' => 'draft',
                'start_at' => $tomorrow->format('Y-m-d\TH:i'),
                'end_at' => now()->format('Y-m-d\TH:i'),
            ])
            ->assertRedirect('/')
            ->assertSessionHasErrors('end_at');

        $this->from('/')
            ->post('/activity-applications', [
                'status' => 'draft',
                'start_at' => $tomorrow->format('Y-m-d\TH:i'),
                'end_at' => $tomorrow->copy()->setTime(7, 0)->format('Y-m-d\TH:i'),
            ])
            ->assertRedirect('/')
            ->assertSessionHasErrors('end_at');

        $this->assertDatabaseCount('activity_applications', 0);
    }

    public function test_pending_application_rejects_non_pdf_proposals(): void
    {
        $startAt = now()->addDays(30)->setTime(8, 30);
        $endAt = $startAt->copy()->setTime(18, 0);

        $this->from('/')->post('/activity-applications', [
            'status' => 'pending',
            'activity_name' => 'KTR Sports Day',
            'director_name' => 'Afiq Rahman',
            'organization' => 'KTR Sports Club',
            'start_at' => $startAt->format('Y-m-d\TH:i'),
            'end_at' => $endAt->format('Y-m-d\TH:i'),
            'venue' => 'Dewan Sri Meranti',
            'latitude' => '1.5594000',
            'longitude' => '103.6382000',
            'committee_quota' => '25',
            'participant_quota' => '225',
            'merit_tier' => 'standard',
            'proposal_document' => UploadedFile::fake()->create('proposal.txt', 100, 'text/plain'),
        ])
            ->assertRedirect('/')
            ->assertSessionHasErrors('proposal_document');

        $this->assertDatabaseCount('activity_applications', 0);
    }

    public function test_admin_can_approve_a_pending_application(): void
    {
        $application = ActivityApplication::create([
            'activity_name' => 'Activity to approve',
            'status' => 'pending',
        ]);

        $this->patch("/admin/activity-applications/{$application->id}", [
            'status' => 'approved',
        ])->assertRedirect();

        $this->assertDatabaseHas('activity_applications', [
            'id' => $application->id,
            'status' => 'approved',
        ]);
    }

    public function test_admin_approval_emails_the_submitting_staff_member(): void
    {
        Mail::fake();
        $felo = User::factory()->create(['email' => 'dummy-staff@example.test']);
        $application = ActivityApplication::create([
            'felo_id' => $felo->id,
            'activity_name' => 'Activity to approve',
            'status' => 'pending',
        ]);

        $this->patch("/admin/activity-applications/{$application->id}", [
            'status' => 'approved',
        ])->assertRedirect();

        Mail::assertSent(ActivityApplicationDecision::class, fn ($mail) =>
            $mail->application->is($application)
            && $mail->hasTo($felo->email)
            && str_contains($mail->render(), 'has been approved'));
    }

    public function test_admin_rejection_emails_the_submitting_staff_member_with_the_reason(): void
    {
        Mail::fake();
        $felo = User::factory()->create(['email' => 'dummy-staff@example.test']);
        $application = ActivityApplication::create([
            'felo_id' => $felo->id,
            'activity_name' => 'Activity to reject',
            'status' => 'pending',
        ]);

        $this->patch("/admin/activity-applications/{$application->id}", [
            'status' => 'rejected',
            'review_notes' => 'Please confirm the venue.',
        ])->assertRedirect();

        Mail::assertSent(ActivityApplicationDecision::class, fn ($mail) =>
            $mail->application->is($application)
            && $mail->hasTo($felo->email)
            && str_contains($mail->render(), 'has been rejected')
            && str_contains($mail->render(), 'Please confirm the venue.'));
    }

    public function test_admin_reports_when_a_decision_cannot_be_emailed_to_an_unlinked_applicant(): void
    {
        Mail::fake();
        config(['mail.admin_address' => null]);
        $application = ActivityApplication::create([
            'activity_name' => 'Application without an account',
            'status' => 'pending',
        ]);

        $this->patch("/admin/activity-applications/{$application->id}", [
            'status' => 'approved',
        ])
            ->assertRedirect()
            ->assertSessionHas('notificationWarning');

        Mail::assertNothingSent();
    }

    public function test_admin_email_is_used_when_an_application_has_no_linked_applicant(): void
    {
        Mail::fake();
        config(['mail.admin_address' => 'admin@example.test']);
        $application = ActivityApplication::create([
            'activity_name' => 'Application without an account',
            'status' => 'pending',
        ]);

        $this->patch("/admin/activity-applications/{$application->id}", [
            'status' => 'approved',
        ])->assertRedirect()
            ->assertSessionHas('success', 'Application decision saved and notification sent to the configured admin email.');

        Mail::assertSent(ActivityApplicationDecision::class, fn ($mail) =>
            $mail->application->is($application)
            && $mail->hasTo('admin@example.test')
            && str_contains($mail->render(), 'View applications'));
    }

    public function test_admin_cannot_edit_application_details(): void
    {
        $application = ActivityApplication::create([
            'activity_name' => 'Read-only application',
            'status' => 'pending',
        ]);

        $this->patch("/admin/activity-applications/{$application->id}/details", [
            'activity_name' => 'Changed by admin',
        ])->assertNotFound();

        $this->assertDatabaseHas('activity_applications', [
            'id' => $application->id,
            'activity_name' => 'Read-only application',
        ]);
    }

    public function test_admin_rejection_saves_a_required_review_note(): void
    {
        $application = ActivityApplication::create([
            'activity_name' => 'Activity to reject',
            'status' => 'pending',
        ]);

        $this->patch("/admin/activity-applications/{$application->id}", [
            'status' => 'rejected',
            'review_notes' => 'Please provide a confirmed venue booking.',
        ])->assertRedirect();

        $this->assertDatabaseHas('activity_applications', [
            'id' => $application->id,
            'status' => 'rejected',
            'review_notes' => 'Please provide a confirmed venue booking.',
        ]);
    }

    public function test_admin_can_reject_with_a_short_review_note(): void
    {
        $application = ActivityApplication::create([
            'activity_name' => 'Activity with a short rejection reason',
            'status' => 'pending',
        ]);

        $this->patch("/admin/activity-applications/{$application->id}", [
            'status' => 'rejected',
            'review_notes' => 'Fix venue',
        ])->assertRedirect();

        $this->assertDatabaseHas('activity_applications', [
            'id' => $application->id,
            'status' => 'rejected',
            'review_notes' => 'Fix venue',
        ]);
    }

    public function test_admin_cannot_reject_without_review_notes(): void
    {
        $application = ActivityApplication::create([
            'activity_name' => 'Activity missing a review note',
            'status' => 'pending',
        ]);

        $this->from('/admin')
            ->patch("/admin/activity-applications/{$application->id}", [
                'status' => 'rejected',
            ])
            ->assertRedirect('/admin')
            ->assertSessionHasErrors('review_notes');

        $this->assertDatabaseHas('activity_applications', [
            'id' => $application->id,
            'status' => 'pending',
        ]);
    }
}

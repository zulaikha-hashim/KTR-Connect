<?php

namespace Tests\Feature;

use App\Models\ActivityApplication;
use App\Models\User;
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
                ->component('Staff')
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
                ->component('Staff')
                ->has('applications', 1)
                ->where('applications.0.activity_name', 'My Activity'));
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

        $response = $this->actingAs($felo)->from('/')->post('/activity-applications', [
            'status' => 'pending',
            'activity_name' => 'KTR Sports Day',
            'organization' => 'jkm_sports',
            'start_at' => '2026-12-20T08:30',
            'end_at' => '2026-12-20T18:00',
            'venue' => 'Dewan Sri Meranti',
            'expected_turnout' => '250',
            'committee_quota' => '25',
            'participant_quota' => '225',
            'merit_tier' => 'standard',
            'merit_notes' => 'Sports charter event.',
            'proposal_document' => UploadedFile::fake()->create('proposal.pdf', 100, 'application/pdf'),
        ]);

        $response->assertRedirect('/');
        $this->assertDatabaseHas('activity_applications', [
            'activity_name' => 'KTR Sports Day',
            'organization' => 'jkm_sports',
            'status' => 'pending',
            'felo_id' => $felo->id,
            'expected_turnout' => 250,
            'committee_quota' => 25,
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
        $response = $this->from('/')->post('/activity-applications', [
            'status' => 'draft',
            'activity_name' => 'Early idea',
            'end_at' => '2026-12-20T18:00',
        ]);

        $response->assertRedirect('/');
        $this->assertDatabaseHas('activity_applications', [
            'activity_name' => 'Early idea',
            'end_at' => '2026-12-20 18:00:00',
            'status' => 'draft',
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
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_pending_application_requires_all_required_fields(): void
    {
        $this->from('/')
            ->post('/activity-applications', ['status' => 'pending'])
            ->assertRedirect('/')
            ->assertSessionHasErrors([
                'activity_name',
                'organization',
                'start_at',
                'end_at',
                'venue',
                'expected_turnout',
                'committee_quota',
                'participant_quota',
                'merit_tier',
                'proposal_document',
            ]);

        $this->assertDatabaseCount('activity_applications', 0);
    }

    public function test_pending_application_rejects_non_pdf_proposals(): void
    {
        $this->from('/')->post('/activity-applications', [
            'status' => 'pending',
            'activity_name' => 'KTR Sports Day',
            'organization' => 'jkm_sports',
            'start_at' => '2026-12-20T08:30',
            'end_at' => '2026-12-20T18:00',
            'venue' => 'Dewan Sri Meranti',
            'expected_turnout' => '250',
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

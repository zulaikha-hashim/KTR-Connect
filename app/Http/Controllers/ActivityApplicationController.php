<?php

namespace App\Http\Controllers;

use App\Mail\ActivityApplicationSubmitted;
use App\Models\ActivityApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityApplicationController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $isSubmission = $request->input('status') === 'pending';

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'pending'])],
            'activity_name' => ['required_if:status,pending', 'nullable', 'string', 'max:255'],
            'organization' => [
                'required_if:status,pending',
                'nullable',
                Rule::in(['jkm_sports', 'jkm_academic', 'jkm_cultural', 'jkm_welfare', 'felo_office']),
            ],
            'start_at' => ['required_if:status,pending', 'nullable', 'date'],
            'end_at' => [
                'required_if:status,pending',
                'nullable',
                'date',
                ...($isSubmission ? ['after_or_equal:start_at'] : []),
            ],
            'venue' => ['required_if:status,pending', 'nullable', 'string', 'max:255'],
            'expected_turnout' => ['required_if:status,pending', 'nullable', 'integer', 'min:1'],
            'committee_quota' => ['required_if:status,pending', 'nullable', 'integer', 'min:0'],
            'participant_quota' => ['required_if:status,pending', 'nullable', 'integer', 'min:0'],
            'merit_tier' => [
                'required_if:status,pending',
                'nullable',
                Rule::in(['standard', 'high_impact', 'trainer_special']),
            ],
            'merit_notes' => ['nullable', 'string', 'max:2000'],
            'proposal_document' => $isSubmission
                ? ['required', 'file', 'mimes:pdf', 'max:10240']
                : ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        $document = $validated['proposal_document'] ?? null;
        unset($validated['proposal_document']);

        $application = ActivityApplication::create([
            ...$validated,
            'felo_id' => $request->user()?->getAuthIdentifier(),
        ]);

        if ($document !== null) {
            $path = $document->store('activity-proposals', 'local');

            if ($path === false) {
                throw new RuntimeException('The proposal document could not be stored.');
            }

            $application->update(['proposal_document_path' => $path]);
        }

        if ($application->status === 'pending' && config('mail.admin_address')) {
            Mail::to(config('mail.admin_address'))->send(new ActivityApplicationSubmitted($application));
        }

        return back()->with(
            'success',
            $application->status === 'draft'
                ? 'Activity application saved as a draft.'
                : 'Activity application submitted for approval.',
        );
    }

    public function review(Request $request, ActivityApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'review_notes' => ['required_if:status,rejected', 'nullable', 'string', 'min:20', 'max:400'],
        ]);

        $updated = ActivityApplication::query()
            ->whereKey($application->getKey())
            ->where('status', 'pending')
            ->update([
                'status' => $validated['status'],
                'review_notes' => $validated['review_notes'] ?? null,
                'updated_at' => now(),
            ]);

        if ($updated !== 1) {
            abort(409, 'This application has already been reviewed.');
        }

        return back();
    }

    public function document(ActivityApplication $application): StreamedResponse
    {
        abort_unless(
            $application->proposal_document_path
                && Storage::disk('local')->exists($application->proposal_document_path),
            404,
        );

        return Storage::disk('local')->response(
            $application->proposal_document_path,
            basename($application->proposal_document_path),
            ['Content-Type' => 'application/pdf'],
            'inline',
        );
    }
}

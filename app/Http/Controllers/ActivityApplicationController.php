<?php

namespace App\Http\Controllers;

use App\Mail\ActivityApplicationSubmitted;
use App\Mail\ActivityApplicationDecision;
use App\Models\ActivityApplication;
use App\Models\ActivityApplicationDocument;
use App\Models\ActivityParticipation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityApplicationController extends Controller
{
    private const PARTICIPATION_ROLES = ['MT', 'Crew', 'Participant', 'Volunteers'];

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateApplication($request);

        $document = $validated['proposal_document'] ?? null;
        $documents = $validated['proposal_documents'] ?? [];
        unset($validated['proposal_document']);
        unset($validated['proposal_documents']);
        $this->ensureDocumentLimit($request, 0);

        $application = ActivityApplication::create([
            ...$validated,
            'felo_id' => $request->user()?->getAuthIdentifier(),
        ]);

        if ($document !== null) {
            $path = $document->store('activity-proposals', 'local');

            if ($path === false) {
                throw new RuntimeException('The paperwork document could not be stored.');
            }

            $application->update(['proposal_document_path' => $path]);
        }
        $this->storePaperworkDocuments($application, $documents);

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

    public function update(Request $request, ActivityApplication $application): RedirectResponse
    {
        $this->authorizeOwner($request, $application);
        abort_unless(in_array($application->status, ['draft', 'rejected'], true), 403);

        $validated = $this->validateApplication($request);
        $document = $validated['proposal_document'] ?? null;
        $documents = $validated['proposal_documents'] ?? [];
        unset($validated['proposal_document']);
        unset($validated['proposal_documents']);
        $this->ensureDocumentLimit(
            $request,
            $application->paperworkDocuments()->count() + ($application->proposal_document_path ? 1 : 0),
        );

        if ($document !== null) {
            $path = $document->store('activity-proposals', 'local');

            if ($path === false) {
                throw new RuntimeException('The proposal document could not be stored.');
            }

            if (
                $application->proposal_document_path
                && Storage::disk('local')->exists($application->proposal_document_path)
            ) {
                if (!Storage::disk('local')->delete($application->proposal_document_path)) {
                    Storage::disk('local')->delete($path);
                    throw new RuntimeException('The existing paperwork document could not be replaced.');
                }
            }

            $validated['proposal_document_path'] = $path;
        }

        $this->storePaperworkDocuments($application, $documents);
        $application->update($validated);
        if ($application->status === 'pending') {
            $application->update(['review_notes' => null]);

            if (config('mail.admin_address')) {
                Mail::to(config('mail.admin_address'))->send(new ActivityApplicationSubmitted($application));
            }
        }

        return back()->with(
            'success',
            $application->status === 'draft'
                ? 'Activity application saved as a draft.'
                : 'Activity application submitted for approval.',
        );
    }

    public function students(Request $request, ActivityApplication $application): Response
    {
        $this->authorizeOwner($request, $application);
        $validated = $request->validate([
            'role' => ['nullable', Rule::in(self::PARTICIPATION_ROLES)],
        ]);
        $role = $validated['role'] ?? null;

        $roleCounts = ActivityParticipation::query()
            ->where('activity_application_id', $application->id)
            ->selectRaw('role, COUNT(*) as aggregate')
            ->groupBy('role')
            ->pluck('aggregate', 'role');

        return Inertia::render('ActivityApplicationStudents', [
            'application' => $application->only([
                'id',
                'activity_name',
                'organization',
                'academic_year',
                'semester',
            ]),
            'selectedRole' => $role,
            'roleCounts' => collect(self::PARTICIPATION_ROLES)
                ->mapWithKeys(fn (string $studentRole) => [$studentRole => (int) ($roleCounts[$studentRole] ?? 0)]),
            'participations' => ActivityParticipation::query()
                ->where('activity_application_id', $application->id)
                ->when($role, fn ($query) => $query->where('role', $role))
                ->orderBy('student_name')
                ->paginate(15)
                ->withQueryString(),
        ]);
    }

    public function studentsCsv(Request $request, ActivityApplication $application): StreamedResponse
    {
        $this->authorizeOwner($request, $application);
        $validated = $request->validate([
            'role' => ['nullable', Rule::in(self::PARTICIPATION_ROLES)],
        ]);
        $query = ActivityParticipation::query()
            ->where('activity_application_id', $application->id)
            ->when($validated['role'] ?? null, fn ($query, $role) => $query->where('role', $role))
            ->orderBy('student_name');
        $filename = Str::slug($application->activity_name ?: 'activity') . '-students.csv';

        return response()->streamDownload(static function () use ($query, $application): void {
            $stream = fopen('php://output', 'wb');
            if ($stream === false) {
                throw new RuntimeException('The student CSV export could not be opened.');
            }

            fwrite($stream, "\xEF\xBB\xBF");
            $writeRow = static function (array $row) use ($stream): void {
                $row = array_map(static function ($value): string {
                    $value = (string) ($value ?? '');

                    return preg_match('/^[\t\r\n ]*[=+\-@]/', $value) === 1
                        ? "'" . $value
                        : $value;
                }, $row);

                if (fputcsv($stream, $row) === false) {
                    throw new RuntimeException('A student CSV row could not be written.');
                }
            };

            $writeRow([
                'Activity Name',
                'Student Name',
                'Student ID',
                'Gender',
                'IC Number',
                'Phone',
                'Faculty',
                'Current College',
                'Role',
                'Email',
                'Merit Allocation',
                'Academic Year',
                'Semester',
                'Additional CSV Data',
            ]);

            foreach ($query->cursor() as $participation) {
                $writeRow([
                    $application->activity_name,
                    $participation->student_name,
                    $participation->student_id,
                    $participation->gender,
                    $participation->ic_number,
                    $participation->phone_number,
                    $participation->faculty,
                    $participation->current_college,
                    $participation->role,
                    $participation->student_email,
                    $participation->merit_allocation,
                    $participation->academic_year,
                    $participation->semester,
                    json_encode($participation->additional_data ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
                ]);
            }

            fclose($stream);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function review(Request $request, ActivityApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'review_notes' => ['required_if:status,rejected', 'nullable', 'string', 'max:400'],
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

        $application->refresh();
        $application->load('felo');

        $recipient = $application->felo?->email ?: config('mail.admin_address');
        if (! $recipient) {
            Log::warning('Activity application decision email was not sent because the submitting staff account has no email address.', [
                'activity_application_id' => $application->id,
                'felo_id' => $application->felo_id,
            ]);

            return back()->with(
                'notificationWarning',
                'Decision saved, but no email was sent because this application has no linked applicant account.',
            );
        }

        Mail::to($recipient)->send(new ActivityApplicationDecision($application));

        return back()->with(
            'success',
            $application->felo?->email
                ? 'Application decision saved and staff notified.'
                : 'Application decision saved and notification sent to the configured admin email.',
        );
    }

    public function adminDestroy(ActivityApplication $application): RedirectResponse
    {
        abort_unless($application->status === 'rejected', 403);

        $application->delete();

        return back()->with('success', 'Activity application moved to the deleted items.');
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
            'attachment',
        );
    }

    public function documentFile(
        ActivityApplication $application,
        ActivityApplicationDocument $document,
    ): StreamedResponse {
        abort_unless($document->activity_application_id === $application->id, 404);
        abort_unless(Storage::disk('local')->exists($document->file_path), 404);

        return Storage::disk('local')->response(
            $document->file_path,
            $document->original_name,
            ['Content-Type' => 'application/pdf'],
            'attachment',
        );
    }

    private function validateApplication(Request $request): array
    {
        $hasStartAndEnd = $request->filled('start_at') && $request->filled('end_at');

        return $request->validate([
            'status' => ['required', Rule::in(['draft', 'pending'])],
            'activity_name' => ['required_if:status,pending', 'nullable', 'string', 'max:255'],
            'director_name' => ['required_if:status,pending', 'nullable', 'string', 'max:255'],
            'academic_year' => ['required_if:status,pending', 'nullable', 'string', 'max:9', 'regex:/^\d{4}\/\d{4}$/'],
            'semester' => ['required_if:status,pending', 'nullable', 'integer', 'between:1,2'],
            'organization' => [
                'required_if:status,pending',
                'nullable',
                'string',
                'max:255',
            ],
            'participant_quota' => ['required_if:status,pending', 'nullable', 'integer', 'min:1', 'max:4294967295'],
            'start_at' => ['required_if:status,pending', 'nullable', 'date', 'after_or_equal:today'],
            'end_at' => [
                'required_if:status,pending',
                'nullable',
                'date',
                'after_or_equal:today',
                ...($hasStartAndEnd ? ['after_or_equal:start_at'] : []),
            ],
            'venue' => ['required_if:status,pending', 'nullable', 'string', 'max:255'],
            'google_sheet_url' => ['nullable', 'string', 'url', 'max:2048', 'regex:/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[^\/\s]+/'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'latitude' => ['required_if:status,pending', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['required_if:status,pending', 'nullable', 'numeric', 'between:-180,180'],
            'proposal_document' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'proposal_documents' => ['nullable', 'array', 'max:3'],
            'proposal_documents.*' => ['file', 'mimes:pdf', 'max:10240'],
        ]);
    }

    private function ensureDocumentLimit(Request $request, int $existingCount): void
    {
        $newDocumentCount = count($request->file('proposal_documents', []))
            + ($request->hasFile('proposal_document') ? 1 : 0);
        $replacingLegacyDocument = $existingCount > 0
            && $request->hasFile('proposal_document')
            && $request->route('application') instanceof ActivityApplication
            && $request->route('application')->proposal_document_path;

        if ($existingCount + $newDocumentCount - ($replacingLegacyDocument ? 1 : 0) > 3) {
            throw ValidationException::withMessages([
                'proposal_documents' => 'An application can have a maximum of 3 paperwork PDF files.',
            ]);
        }
    }

    private function storePaperworkDocuments(ActivityApplication $application, array $documents): void
    {
        foreach ($documents as $document) {
            $path = $document->store('activity-proposals', 'local');

            if ($path === false) {
                throw new RuntimeException('A paperwork document could not be stored.');
            }

            $application->paperworkDocuments()->create([
                'original_name' => $document->getClientOriginalName(),
                'file_path' => $path,
            ]);
        }
    }

    private function authorizeOwner(Request $request, ActivityApplication $application): void
    {
        abort_unless(
            (string) $application->felo_id === (string) $request->user()?->getAuthIdentifier(),
            403,
        );
    }
}

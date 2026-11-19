<?php

namespace App\Http\Controllers\Admin\Hostel;

use App\Http\Controllers\Controller;
use App\Models\HostelStudentProfile;
use App\Services\Hostel\MockStudentImportService;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MockStudentSimulationController extends Controller
{
    public function index(
        Request $request,
        MockStudentImportService $importer
    ): Response {
        $this->ensureLocalPreview($request);

        $preview = null;
        $sourceErrors = [];

        try {
            $preview = $importer->preview();
        } catch (ValidationException $exception) {
            $sourceErrors = collect($exception->errors())
                ->flatten()
                ->values()
                ->all();
        }

        $students = HostelStudentProfile::query()
            ->where('source', 'mock_utmdigital')
            ->with('user:id,name')
            ->orderBy('matric_number')
            ->get()
            ->map(fn (HostelStudentProfile $profile) => [
                'id' => $profile->id,
                'matric_number' => $profile->matric_number,
                'full_name' => $profile->user?->name,
                'faculty' => $profile->faculty,
                'gender' => $profile->gender,
                'source' => $profile->source,
                'synced_at' => $profile->synced_at
                    ?->copy()
                    ->utc()
                    ->toIso8601String(),
            ])
            ->values();

        return Inertia::render('Hostel/StudentDataSimulation', [
            'preview' => $preview,
            'sourceErrors' => $sourceErrors,
            'students' => $students,
            'importResult' => $request->session()->get(
                'studentImportResult'
            ),
        ]);
    }

    public function importStudents(
        Request $request,
        MockStudentImportService $importer
    ): RedirectResponse {
        $this->ensureLocalPreview($request);

        $validated = $request->validate([
            'source_hash' => [
                'required',
                'string',
                'size:64',
                'regex:/^[a-f0-9]{64}$/',
            ],
        ]);

        try {
            $result = $importer->import($validated['source_hash']);
        } catch (QueryException $exception) {
            // A simultaneous import may reach a unique constraint first.
            if ((int) ($exception->errorInfo[1] ?? 0) !== 1062) {
                throw $exception;
            }

            throw ValidationException::withMessages([
                'simulation' =>
                    'A matching record was saved by another request. '
                    . 'Refresh the preview and try again.',
            ]);
        }

        return redirect()
            ->route('admin.hostel.simulation.students.index')
            ->with('studentImportResult', $result);
    }

    private function ensureLocalPreview(Request $request): void
    {
        abort_unless(
            app()->environment('local')
            && in_array(
                $request->server('REMOTE_ADDR'),
                ['127.0.0.1', '::1'],
                true
            )
            && in_array(
                $request->getHost(),
                ['127.0.0.1', 'localhost', '::1', '[::1]'],
                true
            ),
            403,
            'Student data simulation is only available locally.'
        );
    }
}
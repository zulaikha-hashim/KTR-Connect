<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityApplication;
use App\Models\ActivityParticipation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class StudentParticipationUploadController extends Controller
{
    private const MAX_IMPORT_ROWS = 10000;

    public function create(Request $request): Response
    {
        $academicYear = $request->query('academic_year');
        $semester = $request->query('semester');
        $validSession = is_string($academicYear)
            && preg_match('/^\d{4}\/\d{4}$/', $academicYear) === 1
            && in_array((string) $semester, ['1', '2'], true);
        $activitySearch = $request->query('activity_search', '');
        $activitySearch = is_string($activitySearch) ? trim($activitySearch) : '';

        return Inertia::render('UploadStudentName', [
            'approvedApplications' => ActivityApplication::query()
                ->where('status', 'approved')
                ->whereNotNull('academic_year')
                ->whereNotNull('semester')
                ->orderByDesc('created_at')
                ->get(['id', 'activity_name', 'academic_year', 'semester', 'google_sheet_url']),
            'participations' => $validSession && $activitySearch !== '' && mb_strlen($activitySearch) <= 100
                ? ActivityParticipation::query()
                    ->with('activityApplication:id,activity_name')
                    ->where('academic_year', $academicYear)
                    ->where('semester', $semester)
                    ->when($activitySearch !== '', fn ($query) => $query->whereHas(
                        'activityApplication',
                        fn ($applicationQuery) => $applicationQuery->where(
                            'activity_name',
                            'like',
                            '%' . $activitySearch . '%',
                        ),
                    ))
                    ->latest()
                    ->paginate(10)
                    ->withQueryString()
                : ['data' => [], 'links' => [], 'total' => 0],
            'selectedSession' => $validSession ? "{$academicYear}|{$semester}" : '',
            'activitySearch' => $activitySearch,
            'studentPreview' => session()->pull('studentPreview'),
            'successMessage' => session('success'),
        ]);
    }

    public function preview(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year' => ['required', 'string', 'regex:/^\d{4}\/\d{4}$/'],
            'semester' => ['required', 'integer', 'between:1,2'],
            'activity_application_id' => ['required', 'integer', Rule::exists('activity_applications', 'id')],
            'merit_allocation' => ['required', 'integer', 'between:1,1000'],
            'role' => ['required', Rule::in(['MT', 'Volunteers', 'Participant', 'Crew'])],
            'csv_file' => ['required', 'file', 'extensions:csv', 'max:10240'],
        ]);

        $application = ActivityApplication::query()
            ->whereKey($validated['activity_application_id'])
            ->where('status', 'approved')
            ->where('academic_year', $validated['academic_year'])
            ->where('semester', $validated['semester'])
            ->first();

        if (! $application) {
            throw ValidationException::withMessages([
                'activity_application_id' => 'Choose an approved activity in the selected semester and session.',
            ]);
        }

        $rows = $this->readStudentRows($validated['csv_file']->getRealPath());
        $rows = array_map(
            fn (array $row, int $index) => [...$row, 'id' => $index + 1, 'role' => $validated['role']],
            $rows,
            array_keys($rows),
        );

        return redirect()->route('admin.students.upload.create', [
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
        ])->with('studentPreview', [
            'academic_year' => $validated['academic_year'],
            'semester' => (int) $validated['semester'],
            'activity_application_id' => (int) $validated['activity_application_id'],
            'activity_name' => $application->activity_name,
            'merit_allocation' => (int) $validated['merit_allocation'],
            'role' => $validated['role'],
            'rows' => $rows,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year' => ['required', 'string', 'regex:/^\d{4}\/\d{4}$/'],
            'semester' => ['required', 'integer', 'between:1,2'],
            'activity_application_id' => ['required', 'integer', Rule::exists('activity_applications', 'id')],
            'merit_allocation' => ['required', 'integer', 'between:1,1000'],
            'role' => ['required', Rule::in(['MT', 'Volunteers', 'Participant', 'Crew'])],
            'rows' => ['required', 'array', 'min:1', 'max:' . self::MAX_IMPORT_ROWS],
            'rows.*.student_id' => ['nullable', 'string', 'max:64'],
            'rows.*.student_name' => ['nullable', 'string', 'max:255'],
            'rows.*.gender' => ['nullable', 'string', 'max:32'],
            'rows.*.ic_number' => ['nullable', 'string', 'max:32'],
            'rows.*.phone_number' => ['nullable', 'string', 'max:32'],
            'rows.*.faculty' => ['nullable', 'string', 'max:255'],
            'rows.*.current_college' => ['nullable', 'string', 'max:255'],
            'rows.*.student_email' => ['nullable', 'email', 'max:255'],
            'rows.*.additional_data' => ['present', 'array'],
        ]);

        $application = ActivityApplication::query()
            ->whereKey($validated['activity_application_id'])
            ->where('status', 'approved')
            ->where('academic_year', $validated['academic_year'])
            ->where('semester', $validated['semester'])
            ->first();

        if (! $application) {
            throw ValidationException::withMessages([
                'activity_application_id' => 'Choose an approved activity in the selected semester and session.',
            ]);
        }

        $seenIds = [];
        foreach ($validated['rows'] as $row) {
            $studentId = trim((string) ($row['student_id'] ?? ''));
            if ($studentId === '') {
                continue;
            }

            $normalizedId = strtoupper($studentId);
            if (isset($seenIds[$normalizedId])) {
                throw ValidationException::withMessages([
                    'rows' => "Student ID {$studentId} appears more than once. Correct the list before saving.",
                ]);
            }
            $seenIds[$normalizedId] = true;
        }

        $now = now()->toDateTimeString();
        $rows = $validated['rows'];
        $records = array_map(fn (array $row) => [
            'activity_application_id' => $application->id,
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
            'student_id' => $row['student_id'] ?? null,
            'student_name' => $row['student_name'] ?? null,
            'gender' => $row['gender'] ?? null,
            'ic_number' => $row['ic_number'] ?? null,
            'phone_number' => $row['phone_number'] ?? null,
            'faculty' => $row['faculty'] ?? null,
            'current_college' => $row['current_college'] ?? null,
            'role' => $validated['role'],
            'student_email' => $row['student_email'] ?? null,
            'additional_data' => json_encode($row['additional_data'], JSON_THROW_ON_ERROR),
            'merit_allocation' => $validated['merit_allocation'],
            'created_at' => $now,
            'updated_at' => $now,
        ], $rows);

        $existingIds = [];
        foreach (array_chunk(array_column($records, 'student_id'), 500) as $studentIds) {
            $existing = DB::table('activity_participations')
                ->where('activity_application_id', $application->id)
                ->where('academic_year', $validated['academic_year'])
                ->where('semester', $validated['semester'])
                ->whereIn('student_id', $studentIds)
                ->pluck('student_id');

            foreach ($existing as $studentId) {
                $existingIds[$studentId] = true;
            }
        }

        DB::transaction(function () use ($records): void {
            foreach (array_chunk($records, 80) as $recordChunk) {
                DB::table('activity_participations')->upsert(
                    $recordChunk,
                    ['activity_application_id', 'academic_year', 'semester', 'student_id'],
                    [
                        'student_name',
                        'gender',
                        'ic_number',
                        'phone_number',
                        'faculty',
                        'current_college',
                        'role',
                        'student_email',
                        'additional_data',
                        'merit_allocation',
                        'updated_at',
                    ],
                );
            }
        });

        $updatedCount = count($existingIds);
        $createdCount = count($records) - $updatedCount;

        return redirect()->route('admin.students.upload.create', [
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
        ])->with(
            'success',
            sprintf(
                'Imported %d students: %d new and %d updated.',
                count($records),
                $createdCount,
                $updatedCount,
            ),
        );
    }

    public function update(Request $request, ActivityParticipation $participation): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => [
                'required',
                'string',
                'max:64',
                Rule::unique('activity_participations', 'student_id')
                    ->where(fn ($query) => $query
                        ->where('activity_application_id', $participation->activity_application_id)
                        ->where('academic_year', $participation->academic_year)
                        ->where('semester', $participation->semester))
                    ->ignore($participation->id),
            ],
            'student_name' => ['required', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'max:32'],
            'ic_number' => ['required', 'string', 'max:32'],
            'phone_number' => ['required', 'string', 'max:32'],
            'faculty' => ['required', 'string', 'max:255'],
            'current_college' => ['nullable', 'string', 'max:255'],
            'role' => ['required', Rule::in(['MT', 'Volunteers', 'Participant', 'Crew'])],
            'student_email' => ['nullable', 'email', 'max:255'],
            'additional_data' => ['required', 'json'],
        ]);

        $validated['additional_data'] = json_decode(
            $validated['additional_data'],
            true,
            512,
            JSON_THROW_ON_ERROR,
        );

        $participation->update($validated);

        return redirect()->route('admin.students.upload.create', [
            'academic_year' => $participation->academic_year,
            'semester' => $participation->semester,
        ])->with('success', 'Student participation details updated.');
    }

    public function rules(): HttpResponse
    {
        $lines = [
            'Student Participation CSV - Upload Rules',
            '',
            'Choose an approved activity and the matching semester/session before uploading.',
            'The selected merit allocation is applied to every student in that upload.',
            'The selected role is applied to every student in that upload.',
            '',
            'Required CSV columns (one header row):',
            'student_id or matric_no, name, ic_number, phone_number, faculty',
            'Optional columns: current_college, gender, and email. Any other columns are retained as additional student data.',
            '',
            'Header aliases are accepted for student ID, name, gender, IC, phone, and college fields.',
            'Use one row per student. Quote values that contain commas.',
            'Keep the original student ID when possible so later uploads update that record.',
            'Duplicate non-empty student IDs in one file are not accepted.',
            'Blank required values are allowed during import and must be corrected by staff.',
            'Staff can review the records below the form and edit incomplete or inaccurate data.',
            '',
            'File limits: CSV only, maximum 10 MB and 10,000 student rows.',
        ];

        $content = "BT\n/F1 16 Tf\n72 740 Td\n";
        $content .= '(' . $this->escapePdfText(array_shift($lines)) . ") Tj\n/F1 10 Tf\n";

        foreach ($lines as $line) {
            $wrappedLines = $line === '' ? [''] : explode("\n", wordwrap($line, 88, "\n", true));
            foreach ($wrappedLines as $wrappedLine) {
                $content .= "0 -20 Td\n(" . $this->escapePdfText($wrappedLine) . ") Tj\n";
            }
        }

        $content .= "ET";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            '<< /Length ' . strlen($content) . " >>\nstream\n{$content}\nendstream",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($index + 1) . " 0 obj\n{$object}\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
        foreach (array_slice($offsets, 1) as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }
        $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xrefOffset}\n%%EOF";

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="student-data-upload-rules.pdf"',
        ]);
    }

    private function escapePdfText(string $text): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
    }

    /**
     * @return list<array{
     *     student_id: ?string,
     *     student_name: ?string,
     *     gender: ?string,
     *     ic_number: ?string,
     *     phone_number: ?string,
     *     faculty: ?string,
     *     current_college: ?string,
     *     student_email: ?string,
     *     additional_data: array<string, string>
     * }>
     */
    private function readStudentRows(string $path): array
    {
        $handle = fopen($path, 'rb');

        if ($handle === false) {
            throw ValidationException::withMessages([
                'csv_file' => 'The uploaded CSV file could not be read.',
            ]);
        }

        try {
            $headers = fgetcsv($handle, null, ',', '"', '');

            if (! is_array($headers) || $headers === []) {
                throw ValidationException::withMessages([
                    'csv_file' => 'The CSV file must include a header row with all required student columns.',
                ]);
            }

            $originalHeaders = [];
            $normalizedHeaders = [];
            foreach ($headers as $index => $header) {
                $original = trim((string) $header);
                if ($index === 0) {
                    $original = preg_replace('/^\xEF\xBB\xBF/', '', $original);
                }

                $normalized = strtolower((string) preg_replace('/[\s-]+/', '_', $original));
                if ($normalized === '' || in_array($normalized, $normalizedHeaders, true)) {
                    throw ValidationException::withMessages([
                        'csv_file' => 'The CSV header row contains an empty or duplicate column name.',
                    ]);
                }

                $originalHeaders[] = $original;
                $normalizedHeaders[] = $normalized;
            }

            $studentIdColumns = $this->matchingColumns(
                $normalizedHeaders,
                ['student_id', 'matric_no', 'no_matrix', 'matric', 'matric_number', 'matriculation_number'],
            );
            $studentNameColumns = $this->matchingColumns(
                $normalizedHeaders,
                ['name', 'student_name', 'full_name'],
            );
            $genderColumns = $this->matchingColumns(
                $normalizedHeaders,
                ['gender', 'sex'],
            );
            $icColumns = $this->matchingColumns(
                $normalizedHeaders,
                ['ic_number', 'ic_no', 'ic', 'identity_card', 'national_id'],
            );
            $phoneColumns = $this->matchingColumns(
                $normalizedHeaders,
                ['phone_number', 'phone', 'mobile', 'contact_number'],
            );
            $facultyColumns = $this->matchingColumns(
                $normalizedHeaders,
                ['faculty', 'faculty_name'],
            );
            $collegeColumns = $this->matchingColumns(
                $normalizedHeaders,
                ['current_college', 'current_stayed_college', 'college', 'residential_college', 'current_residence'],
            );
            $emailColumns = $this->matchingColumns(
                $normalizedHeaders,
                ['email', 'student_email'],
            );

            $requiredColumns = [
                $studentIdColumns,
                $studentNameColumns,
                $icColumns,
                $phoneColumns,
                $facultyColumns,
            ];
            if (
                count(array_filter($requiredColumns, fn (array $columns) => count($columns) === 1)) !== count($requiredColumns)
                || count($emailColumns) > 1
                || count($genderColumns) > 1
                || count($collegeColumns) > 1
            ) {
                throw ValidationException::withMessages([
                    'csv_file' => 'Include one column each for student ID, name, IC number, phone number, and faculty. Current college, gender, and email are optional.',
                ]);
            }

            $studentIdIndex = $studentIdColumns[0];
            $studentNameIndex = $studentNameColumns[0];
            $genderIndex = $genderColumns[0] ?? null;
            $icIndex = $icColumns[0];
            $phoneIndex = $phoneColumns[0];
            $facultyIndex = $facultyColumns[0];
            $collegeIndex = $collegeColumns[0] ?? null;
            $emailIndex = $emailColumns[0] ?? null;
            $rows = [];
            $seenIds = [];
            $recordNumber = 1;

            while (($columns = fgetcsv($handle, null, ',', '"', '')) !== false) {
                $recordNumber++;

                if (count(array_filter(
                    $columns,
                    fn ($value) => $value !== null && trim((string) $value) !== '',
                )) === 0) {
                    continue;
                }

                if (count($columns) !== count($originalHeaders)) {
                    throw ValidationException::withMessages([
                        'csv_file' => "CSV record {$recordNumber} has a different number of values than the header.",
                    ]);
                }

                $studentId = trim((string) $columns[$studentIdIndex]);
                $studentName = trim((string) $columns[$studentNameIndex]);
                $gender = $genderIndex === null ? '' : trim((string) $columns[$genderIndex]);
                $icNumber = trim((string) $columns[$icIndex]);
                $phoneNumber = trim((string) $columns[$phoneIndex]);
                $faculty = trim((string) $columns[$facultyIndex]);
                $currentCollege = $collegeIndex === null ? '' : trim((string) $columns[$collegeIndex]);
                $studentEmail = $emailIndex === null ? '' : trim((string) $columns[$emailIndex]);

                if (
                    strlen($studentId) > 64
                    || strlen($studentName) > 255
                    || strlen($gender) > 32
                    || strlen($icNumber) > 32
                    || strlen($phoneNumber) > 32
                    || strlen($faculty) > 255
                    || strlen($currentCollege) > 255
                ) {
                    throw ValidationException::withMessages([
                        'csv_file' => "CSV record {$recordNumber} has a value that exceeds the allowed field length.",
                    ]);
                }

                if ($studentId !== '') {
                    $normalizedId = strtoupper($studentId);
                    if (isset($seenIds[$normalizedId])) {
                        throw ValidationException::withMessages([
                            'csv_file' => "CSV record {$recordNumber} repeats student ID {$studentId}.",
                        ]);
                    }
                    $seenIds[$normalizedId] = true;
                }

                if ($studentEmail !== '' && (
                    strlen($studentEmail) > 255
                    || Validator::make(['email' => $studentEmail], ['email' => ['email']])->fails()
                )) {
                    throw ValidationException::withMessages([
                        'csv_file' => "CSV record {$recordNumber} contains an invalid email address.",
                    ]);
                }

                $additionalData = [];
                foreach ($columns as $index => $value) {
                    if (
                        $index === $studentIdIndex
                        || $index === $studentNameIndex
                        || $index === $genderIndex
                        || $index === $icIndex
                        || $index === $phoneIndex
                        || $index === $facultyIndex
                        || $index === $collegeIndex
                        || $index === $emailIndex
                    ) {
                        continue;
                    }

                    $value = trim((string) $value);
                    if ($value !== '') {
                        $additionalData[$originalHeaders[$index]] = $value;
                    }
                }

                $rows[] = [
                    'student_id' => $studentId === '' ? null : $studentId,
                    'student_name' => $studentName === '' ? null : $studentName,
                    'gender' => $gender === '' ? null : $gender,
                    'ic_number' => $icNumber === '' ? null : $icNumber,
                    'phone_number' => $phoneNumber === '' ? null : $phoneNumber,
                    'faculty' => $faculty === '' ? null : $faculty,
                    'current_college' => $currentCollege === '' ? null : $currentCollege,
                    'student_email' => $studentEmail === '' ? null : $studentEmail,
                    'additional_data' => $additionalData,
                ];

                if (count($rows) > self::MAX_IMPORT_ROWS) {
                    throw ValidationException::withMessages([
                        'csv_file' => 'The CSV file cannot contain more than 10,000 student records.',
                    ]);
                }
            }

            if ($rows === []) {
                throw ValidationException::withMessages([
                    'csv_file' => 'The CSV file does not contain any student records.',
                ]);
            }

            return $rows;
        } finally {
            fclose($handle);
        }
    }

    /**
     * @param  list<string>  $headers
     * @param  list<string>  $aliases
     * @return list<int>
     */
    private function matchingColumns(array $headers, array $aliases): array
    {
        $indexes = [];

        foreach ($headers as $index => $header) {
            if (in_array($header, $aliases, true)) {
                $indexes[] = $index;
            }
        }

        return $indexes;
    }
}

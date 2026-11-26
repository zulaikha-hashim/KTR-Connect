<?php

namespace App\Http\Controllers;

use App\Models\AcademicSession;
use App\Models\ParticipationImportBatch;
use App\Models\StudentCommitteePosition;
use App\Models\StudentParticipation;
use App\Support\ParticipationText;
use DateTimeImmutable;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as SpreadsheetDate;
use Throwable;

class StudentParticipationController extends Controller
{
    private const COLUMNS = [
        'participation' => ['matric_number', 'student_name', 'activity_name', 'activity_date'],
        'committee' => ['matric_number', 'student_name', 'activity_name', 'position', 'activity_date'],
    ];

    private function modelFor(string $type): string
    {
        abort_unless(isset(self::COLUMNS[$type]), 404);
        return $type === 'participation' ? StudentParticipation::class : StudentCommitteePosition::class;
    }

    public function index(Request $request): Response
    {
        $sessions = AcademicSession::orderByDesc('name')->get();
        $default = $sessions->firstWhere('is_current', true)?->id ?? $sessions->first()?->id;
        $sessionId = (int) $request->query('session', $default);
        if (!$sessions->contains('id', $sessionId)) $sessionId = (int) $default;

        $batches = ParticipationImportBatch::query()
            ->where('academic_session_id', $sessionId)
            ->withCount(['participations', 'committees'])
            ->orderByDesc('id')
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'type' => $b->type,
                'original_filename' => $b->original_filename,
                'activity_name' => $b->activity_name,
                'activity_date' => $b->activity_date?->format('Y-m-d'),
                'imported_count' => $b->imported_count,
                'remaining_count' => $b->type === 'committee' ? $b->committees_count : $b->participations_count,
                'created_at' => $b->created_at?->format('d M Y, h:i A'),
            ]);

        $results = [];
        $filters = [];
        foreach (self::COLUMNS as $type => $_) {
            $search = trim((string) $request->query("{$type}_search", ''));
            $sort = (string) $request->query("{$type}_sort", 'activity_date');
            $direction = (string) $request->query("{$type}_direction", 'desc');
            $batch = (string) $request->query("{$type}_batch", 'all');
            if (!in_array($sort, ['activity_name', 'activity_date'], true)) $sort = 'activity_date';
            if (!in_array($direction, ['asc', 'desc'], true)) $direction = 'desc';
            if ($batch !== 'all' && $batch !== 'legacy' && !ctype_digit($batch)) $batch = 'all';

            $filters[$type] = compact('search', 'sort', 'direction', 'batch');
            $query = $this->modelFor($type)::query()
                ->with('importBatch:id,original_filename')
                ->where('academic_session_id', $sessionId);

            if ($batch === 'legacy') {
                $query->whereNull('import_batch_id');
            } elseif ($batch !== 'all') {
                $query->whereHas('importBatch', fn ($q) => $q->where('id', (int) $batch)
                    ->where('type', $type)->where('academic_session_id', $sessionId));
            }
            if ($search !== '') {
                $pattern = '%' . addcslashes($search, '%_\\') . '%';
                $query->where(function ($q) use ($pattern, $type) {
                    $q->where('matric_number', 'like', $pattern)
                        ->orWhere('student_name', 'like', $pattern)
                        ->orWhere('activity_name', 'like', $pattern)
                        ->orWhere('activity_date', 'like', $pattern);
                    if ($type === 'committee') $q->orWhere('position', 'like', $pattern);
                });
            }
            $page = $type === 'participation' ? 'participation_page' : 'committee_page';
            $results[$type] = $query->orderBy($sort, $direction)->orderBy('id', $direction)
                ->paginate(30, ['*'], $page)->withQueryString();
        }
        return Inertia::render('StudentParticipation', [
            'sessions' => $sessions->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'is_current' => $s->is_current])->all(),
            'selectedSession' => $sessionId,
            'participations' => $results['participation'],
            'committees' => $results['committee'],
            'batches' => $batches->values()->all(),
            'filters' => $filters,
            'importReport' => session('importReport'),
            'notice' => session('notice'),
        ]);
    }

    public function import(Request $request, string $type): RedirectResponse
    {
        $model = $this->modelFor($type);
        $validated = $request->validate([
            'academic_session_id' => ['required', 'integer', Rule::exists('academic_sessions', 'id')],
            'file' => ['required', 'file', 'max:10240', 'mimes:csv,txt,xls,xlsx,ods'],
        ]);
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, ['csv', 'xls', 'xlsx', 'ods'], true)) {
            return back()->withErrors(['file' => 'Upload a CSV, XLS, XLSX or ODS file.']);
        }
        $spreadsheet = null;
        try {
            $reader = IOFactory::createReaderForFile($file->getRealPath());
            $reader->setReadDataOnly(false); // Excel number/date format needed
            $spreadsheet = $reader->load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $columns = self::COLUMNS[$type];
            $headers = [];
            $lastCol = Coordinate::columnIndexFromString($sheet->getHighestDataColumn(1));
            for ($col = 1; $col <= $lastCol; $col++) {
                $headers[] = strtolower(trim(ltrim((string) $sheet->getCell([$col, 1])->getValue(), "\xEF\xBB\xBF")));
            }
            while ($headers && end($headers) === '') array_pop($headers);
            if ($headers !== $columns) {
                return back()->withErrors(['file' => 'Incorrect headings. Expected: '.implode(', ', $columns).'. Found: '.implode(', ', $headers)]);
            }

            $report = ['type' => $type, 'filename' => $file->getClientOriginalName(), 'imported' => 0,
                'duplicates' => 0, 'invalid' => 0, 'errors' => [], 'processed' => 0];
            $isCsv = $extension === 'csv';
            $rows = [];
            $activityKey = null;
            $highest = $sheet->getHighestDataRow();

            // Validate first; no database changes if file mixes different activities.
            for ($r = 2; $r <= $highest; $r++) {
                $values = [];
                $cells = [];
                foreach ($columns as $i => $heading) {
                    $cell = $sheet->getCell([$i + 1, $r]);
                    $cells[$heading] = $cell;
                    $values[$heading] = trim((string) ($cell->getValue() ?? ''));
                }
                if (!array_filter($values, fn ($value) => $value !== '')) continue;
                $report['processed']++;
                if ($report['processed'] > 5000) return back()->withErrors(['file' => 'Maximum 5,000 nonempty rows per file.']);

                $values['matric_number'] = strtoupper(trim($values['matric_number']));
                $values['student_name'] = ParticipationText::normalize($values['student_name']);
                $values['activity_name'] = ParticipationText::normalize($values['activity_name'], true);
                if ($type === 'committee') $values['position'] = strtoupper($values['position']);
                $date = $this->normalizeDate($cells['activity_date'], $isCsv);
                $values['activity_date'] = $date ?? $values['activity_date'];
                $rules = [
                    'matric_number' => ['required', 'string', 'max:40', 'regex:/^[A-Z0-9\/-]+$/'],
                    'student_name' => ['required', 'string', 'max:255'],
                    'activity_name' => ['required', 'string', 'max:255'],
                    'activity_date' => ['required', 'date_format:Y-m-d'],
                ];
                if ($type === 'committee') $rules['position'] = ['required', Rule::in(['AJK', 'HOD', 'MT'])];
                $validator = Validator::make($values, $rules);
                if ($validator->fails() || !$date) {
                    $report['invalid']++;
                    if (count($report['errors']) < 100) {
                        $msgs = $validator->errors()->all();
                        if (!$date && !$msgs) $msgs[] = 'Invalid activity date.';
                        $report['errors'][] = ['row' => $r, 'message' => implode(' ', $msgs)];
                    }
                    continue;
                }
                $key = $values['activity_name'] . '|' . $values['activity_date'];
                if ($activityKey !== null && $key !== $activityKey) {
                    return back()->withErrors(['file' => 'Each file must contain only one activity and one activity date. Check row '.$r.'. No records were imported.']);
                }
                $activityKey = $key;
                $rows[] = ['row' => $r, 'values' => $values];
            }
            if (!$rows) {
                return back()->withErrors(['file' => 'No valid rows found. Check the template or correct the invalid values.']);
            }

            // A file is a batch. Each successfully inserted row is associated with that batch.
            // Duplicate rows already present in another batch are skipped and remain owned by their original batch.
            DB::transaction(function () use ($validated, $file, $model, $type, $rows, &$report) {
                $first = $rows[0]['values'];
                $batch = ParticipationImportBatch::create([
                    'academic_session_id' => (int) $validated['academic_session_id'],
                    'type' => $type,
                    'original_filename' => $file->getClientOriginalName(),
                    'activity_name' => $first['activity_name'],
                    'activity_date' => $first['activity_date'],
                ]);
                foreach ($rows as $row) {
                    $v = $row['values'];
                    $unique = [
                        'academic_session_id' => (int) $validated['academic_session_id'],
                        'matric_number' => $v['matric_number'],
                        'activity_name' => $v['activity_name'],
                        'activity_date' => $v['activity_date'],
                    ];
                    $details = [
                        'student_name' => $v['student_name'],
                        'import_batch_id' => $batch->id,
                    ];
                    if ($type === 'committee') $details['position'] = $v['position'];
                    try {
                        $record = $model::query()->createOrFirst($unique, $details);
                        $report[$record->wasRecentlyCreated ? 'imported' : 'duplicates']++;
                    } catch (Throwable $e) {
                        $report['invalid']++;
                        if (count($report['errors']) < 100) {
                            $report['errors'][] = ['row' => $row['row'], 'message' => 'Could not save this row. Review its values.'];
                        }
                        report($e);
                    }
                }
                if ($report['imported'] === 0) {
                    // Don't display an empty file entry if every row was a duplicate.
                    $batch->delete();
                } else {
                    $batch->update([
                        'imported_count' => $report['imported'],
                        'duplicate_count' => $report['duplicates'],
                        'invalid_count' => $report['invalid'],
                    ]);
                    $report['batch_id'] = $batch->id;
                }
            });
            return redirect()->route('staff.participation.index', ['session' => $validated['academic_session_id']])
                ->with('importReport', $report);
        } catch (Throwable $e) {
            report($e);
            return back()->withErrors(['file' => 'Could not read or import this file. Check the format and values.']);
        } finally {
            if ($spreadsheet) $spreadsheet->disconnectWorksheets();
        }
    }

    public function update(Request $request, string $type, int $record): RedirectResponse
    {
        $model = $this->modelFor($type);
        $item = $model::findOrFail($record);
        $data = $request->validate([
            'matric_number' => ['required', 'string', 'max:40', 'regex:/^[A-Za-z0-9\/-]+$/'],
            'student_name' => ['required', 'string', 'max:255'],
            'activity_name' => ['required', 'string', 'max:255'],
            'activity_date' => ['required', 'date_format:Y-m-d'],
            ...($type === 'committee' ? ['position' => ['required', Rule::in(['AJK', 'HOD', 'MT'])]] : []),
        ]);
        $data['matric_number'] = strtoupper(trim($data['matric_number']));
        $data['student_name'] = ParticipationText::normalize($data['student_name']);
        $data['activity_name'] = ParticipationText::normalize($data['activity_name'], true);
        $existing = $model::query()->where('academic_session_id', $item->academic_session_id)
            ->where('matric_number', $data['matric_number'])
            ->where('activity_name', $data['activity_name'])
            ->whereDate('activity_date', $data['activity_date'])
            ->whereKeyNot($item->id)->exists();
        if ($existing) return back()->withErrors(['matric_number' => 'This participation record already exists.']);
        try {
            $item->update($data);
        } catch (UniqueConstraintViolationException $e) {
            return back()->withErrors(['matric_number' => 'This would duplicate an existing record.']);
        }
        return back()->with('notice', 'Record updated successfully.');
    }

    public function destroy(string $type, int $record): RedirectResponse
    {
        $model = $this->modelFor($type);
        $model::findOrFail($record)->delete();
        return back()->with('notice', 'Record deleted successfully.');
    }

    public function destroyBatch(Request $request, int $batch): RedirectResponse
    {
        $validated = $request->validate(['confirmation' => ['required', 'in:DELETE']]);
        $file = ParticipationImportBatch::findOrFail($batch);
        $deleted = DB::transaction(function () use ($file) {
            // Delete only records successfully imported by this specific file.
            $model = $this->modelFor($file->type);
            $count = $model::query()->where('import_batch_id', $file->id)->delete();
            $file->delete();
            return $count;
        });
        return back()->with('notice', "Deleted {$deleted} records imported by the selected file.");
    }

    public function destroyAll(Request $request, string $type): RedirectResponse
    {
        $this->modelFor($type);
        $validated = $request->validate([
            'scope' => ['required', Rule::in(['session', 'all'])],
            'academic_session_id' => ['required_if:scope,session', 'nullable', 'integer', Rule::exists('academic_sessions', 'id')],
            'confirmation' => ['required', 'in:DELETE'],
        ]);
        $query = $this->modelFor($type)::query();
        if ($validated['scope'] === 'session') $query->where('academic_session_id', $validated['academic_session_id']);
        $count = DB::transaction(function () use ($query, $type, $validated) {
            $deleted = $query->delete();
            $batchQuery = ParticipationImportBatch::where('type', $type);
            if ($validated['scope'] === 'session') {
                $batchQuery->where('academic_session_id', $validated['academic_session_id']);
            }
            $batchQuery->delete();
            return $deleted;
        });
        return back()->with('notice', "Deleted {$count} {$type} records.");
    }

    private function normalizeDate(Cell $cell, bool $isCsv): ?string
    {
        $value = $cell->getValue();
        if (!$isCsv && is_numeric($value) && SpreadsheetDate::isDateTime($cell)) {
            return SpreadsheetDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
        }
        $text = trim((string) $value);
        foreach ($isCsv ? ['Y-m-d'] : ['Y-m-d', 'd-M-Y', 'j F Y', 'j M Y'] as $format) {
            $date = DateTimeImmutable::createFromFormat('!' . $format, $text);
            if ($date && $date->format($format) === $text) return $date->format('Y-m-d');
        }
        return null;
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\AcademicSession;
use App\Models\BusSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Throwable;

class BusScheduleController extends Controller
{
    // Show the schedule for the chosen academic session.
    public function index(Request $request)
    {
        $sessions = AcademicSession::query()->orderByDesc('name')->get();
        $current = $sessions->firstWhere('is_current', true);
        $defaultSession = $current ?? $sessions->first();

        $requested = (string) $request->query('session', (string) ($defaultSession?->id ?? ''));
        $selectedSession = $requested === 'unassigned'
            ? 'unassigned'
            : ($sessions->contains('id', (int) $requested) && ctype_digit($requested)
                ? $requested
                : (string) ($defaultSession?->id ?? ''));

        $scheduleQuery = BusSchedule::query()->latest('id');

        if ($selectedSession === 'unassigned') {
            $scheduleQuery->whereNull('academic_session_id');
        } elseif ($selectedSession !== '') {
            $scheduleQuery->where('academic_session_id', (int) $selectedSession);
        } else {
            $scheduleQuery->whereRaw('1 = 0');
        }

        $schedule = $scheduleQuery->first();

        return Inertia::render('BusSchedule', [
            'schedule' => $schedule ? [
                'id' => $schedule->id,
                'title' => $schedule->title,
                'original_name' => $schedule->original_name,
                'size' => $schedule->size,
                'updated_at' => $schedule->updated_at?->format('d M Y, h:i A'),
                'url' => Storage::disk('public')->url($schedule->file_path),
                'academic_session_id' => $schedule->academic_session_id,
            ] : null,
            'sessions' => $sessions->map(fn ($session) => [
                'id' => $session->id,
                'name' => $session->name,
                'is_current' => $session->is_current,
            ])->values()->all(),
            'selectedSession' => $selectedSession,
            'hasUnassignedSchedules' => BusSchedule::query()
                ->whereNull('academic_session_id')->exists(),
        ]);
    }

    // Upload or replace a PDF only for the chosen academic session.
    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_session_id' => [
                'required',
                'integer',
                Rule::exists('academic_sessions', 'id'),
            ],
            'schedule' => [
                'required',
                'file',
                File::types(['pdf'])->max('10mb'),
                'extensions:pdf',
            ],
        ]);

        $file = $request->file('schedule');
        $path = $file->store('bus-schedules', 'public');

        if (!$path) {
            return back()->withErrors([
                'schedule' => 'Could not save the PDF.',
            ]);
        }

        try {
            $oldPaths = DB::transaction(function () use ($file, $path, $validated) {
                $sessionId = (int) $validated['academic_session_id'];

                // Serialise uploads for the same session.
                AcademicSession::query()->whereKey($sessionId)->lockForUpdate()->firstOrFail();

                $oldSchedules = BusSchedule::query()
                    ->where('academic_session_id', $sessionId)
                    ->lockForUpdate()
                    ->get();

                BusSchedule::create([
                    'title' => 'KTR Bus Schedule',
                    'original_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'size' => $file->getSize(),
                    'academic_session_id' => $sessionId,
                ]);

                $oldPaths = $oldSchedules->pluck('file_path')->all();

                if ($oldSchedules->isNotEmpty()) {
                    BusSchedule::query()
                        ->whereIn('id', $oldSchedules->pluck('id')->all())
                        ->delete();
                }

                return $oldPaths;
            });
        } catch (Throwable $e) {
            Storage::disk('public')->delete($path);
            throw $e;
        }

        // File deletion happens only after the database transaction succeeds.
        foreach ($oldPaths as $oldPath) {
            if ($oldPath !== $path) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        return redirect()->route('admin.bus-schedule', [
            'session' => $validated['academic_session_id'],
        ])->with('success', 'Bus schedule uploaded successfully!');
    }
}
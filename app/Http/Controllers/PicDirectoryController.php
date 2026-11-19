<?php

namespace App\Http\Controllers;

use App\Models\PicDirectory;
use App\Models\AcademicSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Throwable;

class PicDirectoryController extends Controller
{
    // Display PIC records for admin management
    public function index(Request $request)
    {
        $sessions = AcademicSession::orderByDesc('name')->get();

        $currentSession = $sessions->firstWhere('is_current', true);

        $selectedSession = $request->query(
            'session',
            $currentSession?->id ?? 'all'
        );

        $query = PicDirectory::with('academicSessions')
            ->orderBy('name');

        if ($selectedSession !== 'all') {
            $query->whereHas('academicSessions', function ($q) use ($selectedSession) {
                $q->where('academic_sessions.id', $selectedSession);
            });
        }

        $personnel = $query->get();

        return Inertia::render('PicDirectoryManagement', [
            'personnel' => $personnel->map(
                fn ($person) => $this->formatPerson($person)
            )->values()->all(),

            'sessions' => $this->formatSessions($sessions),

            'selectedSession' => (string) $selectedSession,
        ]);
    }

    // Display PIC records for students and public users
    public function publicIndex(Request $request)
    {
        $sessions = AcademicSession::orderByDesc('name')->get();

        $currentSession = $sessions->firstWhere('is_current', true);

        $selectedSession = $request->query(
            'session',
            $currentSession?->id ?? 'all'
        );

        $query = PicDirectory::with('academicSessions')
            ->orderBy('name');

        if ($selectedSession !== 'all') {
            $query->whereHas('academicSessions', function ($q) use ($selectedSession) {
                $q->where('academic_sessions.id', $selectedSession);
            });
        }

        $personnel = $query->get();

        return Inertia::render('PicDirectoryPublic', [
            'personnel' => $personnel->map(
                fn ($person) => $this->formatPerson($person)
            )->values()->all(),

            'sessions' => $this->formatSessions($sessions),

            'selectedSession' => (string) $selectedSession,
        ]);
    }

    // Add a new PIC and assign academic sessions
    public function store(Request $request)
    {
        $validated = $request->validate([
            'photo' => [
                'required',
                File::image()->max('5mb'),
            ],
            'name' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:30'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('pic_directory', 'email'),
            ],
            'role' => ['required', 'string', 'max:100'],

            'academic_session_ids' => [
                'required',
                'array',
                'min:1',
            ],
            'academic_session_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('academic_sessions', 'id'),
            ],
        ]);

        $sessionIds = $validated['academic_session_ids'];

        $path = $request->file('photo')
            ->store('pic-photos', 'public');

        try {
            DB::transaction(function () use ($validated, $sessionIds, $path) {
                $picDirectory = PicDirectory::create([
                    'photo_path' => $path,
                    'name' => $validated['name'],
                    'contact_number' => $validated['contact_number'],
                    'email' => $validated['email'],
                    'role' => $validated['role'],
                ]);

                $picDirectory->academicSessions()->sync($sessionIds);
            });
        } catch (Throwable $e) {
            Storage::disk('public')->delete($path);

            throw $e;
        }

        return back()->with(
            'success',
            'PIC added successfully!'
        );
    }

    // Update PIC information and academic session assignments
    public function update(Request $request, PicDirectory $picDirectory)
    {
        $validated = $request->validate([
            'photo' => [
                'nullable',
                File::image()->max('5mb'),
            ],
            'name' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:30'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('pic_directory', 'email')
                    ->ignore($picDirectory->id),
            ],
            'role' => ['required', 'string', 'max:100'],

            'academic_session_ids' => [
                'required',
                'array',
                'min:1',
            ],
            'academic_session_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('academic_sessions', 'id'),
            ],
        ]);

        $sessionIds = $validated['academic_session_ids'];

        $oldPhoto = $picDirectory->photo_path;
        $newPhoto = null;

        if ($request->hasFile('photo')) {
            $newPhoto = $request->file('photo')
                ->store('pic-photos', 'public');
        }

        try {
            DB::transaction(function () use (
                $picDirectory,
                $validated,
                $sessionIds,
                $newPhoto,
                $oldPhoto
            ) {
                $picDirectory->update([
                    'photo_path' => $newPhoto ?? $oldPhoto,
                    'name' => $validated['name'],
                    'contact_number' => $validated['contact_number'],
                    'email' => $validated['email'],
                    'role' => $validated['role'],
                ]);

                $picDirectory->academicSessions()->sync($sessionIds);
            });
        } catch (Throwable $e) {
            if ($newPhoto) {
                Storage::disk('public')->delete($newPhoto);
            }

            throw $e;
        }

        if ($newPhoto && $oldPhoto) {
            Storage::disk('public')->delete($oldPhoto);
        }

        return back()->with(
            'success',
            'PIC updated successfully!'
        );
    }

    // Permanently delete a PIC record
    public function destroy(PicDirectory $picDirectory)
    {
        $photoPath = $picDirectory->photo_path;

        DB::transaction(function () use ($picDirectory) {
            $picDirectory->academicSessions()->detach();

            $picDirectory->delete();
        });

        if ($photoPath) {
            Storage::disk('public')->delete($photoPath);
        }

        return back()->with(
            'success',
            'PIC deleted successfully!'
        );
    }

    // Prepare PIC information for React
    private function formatPerson(PicDirectory $person)
    {
        return [
            'id' => $person->id,
            'name' => $person->name,
            'contact_number' => $person->contact_number,
            'email' => $person->email,
            'role' => $person->role,

            'photo_url' => $person->photo_path
                ? Storage::disk('public')->url($person->photo_path)
                : null,

            'academic_session_ids' => $person
                ->academicSessions
                ->pluck('id')
                ->all(),

            'academic_sessions' => $person
                ->academicSessions
                ->map(fn ($session) => [
                    'id' => $session->id,
                    'name' => $session->name,
                    'is_current' => $session->is_current,
                ])
                ->values()
                ->all(),
        ];
    }

    // Prepare academic session options for React
    private function formatSessions($sessions)
    {
        return $sessions->map(fn ($session) => [
            'id' => $session->id,
            'name' => $session->name,
            'is_current' => $session->is_current,
        ])->values()->all();
    }
}

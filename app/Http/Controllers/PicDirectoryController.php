<?php

namespace App\Http\Controllers;

use App\Models\PicDirectory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Throwable;

class PicDirectoryController extends Controller
{
    // Display personnel records for management
    
public function index()
{
    $personnel = PicDirectory::orderBy('name')->get();

    return Inertia::render('PicDirectoryManagement', [
        'personnel' => $personnel->map(
            fn ($person) => $this->formatPerson($person)
        )->values()->all(),
    ]);
}

// Display the public PIC directory
    
public function publicIndex()
{
    $personnel = PicDirectory::orderBy('name')->get();

    return Inertia::render('PicDirectoryPublic', [
        'personnel' => $personnel->map(
            fn ($person) => $this->formatPerson($person)
        )->values()->all(),
    ]);
}


    // Add a new staff or fellow
    public function store(Request $request)
    {
        $validated = $request->validate([
            'photo' => [
                'required',
                File::image()->max('2mb'),
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
        ]);

        $path = $request->file('photo')
            ->store('pic-photos', 'public');

        try {
            PicDirectory::create([
                'photo_path' => $path,
                'name' => $validated['name'],
                'contact_number' => $validated['contact_number'],
                'email' => $validated['email'],
                'role' => $validated['role'],
            ]);
        } catch (Throwable $e) {
            Storage::disk('public')->delete($path);
            throw $e;
        }

        return back()->with(
            'success',
            'PIC added successfully!'
        );
    }

    // Update an existing personnel record
    public function update(Request $request, PicDirectory $picDirectory)
    {
        $validated = $request->validate([
            'photo' => [
                'nullable',
                File::image()->max('2mb'),
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
        ]);

        $oldPhoto = $picDirectory->photo_path;
        $newPhoto = null;

        if ($request->hasFile('photo')) {
            $newPhoto = $request->file('photo')
                ->store('pic-photos', 'public');
        }

        try {
            $picDirectory->update([
                'photo_path' => $newPhoto ?? $oldPhoto,
                'name' => $validated['name'],
                'contact_number' => $validated['contact_number'],
                'email' => $validated['email'],
                'role' => $validated['role'],
            ]);
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

    // Permanently remove a personnel record
    public function destroy(PicDirectory $picDirectory)
    {
        $photoPath = $picDirectory->photo_path;

        $picDirectory->delete();

        if ($photoPath) {
            Storage::disk('public')->delete($photoPath);
        }

        return back()->with(
            'success',
            'PIC deleted successfully!'
        );
    }

    // Prepare personnel data for React
    private function formatPerson(PicDirectory $person)
    {
        return [
            'id' => $person->id,
            'name' => $person->name,
            'contact_number' => $person->contact_number,
            'email' => $person->email,
            'role' => $person->role,
            'photo_url' => Storage::disk('public')
                ->url($person->photo_path),
        ];
    }
}

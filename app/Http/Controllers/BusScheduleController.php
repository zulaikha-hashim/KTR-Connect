<?php

namespace App\Http\Controllers;

use App\Models\BusSchedule;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;
use Throwable;

class BusScheduleController extends Controller
{
    // Get the currently uploaded schedule
    
    public function index()
    {
        $schedule = BusSchedule::latest()->first();

        return Inertia::render('BusSchedule', [
            'schedule' => $schedule ? [
                'id' => $schedule->id,
                'title' => $schedule->title,
                'original_name' => $schedule->original_name,
                'size' => $schedule->size,
                'updated_at' => $schedule->updated_at->format('d M Y, h:i A'),
                'url' => Storage::disk('public')->url(
                    $schedule->file_path
                ),
            ] : null,
        ]);
    }

    // Upload a new PDF and replace the previous one
    public function store(Request $request)
    {
        $request->validate([
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
            $oldPaths = DB::transaction(function () use ($file, $path) {
                $oldSchedules = BusSchedule::lockForUpdate()->get();

                BusSchedule::create([
                    'title' => 'KTR Bus Schedule',
                    'original_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'size' => $file->getSize(),
                ]);

                $paths = $oldSchedules->pluck('file_path')->all();

                BusSchedule::whereIn(
                    'id',
                    $oldSchedules->pluck('id')->all()
                )->delete();

                return $paths;
            });
        } catch (Throwable $e) {
            Storage::disk('public')->delete($path);
            throw $e;
        }

        // Delete previous PDFs after the database update succeeds
        foreach ($oldPaths as $oldPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return back()->with(
            'success',
            'Bus schedule updated successfully!'
        );
    }
}

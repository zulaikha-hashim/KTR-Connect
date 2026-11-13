<?php

use App\Http\Controllers\ActivityApplicationController;
use App\Models\ActivityApplication;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PicDirectoryController;

Route::get('/', function () {
    return Inertia::render('Staff', [
        'applications' => ActivityApplication::query()->latest()->get(),
    ]);
})->name('staff');

Route::post('/activity-applications', [ActivityApplicationController::class, 'store'])
    ->name('activity-applications.store');

Route::get('/admin', function () {
    $applications = ActivityApplication::query()
        ->whereIn('status', ['pending', 'approved', 'rejected'])
        ->latest()
        ->get()
        ->each(fn (ActivityApplication $application) => $application->setAttribute(
            'has_proposal_document',
            $application->proposal_document_path !== null,
        ));

    return Inertia::render('Admin', [
        'applications' => $applications,
    ]);
})->name('admin');

Route::patch('/admin/activity-applications/{application}', [ActivityApplicationController::class, 'review'])
    ->name('admin.activity-applications.review');

Route::get('/admin/activity-applications/{application}/document', [ActivityApplicationController::class, 'document'])
    ->name('admin.activity-applications.document');


// PIC Directory Management
// Public directory - read only
Route::get('/pic-directory', [
    PicDirectoryController::class,
    'publicIndex',
])->name('pic-directory.public');

// Admin management - Add, Edit, Delete
Route::get('/admin/pic-directory', [
    PicDirectoryController::class,
    'index',
])->name('admin.pic-directory.index');

Route::post('/admin/pic-directory', [
    PicDirectoryController::class,
    'store',
])->name('admin.pic-directory.store');

Route::post('/admin/pic-directory/{picDirectory}', [
    PicDirectoryController::class,
    'update',
])->name('admin.pic-directory.update');

Route::delete('/admin/pic-directory/{picDirectory}', [
    PicDirectoryController::class,
    'destroy',
])->name('admin.pic-directory.destroy');


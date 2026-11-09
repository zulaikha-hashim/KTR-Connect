<?php

use App\Http\Controllers\ActivityApplicationController;
use App\Models\ActivityApplication;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
    
Route::get('/admin/support', function () {
    return inertia('AdminSupport');
});
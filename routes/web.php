<?php

use App\Http\Controllers\ActivityApplicationController;
use App\Http\Controllers\Admin\HostelInventoryController;
use App\Http\Controllers\Admin\HostelAvailabilityController;

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

Route::get('/admin/hostel/rooms', [HostelInventoryController::class, 'index'])
    ->name('admin.hostel.rooms.index');

Route::post(
    '/admin/hostel/beds/{bed}/restrictions',
    [HostelAvailabilityController::class, 'store']
)->name('admin.hostel.beds.restrictions.store');

Route::patch(
    '/admin/hostel/beds/{bed}/restrictions/{restriction}/restore',
    [HostelAvailabilityController::class, 'restore']
)->name('admin.hostel.beds.restrictions.restore');
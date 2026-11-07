<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\BusScheduleController;

Route::get('/', function () {
    return Inertia::render('Dashboard');
});

Route::get('/admin', function () {
    return Inertia::render('Admin');
});

// Bus Schedule Management
Route::get('/admin/bus-schedule', [BusScheduleController::class, 'index'])
    ->name('admin.bus-schedule.index');

Route::post('/admin/bus-schedule', [BusScheduleController::class, 'store'])
    ->name('admin.bus-schedule.store');
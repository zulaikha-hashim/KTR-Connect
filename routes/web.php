<?php

use App\Http\Controllers\ActivityApplicationController;
use App\Http\Controllers\ChatbotInfoController;
use App\Http\Controllers\Admin\Hostel\HostelInventoryController;
use App\Http\Controllers\Admin\Hostel\HostelAvailabilityController;
use App\Http\Controllers\Admin\Hostel\HostelActivityHistoryController;

use App\Models\ActivityApplication;
use App\Models\ChatbotInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    return Inertia::render('Staff', [
        'applications' => ActivityApplication::query()
            ->when($request->user(), fn ($query, $user) => $query->where('felo_id', $user->getAuthIdentifier()))
            ->latest()
            ->get(),
    ]);
})->name('staff');

Route::post('/activity-applications', [ActivityApplicationController::class, 'store'])
    ->name('activity-applications.store');

Route::get('/admin', function () {
    $chatbot = ChatbotInfo::query()->first() ?? ChatbotInfo::create([
        'content_id' => 'INFO-KTR-001',
        'category' => 'Registration Guidelines',
        'target_audience' => 'All Undergraduate Residents',
        'title' => 'Room Registration Procedures & Guidelines',
        'keywords' => 'registration, guidelines, room booking, step by step',
        'content' => "1. Check Registration Period: Ensure your cohort's window is active in the KTR Portal.\n2. Browse Available Blocks: Review room configurations for Block TR01 - TR06.\n3. Review Eligibility & Merit Cutoff: Verify minimum collegiate merit requirement (>= 65 merit points).\n4. Select Desired Room & Bed: Choose your vacant bed slot (Bed A or Bed B).\n5. Confirm & Submit Reservation: Finalize acknowledgment of UTM Residential Regulations.\n6. Need Assistance? Contact your assigned Felo Penasihat Blok or visit the KTR Administration Office.",
        'status' => 'not deployed',
    ]);

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
        'chatbot' => $chatbot,
        'showChatbot' => request()->query('modal') === 'chatbot',
        'successMessage' => session('success'),
    ]);
})->name('admin');

Route::patch('/admin/activity-applications/{application}', [ActivityApplicationController::class, 'review'])
    ->name('admin.activity-applications.review');

Route::get('/admin/activity-applications/{application}/document', [ActivityApplicationController::class, 'document'])
    ->name('admin.activity-applications.document');

// Chatbot Management Routes
Route::put('/chatbot-info/{id}', [ChatbotInfoController::class, 'update'])->name('chatbot.update');
Route::post('/chatbot-info/{id}/deploy', [ChatbotInfoController::class, 'deploy'])->name('chatbot.deploy');
Route::post('/chatbot-info/{id}/submit', [ChatbotInfoController::class, 'deploy'])->name('chatbot.submit');

Route::get('/chatbot-ui', function () {
    return redirect()->route('admin', ['modal' => 'chatbot']);
});

Route::get('/admin/support', function () {
    return inertia('AdminSupport');
});
Route::get('/admin/hostel/rooms', [HostelInventoryController::class, 'index'])
    ->name('admin.hostel.rooms.index');

Route::get(
    '/admin/hostel/activity-history', [HostelActivityHistoryController::class, 'index']
)->name('admin.hostel.activity-history.index');

Route::post(
    '/admin/hostel/beds/{bed}/restrictions',
    [HostelAvailabilityController::class, 'store']
)->name('admin.hostel.beds.restrictions.store');

Route::patch(
    '/admin/hostel/beds/{bed}/restrictions/{restriction}/restore',
    [HostelAvailabilityController::class, 'restore']
)->name('admin.hostel.beds.restrictions.restore');
<?php

use App\Http\Controllers\ActivityApplicationController;
use App\Http\Controllers\ChatbotInfoController;
use App\Http\Controllers\Admin\Hostel\HostelInventoryController;
use App\Http\Controllers\Admin\Hostel\HostelAvailabilityController;
use App\Http\Controllers\Admin\Hostel\HostelActivityHistoryController;
use App\Http\Controllers\PicDirectoryController;
use App\Models\ActivityApplication;
use App\Models\ChatbotInfo;
use App\Models\ChatbotInfoLog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\BusScheduleController;

// =====================================================
// STAFF HOMEPAGE
// =====================================================

Route::get('/', function (Request $request) {
    return Inertia::render('Staff', [
        'applications' => ActivityApplication::query()
            ->when(
                $request->user(),
                fn ($query, $user) =>
                    $query->where('felo_id', $user->getAuthIdentifier())
            )
            ->latest()
            ->get(),
    ]);
})->name('staff');


// =====================================================
// ACTIVITY APPLICATIONS
// =====================================================

Route::post(
    '/activity-applications',
    [ActivityApplicationController::class, 'store']
)->name('activity-applications.store');

Route::patch(
    '/admin/activity-applications/{application}',
    [ActivityApplicationController::class, 'review']
)->name('admin.activity-applications.review');

Route::get(
    '/admin/activity-applications/{application}/document',
    [ActivityApplicationController::class, 'document']
)->name('admin.activity-applications.document');


// =====================================================
// ADMIN DASHBOARD
// =====================================================

Route::get('/admin', function () {

    $chatbot = ChatbotInfo::query()->first();

    if ($chatbot === null) {
        $chatbot = ChatbotInfo::create([
            'content_id' => 'INFO-KTR-001',
            'category' => 'Registration Guidelines',
            'target_audience' => 'All Undergraduate Residents',
            'title' => 'Room Registration Procedures & Guidelines',
            'keywords' => 'registration, guidelines, room booking, step by step',
            'content' => "1. Check Registration Period: Ensure your cohort's window is active in the KTR Portal.\n2. Browse Available Blocks: Review room configurations for Block TR01 - TR06.\n3. Review Eligibility & Merit Cutoff: Verify minimum collegiate merit requirement (>= 65 merit points).\n4. Select Desired Room & Bed: Choose your vacant bed slot (Bed A or Bed B).\n5. Confirm & Submit Reservation: Finalize acknowledgment of UTM Residential Regulations.\n6. Need Assistance? Contact your assigned Felo Penasihat Blok or visit the KTR Administration Office.",
            'faqs' => [
                ['question' => 'When can I register for a room?', 'answer' => 'Check the active registration period in the KTR Portal.'],
                ['question' => 'What is the minimum merit requirement?', 'answer' => 'A minimum of 65 merit points is required.'],
                ['question' => 'Who can help me with registration?', 'answer' => 'Contact your assigned Felo Penasihat Blok or visit the KTR Administration Office.'],
            ],
            'status' => 'not deployed',
        ]);
    }

    $chatbotLogs = ChatbotInfoLog::query()
        ->where('chatbot_info_id', $chatbot->id)
        ->latest('id')
        ->limit(8)
        ->get();

    $applications = ActivityApplication::query()
        ->whereIn('status', [
            'pending',
            'approved',
            'rejected',
        ])
        ->latest()
        ->get()
        ->each(
            fn (ActivityApplication $application) =>
                $application->setAttribute(
                    'has_proposal_document',
                    $application->proposal_document_path !== null
                )
        );

    return Inertia::render('Admin', [
        'applications' => $applications,
        'chatbot' => $chatbot,
        'chatbotLogs' => $chatbotLogs,
        'showChatbot' => request()->query('modal') === 'chatbot',
        'successMessage' => session('success'),
    ]);

})->name('admin');


// =====================================================
// PIC DIRECTORY MANAGEMENT
// =====================================================

// Public PIC Directory (Read Only)
Route::get(
    '/pic-directory',
    [PicDirectoryController::class, 'publicIndex']
)->name('pic-directory.public');

// Admin PIC Directory
Route::get(
    '/admin/pic-directory',
    [PicDirectoryController::class, 'index']
)->name('admin.pic-directory.index');

// Add PIC
Route::post(
    '/admin/pic-directory',
    [PicDirectoryController::class, 'store']
)->name('admin.pic-directory.store');

// Update PIC
Route::post(
    '/admin/pic-directory/{picDirectory}',
    [PicDirectoryController::class, 'update']
)->name('admin.pic-directory.update');

// Delete PIC
Route::delete(
    '/admin/pic-directory/{picDirectory}',
    [PicDirectoryController::class, 'destroy']
)->name('admin.pic-directory.destroy');


// =====================================================
// CHATBOT MANAGEMENT
// =====================================================

Route::put(
    '/chatbot-info/{id}',
    [ChatbotInfoController::class, 'update']
)->name('chatbot.update');

Route::post(
    '/chatbot-info/{id}/deploy',
    [ChatbotInfoController::class, 'deploy']
)->name('chatbot.deploy');

Route::post(
    '/chatbot-info/{id}/submit',
    [ChatbotInfoController::class, 'deploy']
)->name('chatbot.submit');

Route::get('/chatbot-ui', function () {
    return redirect()->route('admin', [
        'modal' => 'chatbot',
    ]);
});


// =====================================================
// ADMIN SUPPORT
// =====================================================

Route::get('/admin/support', function () {
    return inertia('AdminSupport');
});


// =====================================================
// HOSTEL MANAGEMENT
// =====================================================

// Hostel Room Inventory
Route::get(
    '/admin/hostel/rooms',
    [HostelInventoryController::class, 'index']
)->name('admin.hostel.rooms.index');

// Hostel Activity History
Route::get(
    '/admin/hostel/activity-history',
    [HostelActivityHistoryController::class, 'index']
)->name('admin.hostel.activity-history.index');

 // =====================================================
 // BUS SCHEDULE MANAGEMENT
 // =====================================================

 // Display bus schedules by academic session
Route::get(
    '/admin/bus-schedule',
    [BusScheduleController::class, 'index']
)->name('admin.bus-schedule');

 // Upload or replace a bus schedule
Route::post(
    '/admin/bus-schedule',
    [BusScheduleController::class, 'store']
)->name('admin.bus-schedule.store');

 // =====================================================
 // HOSTEL BED RESTRICTIONS
 // =====================================================

 // Store Bed Restrictions
 Route::post(
     '/admin/hostel/beds/{bed}/restrictions',
     [HostelAvailabilityController::class, 'store']
 )->name('admin.hostel.beds.restrictions.store');

// Restore Bed Restrictions
Route::patch(
    '/admin/hostel/beds/{bed}/restrictions/{restriction}/restore',
    [HostelAvailabilityController::class, 'restore']
)->name('admin.hostel.beds.restrictions.restore');


// =====================================================
//                  MERIT TYPE MANAGEMENT
// =====================================================
Route::prefix('admin/master-data/merit')->name('admin.master-data.merit.')->group(function () {
    Route::get(
        '/',
        [\App\Http\Controllers\Admin\MeritTypeController::class, 'index']
    )->name('index');
    Route::post(
        '/',
        [\App\Http\Controllers\Admin\MeritTypeController::class, 'store']
    )->name('store');
    Route::put(
        '/{meritType}',
        [\App\Http\Controllers\Admin\MeritTypeController::class, 'update']
    )->name('update');
    Route::delete(
        '/{meritType}',
        [\App\Http\Controllers\Admin\MeritTypeController::class, 'destroy']
    )->name('destroy');
});
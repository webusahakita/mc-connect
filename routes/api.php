<?php

use App\Http\Controllers\AiCoPilotController;
use App\Http\Controllers\CmsApiController;
use App\Http\Controllers\ProfileApiController;
use App\Http\Controllers\PublicController;
use App\Http\Middleware\EnsureMcAuthenticated;
use Illuminate\Support\Facades\Route;

// Session and CSRF middleware are applied to this API group in bootstrap/app.php.
Route::get('/csrf-token', fn () => response()->json(['token' => csrf_token()])
    ->header('Cache-Control', 'no-store, private'));
Route::post('/mc/login', [ProfileApiController::class, 'login'])->middleware('throttle:10,1');

// Public booking and published website content.
Route::get('/calendar/availability', [PublicController::class, 'getCalendarEvents']);
Route::post('/book/request', [PublicController::class, 'submitBookingRequest']);
Route::get('/event-categories', [CmsApiController::class, 'getEventCategories']);
foreach ([
    'biodata' => 'getBiodata',
    'gallery' => 'getGallery',
    'packages' => 'getPackages',
    'policies' => 'getPolicies',
    'testimonials' => 'getTestimonials',
    'presskit' => 'getPressKit',
    'riders' => 'getRiders',
    'event-categories' => 'getEventCategories',
] as $path => $action) {
    Route::get('/cms/'.$path, [CmsApiController::class, $action]);
}

Route::middleware(EnsureMcAuthenticated::class)->group(function () {
    Route::get('/mc/session', [ProfileApiController::class, 'session']);
    Route::post('/mc/logout', [ProfileApiController::class, 'logout']);
    Route::get('/mc/profile', [ProfileApiController::class, 'getProfile']);
    Route::post('/mc/profile', [ProfileApiController::class, 'updateProfile']);
    Route::post('/events/{id}/ai/generate-script', [AiCoPilotController::class, 'generateScript']);

    foreach ([
        'payment-settings' => 'getPaymentSettings',
        'cashflow-transactions' => 'getCashflowTransactions',
        'wardrobe-catalog' => 'getWardrobeCatalog',
        'cashflow-categories' => 'getCashflowCategories',
        'customers' => 'getCustomers',
        'client-categories' => 'getClientCategories',
        'wa-templates' => 'getWaTemplates',
        'events' => 'getEventsAdmin',
        'music-bank' => 'getMusicBank',
    ] as $path => $action) {
        Route::get('/cms/'.$path, [CmsApiController::class, $action]);
    }

    foreach ([
        'biodata' => 'updateBiodata',
        'gallery' => 'saveGallery',
        'gallery/upload' => 'uploadGallery',
        'gallery/{id}/caption' => 'updateGalleryCaption',
        'packages' => 'savePackages',
        'policies' => 'savePolicies',
        'payment-settings' => 'savePaymentSettings',
        'testimonials' => 'saveTestimonials',
        'presskit' => 'savePressKit',
        'riders' => 'saveRider',
        'cashflow-transactions' => 'saveCashflowTransaction',
        'wardrobe-catalog' => 'saveWardrobeCatalogItem',
        'cashflow-categories' => 'saveCashflowCategories',
        'customers' => 'saveCustomer',
        'client-categories' => 'saveClientCategories',
        'wa-templates' => 'saveWaTemplates',
        'events' => 'createEvent',
        'event-categories' => 'saveEventCategories',
        'music-bank' => 'saveMusicBank',
        'music-bank/upload' => 'uploadMusicBankFile',
        'events/upload-expense-proof' => 'uploadExpenseProof',
    ] as $path => $action) {
        Route::post('/cms/'.$path, [CmsApiController::class, $action]);
    }
    Route::put('/cms/events/{id}', [CmsApiController::class, 'updateEvent']);

    foreach ([
        'gallery' => 'deleteGallery',
        'riders' => 'deleteRider',
        'cashflow-transactions' => 'deleteCashflowTransaction',
        'wardrobe-catalog' => 'deleteWardrobeCatalogItem',
        'customers' => 'deleteCustomer',
        'events' => 'deleteEvent',
    ] as $path => $action) {
        Route::delete('/cms/'.$path.'/{id}', [CmsApiController::class, $action]);
    }
});

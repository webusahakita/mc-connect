<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\AiCoPilotController;
use App\Http\Controllers\ProfileApiController;
use App\Http\Controllers\CmsApiController;

/*
|--------------------------------------------------------------------------
| API Routes - MC-Connect Platform
|--------------------------------------------------------------------------
*/

// CSRF Token endpoint (untuk admin.html statis)
Route::get('/csrf-token', function () {
    return response()->json(['token' => csrf_token()]);
});

Route::get('/setup-db', function () {
    try {
        if (!Illuminate\Support\Facades\Schema::hasColumn('cms_cashflow_transactions', 'bukti_file')) {
            Illuminate\Support\Facades\Schema::table('cms_cashflow_transactions', function ($table) {
                $table->string('bukti_file')->nullable();
            });
            return 'Added bukti_file column.';
        }
        if (!Illuminate\Support\Facades\Schema::hasColumn('users_mc', 'music_bank')) {
            Illuminate\Support\Facades\Schema::table('users_mc', function ($table) {
                $table->longText('music_bank')->nullable();
            });
            return 'Added music_bank column.';
        }
        return 'Column already exists.';
    } catch (\Exception $e) {
        return $e->getMessage();
    }
});

/*
|--------------------------------------------------------------------------
| API Routes - MC-Connect Platform
|--------------------------------------------------------------------------
*/

// Public Calendar & Booking
Route::get('/calendar/availability', [PublicController::class, 'getCalendarEvents']);
Route::get('/event-categories', [CmsApiController::class, 'getEventCategories']);
Route::post('/book/request', [PublicController::class, 'submitBookingRequest']);
Route::post('/events/{id}/ai/generate-script', [AiCoPilotController::class, 'generateScript']);

// MC Profile & Auth (untuk frontend statis)
Route::post('/mc/login', [ProfileApiController::class, 'login']);
Route::get('/mc/profile', [ProfileApiController::class, 'getProfile']);
Route::post('/mc/profile', [ProfileApiController::class, 'updateProfile']);

// =============================================================
// CMS API Routes — Semua data admin panel disimpan di database
// =============================================================

// 1. Biodata MC
Route::get('/cms/biodata', [CmsApiController::class, 'getBiodata']);
Route::post('/cms/biodata', [CmsApiController::class, 'updateBiodata']);

// 2. Gallery (multi-upload file)
Route::get('/cms/gallery', [CmsApiController::class, 'getGallery']);
Route::post('/cms/gallery', [CmsApiController::class, 'saveGallery']);
Route::post('/cms/gallery/upload', [CmsApiController::class, 'uploadGallery']);
Route::post('/cms/gallery/{id}/caption', [CmsApiController::class, 'updateGalleryCaption']);
Route::delete('/cms/gallery/{id}', [CmsApiController::class, 'deleteGallery']);

// 3. Packages
Route::get('/cms/packages', [CmsApiController::class, 'getPackages']);
Route::post('/cms/packages', [CmsApiController::class, 'savePackages']);

// 4. Policies (Terms, Refund, FAQ)
Route::get('/cms/policies', [CmsApiController::class, 'getPolicies']);
Route::post('/cms/policies', [CmsApiController::class, 'savePolicies']);

// 4.1 Payment Settings
Route::get('/cms/payment-settings', [CmsApiController::class, 'getPaymentSettings']);
Route::post('/cms/payment-settings', [CmsApiController::class, 'savePaymentSettings']);

// 4.5 Testimonials
Route::get('/cms/testimonials', [CmsApiController::class, 'getTestimonials']);
Route::post('/cms/testimonials', [CmsApiController::class, 'saveTestimonials']);

// 5. Press Kit
Route::get('/cms/presskit', [CmsApiController::class, 'getPressKit']);
Route::post('/cms/presskit', [CmsApiController::class, 'savePressKit']);

// 6. Riders
Route::get('/cms/riders', [CmsApiController::class, 'getRiders']);
Route::post('/cms/riders', [CmsApiController::class, 'saveRider']);
Route::delete('/cms/riders/{id}', [CmsApiController::class, 'deleteRider']);

Route::get('/cms/cashflow-transactions', [CmsApiController::class, 'getCashflowTransactions']);
Route::post('/cms/cashflow-transactions', [CmsApiController::class, 'saveCashflowTransaction']);
Route::delete('/cms/cashflow-transactions/{id}', [CmsApiController::class, 'deleteCashflowTransaction']);

// 7. Wardrobe Catalog
Route::get('/cms/wardrobe-catalog', [CmsApiController::class, 'getWardrobeCatalog']);
Route::post('/cms/wardrobe-catalog', [CmsApiController::class, 'saveWardrobeCatalogItem']);
Route::delete('/cms/wardrobe-catalog/{id}', [CmsApiController::class, 'deleteWardrobeCatalogItem']);

// 8. Cashflow Categories
Route::get('/cms/cashflow-categories', [CmsApiController::class, 'getCashflowCategories']);
Route::post('/cms/cashflow-categories', [CmsApiController::class, 'saveCashflowCategories']);

// 9. Customers (Clients)
Route::get('/cms/customers', [CmsApiController::class, 'getCustomers']);
Route::post('/cms/customers', [CmsApiController::class, 'saveCustomer']);
Route::delete('/cms/customers/{id}', [CmsApiController::class, 'deleteCustomer']);

// 9.5 Client Categories
Route::get('/cms/client-categories', [CmsApiController::class, 'getClientCategories']);
Route::post('/cms/client-categories', [CmsApiController::class, 'saveClientCategories']);

// 9.6 WA Templates
Route::get('/cms/wa-templates', [CmsApiController::class, 'getWaTemplates']);
Route::post('/cms/wa-templates', [CmsApiController::class, 'saveWaTemplates']);

// 10. Events Admin
Route::get('/cms/events', [CmsApiController::class, 'getEventsAdmin']);
Route::post('/cms/events', [CmsApiController::class, 'createEvent']);
Route::put('/cms/events/{id}', [CmsApiController::class, 'updateEvent']);
Route::delete('/cms/events/{id}', [CmsApiController::class, 'deleteEvent']);

// 11. Event Categories (Settings)
Route::get('/cms/event-categories', [CmsApiController::class, 'getEventCategories']);
Route::post('/cms/event-categories', [CmsApiController::class, 'saveEventCategories']);

// 12. Master Music Bank
Route::get('/cms/music-bank', [CmsApiController::class, 'getMusicBank']);
Route::post('/cms/music-bank', [CmsApiController::class, 'saveMusicBank']);
Route::post('/cms/music-bank/upload', [CmsApiController::class, 'uploadMusicBankFile']);

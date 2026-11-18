<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\EnsureMcAuthenticated;
use App\Http\Controllers\InvoiceController;

// Document & Print Routes (Invoice QRIS, SPK Kontrak & ESC/POS Thermal)
Route::get('/invoices/{id}/print', [InvoiceController::class, 'show'])->name('invoice.print');
Route::get('/invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoice.pdf');
Route::get('/events/{id}/spk', [InvoiceController::class, 'showSpk'])->name('event.spk');
Route::get('/invoices/{id}/thermal', [InvoiceController::class, 'showThermalReceipt'])->name('invoice.thermal');
Route::get('/invoices/{id}/thermal-binary', [InvoiceController::class, 'downloadThermalBinary'])->name('invoice.thermal-binary');

// Modern Decoupled SPA Routes (React 19 + TypeScript)
Route::get('/app', fn () => view('spa'))->name('app.spa');
Route::get('/app/{any}', fn () => view('spa'))->where('any', '.*');

Route::get('/', function () {
    return response(file_get_contents(public_path('index.html')), 200)
        ->header('Content-Type', 'text/html; charset=UTF-8');
});

Route::get('/index.html', fn () => redirect('/', 301));

Route::get('/login', function () {
    return response(file_get_contents(public_path('login.html')), 200)
        ->header('Content-Type', 'text/html; charset=UTF-8');
})->name('login');

Route::get('/login.html', fn () => redirect('/login', 301));

Route::get('/bisnis', function () {
    return response(file_get_contents(public_path('keunggulan.html')), 200)
        ->header('Content-Type', 'text/html; charset=UTF-8');
})->name('bisnis');

// Redirect legacy /keunggulan and *.html variants to /bisnis
Route::get('/keunggulan', fn () => redirect('/bisnis', 301));
Route::get('/keunggulan.html', fn () => redirect('/bisnis', 301));
Route::get('/bisnis.html', fn () => redirect('/bisnis', 301));

Route::middleware(EnsureMcAuthenticated::class)->group(function () {
    foreach (['admin', 'stage', 'vendor'] as $page) {
        $handler = fn () => response(file_get_contents(resource_path('views/workspace/'.$page.'.html')));

        Route::get('/'.$page, $handler)->name($page === 'admin' ? 'admin.dashboard' : $page);
        // Keep existing bookmarks and links working without exposing static files.
        Route::get('/'.$page.'.html', $handler);
    }
});

<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\EnsureMcAuthenticated;
use App\Http\Controllers\InvoiceController;

// Public Document Access (Secured by Token / Session Validation in Controller)
Route::get('/invoices/{id}/print', [InvoiceController::class, 'show'])->name('invoice.print');
Route::get('/invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoice.pdf');

// Safe SPA Renderer with Stale Vite Dev Server Auto-Recovery
if (!function_exists('renderSpaView')) {
    function renderSpaView() {
        $hotFile = public_path('hot');
        if (file_exists($hotFile)) {
            $hotUrl = trim((string)@file_get_contents($hotFile));
            $parsed = parse_url($hotUrl);
            $host = $parsed['host'] ?? '127.0.0.1';
            $port = $parsed['port'] ?? 5173;
            $conn = @fsockopen($host, (int)$port, $errno, $errstr, 0.1);
            if (!$conn) {
                @unlink($hotFile);
            } else {
                fclose($conn);
            }
        }
        return view('spa');
    }
}

// Modern Decoupled SPA Routes (React 19 + TypeScript)
Route::get('/', fn () => renderSpaView())->name('home');
Route::get('/landing', fn () => renderSpaView())->name('landing');
Route::get('/app', fn () => renderSpaView())->name('app.spa');
Route::get('/app/{any}', fn () => renderSpaView())->where('any', '.*');

// Legacy Safe Bridge Landing Page Fallbacks
Route::get('/legacy', function () {
    return response(file_get_contents(public_path('index.html')), 200)
        ->header('Content-Type', 'text/html; charset=UTF-8');
})->name('legacy.home');

Route::get('/legacy/landing', function () {
    return response(file_get_contents(public_path('index.html')), 200)
        ->header('Content-Type', 'text/html; charset=UTF-8');
})->name('legacy.landing');

Route::get('/legacy/index.html', fn () => redirect('/legacy', 301));
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
    // Authenticated MC Operational Print Routes (SPK Kontrak & ESC/POS Thermal)
    Route::get('/events/{id}/spk', [InvoiceController::class, 'showSpk'])->name('event.spk');
    Route::get('/invoices/{id}/thermal', [InvoiceController::class, 'showThermalReceipt'])->name('invoice.thermal');
    Route::get('/invoices/{id}/thermal-binary', [InvoiceController::class, 'downloadThermalBinary'])->name('invoice.thermal-binary');

    foreach (['admin', 'stage', 'vendor'] as $page) {
        // Modern Decoupled React 19 SPA Handlers
        Route::get('/'.$page, fn () => renderSpaView())->name($page === 'admin' ? 'admin.dashboard' : $page);
        Route::get('/'.$page.'.html', fn () => redirect('/'.$page, 301));

        // Legacy Safe Bridge Fallbacks (Original Monolithic HTML)
        $legacyHandler = fn () => response(file_get_contents(resource_path('views/workspace/'.$page.'.html')), 200)
            ->header('Content-Type', 'text/html; charset=UTF-8');

        Route::get('/legacy/'.$page, $legacyHandler)->name('legacy.'.$page);
        Route::get('/legacy/'.$page.'.html', fn () => redirect('/legacy/'.$page, 301));
    }
});

<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\EnsureMcAuthenticated;

Route::get('/', function () {
    return file_get_contents(public_path('index.html'));
});

Route::get('/login', function () {
    return file_get_contents(public_path('login.html'));
})->name('login');

Route::middleware(EnsureMcAuthenticated::class)->group(function () {
    foreach (['admin', 'stage', 'vendor'] as $page) {
        $handler = fn () => response(file_get_contents(resource_path('views/workspace/'.$page.'.html')));

        Route::get('/'.$page, $handler)->name($page === 'admin' ? 'admin.dashboard' : $page);
        // Keep existing bookmarks and links working without exposing static files.
        Route::get('/'.$page.'.html', $handler);
    }
});

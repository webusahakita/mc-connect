<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return file_get_contents(public_path('index.html'));
});

Route::get('/admin', function () {
    return file_get_contents(public_path('admin.html'));
});

Route::get('/login', function () {
    return file_get_contents(public_path('login.html'));
});

Route::get('/stage', function () {
    return file_get_contents(public_path('stage.html'));
});

Route::get('/vendor', function () {
    return file_get_contents(public_path('vendor.html'));
});

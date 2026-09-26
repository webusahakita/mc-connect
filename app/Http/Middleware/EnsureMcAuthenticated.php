<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMcAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!session()->has('mc_user_id')) {
            return redirect()->route('login')->with('warning', 'Silakan login terlebih dahulu untuk mengakses area admin.');
        }

        return $next($request);
    }
}

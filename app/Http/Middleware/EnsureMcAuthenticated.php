<?php

namespace App\Http\Middleware;

use App\Models\UserMC;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMcAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        $mc = $request->session()->get('mc_user_id');
        $mc = $mc ? UserMC::find($mc) : null;

        if (!$mc) {
            $request->session()->forget('mc_user_id');
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Silakan login terlebih dahulu.'], 401)
                    ->header('Cache-Control', 'no-store, private');
            }

            return redirect()->guest(route('login', ['redirect' => $request->getRequestUri()]));
        }

        $request->attributes->set('mc', $mc);

        return $next($request)->header('Cache-Control', 'no-store, private');
    }
}

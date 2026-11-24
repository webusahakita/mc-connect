<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class SpaController extends Controller
{
    // Renders the React SPA shell. Implemented as a controller (not a route
    // closure) so the routes stay cacheable under `route:cache`; a closure that
    // called a helper defined in routes/web.php broke once routes were cached.
    public function __invoke(): View
    {
        // Stale Vite dev-server auto-recovery (local development only).
        $hotFile = public_path('hot');
        if (file_exists($hotFile)) {
            $hotUrl = trim((string) @file_get_contents($hotFile));
            $parsed = parse_url($hotUrl);
            $host = $parsed['host'] ?? '127.0.0.1';
            $port = $parsed['port'] ?? 5173;
            $conn = @fsockopen($host, (int) $port, $errno, $errstr, 0.1);
            if (!$conn) {
                @unlink($hotFile);
            } else {
                fclose($conn);
            }
        }

        return view('spa');
    }
}

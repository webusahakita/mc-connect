<?php

namespace App\Http\Controllers;

use App\Models\UserMC;
use App\Models\Event;
use App\Models\Invoice;
use App\Models\Client;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $mc = UserMC::first();
        if (!$mc) {
            abort(404, 'MC profile not configured.');
        }

        // Metrics
        $totalPendapatan = Invoice::whereIn('status_bayar', ['DP Paid', 'Fully Paid'])->sum('nominal_dp');
        $totalAcara = Event::whereHas('client', function ($q) use ($mc) {
            $q->where('mc_id', $mc->id);
        })->count();

        $acaraTerkunci = Event::where('status', 'Terkunci')->count();
        $acaraTentative = Event::where('status', 'Tentative')->count();
        $acaraReview = Event::where('status', 'Review')->count();
        $acaraSelesai = Event::where('status', 'Selesai')->count();

        // Booking conversion rate
        $conversionRate = $totalAcara > 0 ? round(($acaraTerkunci / $totalAcara) * 100) : 0;

        // Daftar Acara dengan relasi
        $statusFilter = $request->query('status', 'all');
        $eventsQuery = Event::with(['client', 'invoice', 'checklists'])
            ->whereHas('client', function ($q) use ($mc) {
                $q->where('mc_id', $mc->id);
            });

        if ($statusFilter !== 'all') {
            $eventsQuery->where('status', $statusFilter);
        }

        $events = $eventsQuery->orderBy('tanggal_acara', 'asc')->get();

        return view('admin.dashboard', compact(
            'mc',
            'totalPendapatan',
            'totalAcara',
            'acaraTerkunci',
            'acaraTentative',
            'acaraReview',
            'acaraSelesai',
            'conversionRate',
            'events',
            'statusFilter'
        ));
    }

    public function updateSubscription(Request $request)
    {
        $mc = UserMC::first();
        $validated = $request->validate([
            'tier_langganan' => 'required|in:Free,Pro,Agency',
            'custom_domain' => 'nullable|string|max:200',
        ]);

        $mc->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tingkat langganan & domain berhasil diperbarui!',
            'tier' => $mc->tier_langganan,
            'custom_domain' => $mc->custom_domain,
        ]);
    }
}

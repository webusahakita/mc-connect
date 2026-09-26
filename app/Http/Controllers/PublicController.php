<?php

namespace App\Http\Controllers;

use App\Models\UserMC;
use App\Models\Client;
use App\Models\Event;
use App\Models\Invoice;
use App\Models\Review;
use App\Models\CmsArticle;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicController extends Controller
{
    public function index(Request $request)
    {
        // Mendapatkan profil MC (default ID 1 atau via custom domain)
        $host = $request->getHost();
        $mc = UserMC::where('custom_domain', $host)->first() ?? UserMC::first();

        if (!$mc) {
            return response()->view('public.welcome-setup', [], 200);
        }

        // Ambil jadwal acara untuk kalender ketersediaan
        $events = Event::whereHas('client', function ($q) use ($mc) {
            $q->where('mc_id', $mc->id);
        })->get(['id', 'nama_acara', 'tanggal_acara', 'status', 'tipe_acara']);

        // Review teratas
        $reviews = Review::where('is_featured', true)->latest()->take(6)->get();

        // FAQ & Kebijakan
        $faqs = CmsArticle::where('mc_id', $mc->id)->where('kategori', 'FAQ')->where('is_published', true)->get();
        $terms = CmsArticle::where('mc_id', $mc->id)->where('kategori', 'Terms')->where('is_published', true)->first();
        $refundPolicy = CmsArticle::where('mc_id', $mc->id)->where('kategori', 'Refund')->where('is_published', true)->first();
        $riders = CmsArticle::where('mc_id', $mc->id)->where('kategori', 'Riders')->where('is_published', true)->first();

        // Paket Layanan Standar
        $packages = [
            [
                'id' => 'silver',
                'name' => 'Silver Gala / Seminar Package',
                'badge' => 'Corporate / Academic',
                'price' => 'Rp 8.500.000',
                'duration' => 'Max. 3 Jam',
                'features' => [
                    'Bilingual MC (Bahasa Indonesia & English)',
                    'Pra-Event Coordination via Zoom (1x)',
                    'Custom Script Opening & Closing',
                    'Cue Card & Digital Teleprompter Sync',
                ],
            ],
            [
                'id' => 'gold',
                'name' => 'Gold Luxury Wedding Package',
                'badge' => 'Most Popular',
                'price' => 'Rp 12.500.000',
                'duration' => 'Max. 4 Jam (Resepsi)',
                'features' => [
                    'Romantic & Elegant Signature Hosting',
                    'Technical Meeting WO & Vendor Panggung (2x)',
                    'Wardrobe matching dresscode pengantin',
                    'AI Co-Pilot Love Story Script Drafting',
                    'Live Music Operator Cue Coordination',
                ],
            ],
            [
                'id' => 'platinum',
                'name' => 'Platinum Royal & Hybrid Festival',
                'badge' => 'Full Experience',
                'price' => 'Rp 16.000.000',
                'duration' => 'Full Day / Multi-Session',
                'features' => [
                    'Akad/Holy Matrimony + Resepsi Malam',
                    'Asisten MC Pribadi (Stage Runner)',
                    'Interactive Games & Crowd Engagement',
                    'Soundboard Effect Live Triggering',
                    'VVIP Protokoler & Diplomatic Handling',
                ],
            ],
        ];

        return view('public.index', compact('mc', 'events', 'reviews', 'faqs', 'terms', 'refundPolicy', 'riders', 'packages'));
    }

    public function getCalendarEvents(Request $request)
    {
        $mc = UserMC::first();
        
        // Auto-delete tentative events older than 24 hours
        if ($mc) {
            Event::whereHas('client', function ($q) use ($mc) {
                $q->where('mc_id', $mc->id);
            })->where('status', 'Tentative')
              ->where('created_at', '<', now()->subHours(24))
              ->delete();
        }

        $events = Event::whereHas('client', function ($q) use ($mc) {
            $q->where('mc_id', $mc->id);
        })->get();

        $data = $events->map(function ($event) {
            $color = '#22c55e'; // default green (Available / info)
            if ($event->status === 'Tentative') $color = '#eab308'; // Kuning
            if ($event->status === 'Terkunci') $color = '#ef4444'; // Merah
            if ($event->status === 'Review') $color = '#3b82f6'; // Biru

            $startFmt = $event->waktu_mulai ? substr($event->waktu_mulai, 0, 5) : null;
            $endFmt   = $event->waktu_selesai ? substr($event->waktu_selesai, 0, 5) : null;
            $timeStr  = ($startFmt && $endFmt) ? "{$startFmt} - {$endFmt} WIB" : null;

            return [
                'id'            => $event->id,
                'title'         => $event->status === 'Terkunci' ? 'Booked (Terkunci)' : ($event->status === 'Tentative' ? 'Tentative Booking' : $event->nama_acara),
                'nama_acara'    => $event->nama_acara,
                'date'          => $event->tanggal_acara->format('Y-m-d'),
                'status'        => $event->status,
                'color'         => $color,
                'waktu_mulai'   => $event->waktu_mulai,
                'waktu_selesai' => $event->waktu_selesai,
                'startTime'     => $startFmt,
                'endTime'       => $endFmt,
                'time'          => $timeStr,
                'lokasi'        => $event->lokasi,
            ];
        });

        return response()->json($data);
    }

    public function submitBookingRequest(Request $request)
    {
        $validated = $request->validate([
            'nama_pic' => 'required|string|max:150',
            'no_wa' => 'required|string|max:30',
            'email' => 'nullable|email',
            'tipe_klien' => 'required|in:Personal,EO,WO,Corporate',
            'tipe_acara' => 'required|string',
            'nama_acara' => 'required|string|max:255',
            'lokasi' => 'required|string|max:255',
            'tanggal_acara' => 'required|date',
            'waktu_mulai' => 'required',
            'waktu_selesai' => 'required',
            'catatan_khusus' => 'nullable|string',
            'paket_layanan' => 'nullable|string',
        ]);

        $mc = UserMC::first();

        // Cari paket layanan untuk mendapatkan harga
        $packagePrice = 12500000.00; // default jika tidak ditemukan
        if (!empty($validated['paket_layanan'])) {
            $package = \App\Models\CmsPackage::where('name', $validated['paket_layanan'])->where('mc_id', $mc->id)->first();
            if ($package) {
                $packagePrice = $package->price;
            }
        }

        // 1. Simpan Klien
        $client = Client::create([
            'mc_id' => $mc->id,
            'nama_pic' => $validated['nama_pic'],
            'no_wa' => $validated['no_wa'],
            'email' => $validated['email'] ?? null,
            'tipe_klien' => $validated['tipe_klien'],
            'kategori' => $validated['tipe_acara'], // Mengisi kategori sesuai pilihan dropdown Kategori Acara
            'nilai_kontrak' => $packagePrice, // simpan nilai kontrak
            'nama_acara' => $validated['nama_acara'],
            'tanggal_acara' => $validated['tanggal_acara'],
        ]);

        // 2. Simpan Acara dengan status 'Tentative' (Notifikasi & Status Tentative di kalender)
        $event = Event::create([
            'client_id' => $client->id,
            'nama_acara' => $validated['nama_acara'],
            'lokasi' => $validated['lokasi'],
            'tanggal_acara' => $validated['tanggal_acara'],
            'waktu_mulai' => $validated['waktu_mulai'],
            'waktu_selesai' => $validated['waktu_selesai'],
            'status' => 'Tentative',
            'catatan_khusus' => $validated['catatan_khusus'] ?? '',
            'tipe_acara' => $validated['tipe_acara'],
            'total_budget' => $packagePrice,
            'nilai_kontrak' => $packagePrice, // simpan nilai kontrak
        ]);

        // 3. Buat Draft Invoice
        $dpNominal = $packagePrice / 2;
        $invNumber = 'INV-' . date('Ym') . '-' . str_pad($event->id, 3, '0', STR_PAD_LEFT);
        Invoice::create([
            'event_id' => $event->id,
            'invoice_number' => $invNumber,
            'total_biaya' => $packagePrice,
            'nominal_dp' => $dpNominal,
            'sisa_tagihan' => $packagePrice - $dpNominal,
            'status_bayar' => 'Unpaid',
            'batas_waktu_bayar' => now()->addDays(3),
            'qris_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . $invNumber,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan booking berhasil diajukan! Status jadwal kini "Tentative". MC akan meninjau dan mengirimkan invoice WhatsApp.',
            'event_id' => $event->id,
            'status' => 'Tentative',
        ]);
    }

    public function downloadPressKit()
    {
        $mc = UserMC::first();
        return response()->json([
            'message' => 'Press Kit PDF Generated',
            'mc_name' => $mc->nama_panggung,
            'download_url' => '#download-presskit',
        ]);
    }
}

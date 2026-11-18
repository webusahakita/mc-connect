<?php

namespace App\Http\Controllers;

use App\Models\UserMC;
use App\Models\Event;
use App\Services\ZeroTrustPricingService;
use Illuminate\Http\Request;

class FinanceApiController extends Controller
{
    /**
     * Mengambil profil MC dari sesi atau default.
     */
    private function getMC(): UserMC
    {
        $mc = request()->attributes->get('mc') ?? UserMC::first();
        if (!$mc) {
            abort(404, 'MC tidak ditemukan di database.');
        }
        return $mc;
    }

    /**
     * Mendapatkan rincian finansial Zero-Trust suatu acara (Omset, DP, Beban, Laba Bersih, Refund).
     */
    public function getEventFinancials(int $id, ZeroTrustPricingService $pricingService)
    {
        $mc = $this->getMC();
        
        $event = Event::whereHas('client', fn($q) => $q->where('mc_id', $mc->id))
            ->with(['invoice', 'expenses'])
            ->findOrFail($id);

        $financials = $pricingService->syncEventFinancials($event->id);
        $refundPolicy = $pricingService->calculateRefundPolicy($event->id);

        return response()->json([
            'success' => true,
            'data' => [
                'financials' => $financials,
                'refund_policy' => $refundPolicy,
                'expenses' => $event->expenses,
                'invoice' => $event->invoice,
            ],
        ]);
    }

    /**
     * Simulator / Kalkulator Penawaran Harga Acara (Zero-Trust).
     */
    public function calculateQuotation(Request $request, ZeroTrustPricingService $pricingService)
    {
        $mc = $this->getMC();

        $validated = $request->validate([
            'package_name' => 'nullable|string',
            'overtime_hours' => 'nullable|integer|min:0',
            'addons' => 'nullable|array',
            'discount_amount' => 'nullable|numeric|min:0',
        ]);

        $quotation = $pricingService->calculateContract(
            $mc->id,
            $validated['package_name'] ?? null,
            $validated['addons'] ?? [],
            (float) ($validated['discount_amount'] ?? 0),
            (int) ($validated['overtime_hours'] ?? 0)
        );

        return response()->json([
            'success' => true,
            'data' => $quotation,
        ]);
    }

    /**
     * Mencatat pengeluaran operasional baru untuk acara dan auto-sync laba bersih.
     */
    public function recordExpense(Request $request, int $id, ZeroTrustPricingService $pricingService)
    {
        $mc = $this->getMC();

        $event = Event::whereHas('client', fn($q) => $q->where('mc_id', $mc->id))->findOrFail($id);

        // Normalisasi input (mendukung format bahasa Indonesia dan Inggris)
        $kategori = $request->input('kategori') ?? $request->input('category');
        $jumlah = $request->input('jumlah') ?? $request->input('amount');
        $deskripsi = $request->input('deskripsi') ?? $request->input('description') ?? '';

        $request->merge([
            'kategori' => $kategori,
            'jumlah' => $jumlah,
            'deskripsi' => $deskripsi,
        ]);

        $validated = $request->validate([
            'kategori' => 'required|string|max:100',
            'jumlah' => 'required|numeric|min:1',
            'deskripsi' => 'required|string|max:255',
        ]);

        $expense = $pricingService->recordExpense(
            $event->id,
            $validated['kategori'],
            (float) $validated['jumlah'],
            $validated['deskripsi']
        );

        $financials = $pricingService->syncEventFinancials($event->id);

        return response()->json([
            'success' => true,
            'message' => 'Pengeluaran operasional berhasil dicatat & Laba Bersih disinkronkan otomatis.',
            'expense' => $expense,
            'financials' => $financials,
            'data' => [
                'expense' => $expense,
                'financials' => $financials,
            ],
        ]);
    }
}

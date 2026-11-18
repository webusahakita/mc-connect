<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Invoice;
use App\Models\Expense;
use App\Models\CmsPackage;
use App\Models\UserMC;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ZeroTrustPricingService
{
    /**
     * Tarif standar jam lembur per jam (Default: Rp 1.000.000 / jam).
     */
    protected float $defaultOvertimeRate = 1000000.00;

    /**
     * Persentase kewajiban DP standar (Default: 30%).
     */
    protected float $defaultDpPercentage = 0.30;

    /**
     * Menghitung total nilai kontrak secara Zero-Trust (100% verifikasi server-side).
     *
     * @param int $mcId
     * @param string|null $packageName
     * @param array $addons Daftar addon (misal: ['asisten' => 750000, 'wardrobe' => 500000])
     * @param float $discountAmount
     * @param int $overtimeHours
     * @return array
     */
    public function calculateContract(
        int $mcId,
        ?string $packageName = null,
        array $addons = [],
        float $discountAmount = 0.0,
        int $overtimeHours = 0
    ): array {
        // 1. Ambil harga dasar paket dari database
        $basePrice = 12500000.00; // Default Gold Luxury Wedding
        $foundPackageName = $packageName ?? 'Gold Luxury Wedding Package';

        if (!empty($packageName)) {
            $pkg = CmsPackage::where('name', $packageName)->where('mc_id', $mcId)->first();
            if ($pkg) {
                $basePrice = (float) $pkg->price;
                $foundPackageName = $pkg->name;
            }
        }

        // 2. Hitung biaya lembur
        $overtimeTotal = max(0, $overtimeHours) * $this->defaultOvertimeRate;

        // 3. Hitung biaya add-on tambahan
        $addonsTotal = 0.0;
        $cleanAddons = [];
        foreach ($addons as $addonName => $addonCost) {
            $cost = max(0, (float) $addonCost);
            $cleanAddons[$addonName] = $cost;
            $addonsTotal += $cost;
        }

        // 4. Hitung diskon yang valid (tidak boleh melebihi subtotal)
        $subtotal = $basePrice + $overtimeTotal + $addonsTotal;
        $validDiscount = min(max(0, $discountAmount), $subtotal);

        // 5. Total Kontrak Bersih
        $totalContract = $subtotal - $validDiscount;

        // 6. Rincian Termin Pembayaran
        $dpNominal = round($totalContract * $this->defaultDpPercentage, 2);
        $remainingBalance = $totalContract - $dpNominal;

        return [
            'package_name' => $foundPackageName,
            'base_price' => $basePrice,
            'overtime_hours' => $overtimeHours,
            'overtime_total' => $overtimeTotal,
            'addons' => $cleanAddons,
            'addons_total' => $addonsTotal,
            'subtotal' => $subtotal,
            'discount_amount' => $validDiscount,
            'total_contract' => $totalContract,
            'dp_percentage' => $this->defaultDpPercentage * 100,
            'nominal_dp' => $dpNominal,
            'sisa_tagihan' => $remainingBalance,
        ];
    }

    /**
     * Menyinkronkan dan menghitung ulang performa finansial suatu acara (Termasuk Laba Bersih).
     *
     * @param int $eventId
     * @return array
     */
    public function syncEventFinancials(int $eventId): array
    {
        return DB::transaction(function () use ($eventId) {
            $event = Event::with(['invoice', 'expenses'])->findOrFail($eventId);

            // 1. Ambil Pendapatan Kontrak
            $totalContract = (float) ($event->nilai_kontrak ?: ($event->total_budget ?: ($event->invoice ? $event->invoice->total_biaya : 0)));
            
            // 2. Hitung Total Pengeluaran Operasional (Expenses)
            $totalExpenses = (float) $event->expenses->sum('jumlah');

            // 3. Status Pembayaran
            $dpPaid = 0.0;
            $isPaidOff = false;
            if ($event->invoice) {
                $status = strtolower(trim((string) $event->invoice->status_bayar));
                if (in_array($status, ['paid', 'lunas', 'fully paid', 'full paid'])) {
                    $dpPaid = $totalContract;
                    $isPaidOff = true;
                } elseif (in_array($status, ['dp', 'dp paid', 'partially paid', 'dp lunas'])) {
                    $dpPaid = (float) ($event->invoice->nominal_dp ?: ($totalContract * 0.30));
                }
            }

            // 4. Kalkulasi Laba Bersih (Net Profit)
            $netProfit = $totalContract - $totalExpenses;
            $profitMargin = $totalContract > 0 ? round(($netProfit / $totalContract) * 100, 1) : 0;

            // 5. Simpan pembaruan ke metadata acara (dengan normalisasi string JSON)
            $metadata = $event->metadata;
            if (is_string($metadata)) {
                $metadata = json_decode($metadata, true) ?: [];
            }
            if (!is_array($metadata)) {
                $metadata = [];
            }

            $metadata['net_profit'] = $netProfit;
            $metadata['total_expenses'] = $totalExpenses;
            $metadata['profit_margin'] = $profitMargin;
            $metadata['financials_last_synced'] = now()->toIso8601String();

            $event->update([
                'metadata' => $metadata,
            ]);

            return [
                'event_id' => $event->id,
                'nama_acara' => $event->nama_acara,
                'total_contract' => $totalContract,
                'dp_paid' => $dpPaid,
                'remaining_balance' => max(0, $totalContract - $dpPaid),
                'total_expenses' => $totalExpenses,
                'net_profit' => $netProfit,
                'profit_margin' => $profitMargin,
                'is_paid_off' => $isPaidOff,
            ];
        });
    }

    /**
     * Mencatat pengeluaran operasional dan otomatis mengkalkulasi ulang laba bersih acara.
     *
     * @param int $eventId
     * @param string $kategori
     * @param float $jumlah
     * @param string $deskripsi
     * @return Expense
     */
    public function recordExpense(int $eventId, string $kategori, float $jumlah, string $deskripsi): Expense
    {
        $expense = Expense::create([
            'event_id' => $eventId,
            'kategori' => $kategori,
            'jumlah' => $jumlah,
            'deskripsi' => $deskripsi,
        ]);

        // Sinkronisasi ulang laba bersih
        $this->syncEventFinancials($eventId);

        return $expense;
    }

    /**
     * Menghitung kebijakan pembatalan dan hak refund secara otomatis.
     *
     * @param int $eventId
     * @param Carbon|string|null $cancellationDate
     * @return array
     */
    public function calculateRefundPolicy(int $eventId, $cancellationDate = null): array
    {
        $event = Event::with('invoice')->findOrFail($eventId);
        $eventDate = Carbon::parse($event->tanggal_acara);
        $cancelDate = $cancellationDate ? Carbon::parse($cancellationDate) : now();

        $daysBeforeEvent = (int) $cancelDate->copy()->startOfDay()->diffInDays($eventDate->copy()->startOfDay(), false);
        $totalContract = (float) ($event->nilai_kontrak ?: ($event->total_budget ?: ($event->invoice ? $event->invoice->total_biaya : 0)));
        $dpNominal = $event->invoice ? (float) $event->invoice->nominal_dp : ($totalContract * 0.30);

        if ($daysBeforeEvent > 30) {
            // H > 30 hari: Refund 50% dari nominal DP
            $refundAmount = $dpNominal * 0.50;
            $penaltyAmount = $dpNominal * 0.50;
            $keterangan = "Pembatalan lebih dari 30 hari sebelum acara. Klien berhak atas refund 50% DP (Potongan biaya administrasi & reservasi 50%).";
        } elseif ($daysBeforeEvent >= 14) {
            // H 14 - 30 hari: DP hangus 100%
            $refundAmount = 0.0;
            $penaltyAmount = $dpNominal;
            $keterangan = "Pembatalan antara H-14 hingga H-30 acara. Nominal DP dinyatakan hangus 100% sesuai klausul kontrak.";
        } else {
            // H < 14 hari: Wajib bayar penuh (denda 100% total kontrak)
            $refundAmount = 0.0;
            $penaltyAmount = $totalContract;
            $keterangan = "Pembatalan mendadak kurang dari 14 hari sebelum acara. Klien dikenakan denda senilai 100% total nilai kontrak.";
        }

        return [
            'event_id' => $event->id,
            'event_date' => $eventDate->format('Y-m-d'),
            'cancellation_date' => $cancelDate->format('Y-m-d'),
            'days_before_event' => $daysBeforeEvent,
            'total_contract' => $totalContract,
            'dp_nominal' => $dpNominal,
            'refund_amount' => $refundAmount,
            'penalty_amount' => $penaltyAmount,
            'policy_clause' => $keterangan,
        ];
    }
}

<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\CmsPackage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AntiCollisionService
{
    /**
     * Buffer waktu perjalanan dan persiapan antar-venue (dalam menit).
     * Default: 90 menit (1.5 jam).
     */
    protected int $defaultBufferMinutes = 90;

    /**
     * Memeriksa apakah jadwal yang diminta bertabrakan dengan acara yang sudah ada.
     *
     * @param int $mcId
     * @param string $eventDate Format: Y-m-d
     * @param string $startTime Format: H:i atau H:i:s
     * @param string $endTime Format: H:i atau H:i:s
     * @param int|null $excludeEventId ID acara yang dikecualikan (misal saat edit acara)
     * @param int|null $bufferMinutes Waktu transit kustom (opsional)
     * @return array
     */
    public function checkCollision(
        int $mcId,
        string $eventDate,
        string $startTime,
        string $endTime,
        ?int $excludeEventId = null,
        ?int $bufferMinutes = null
    ): array {
        $buffer = $bufferMinutes ?? $this->defaultBufferMinutes;
        $bufferTimeStr = sprintf('%02d:%02d:00', floor($buffer / 60), $buffer % 60);

        // Standarisasi format waktu ke H:i:s
        $startFormatted = strlen($startTime) === 5 ? $startTime . ':00' : $startTime;
        $endFormatted = strlen($endTime) === 5 ? $endTime . ':00' : $endTime;

        $query = Event::whereHas('client', function ($q) use ($mcId) {
            $q->where('mc_id', $mcId);
        })
        ->where('tanggal_acara', $eventDate)
        ->whereIn('status', ['Terkunci', 'Tentative', 'Review']);

        if ($excludeEventId) {
            $query->where('id', '!=', $excludeEventId);
        }

        // Logika overlap: Event bertabrakan jika:
        // (ReqStart < ExistingEnd + Buffer) AND (ReqEnd > ExistingStart - Buffer)
        $conflicts = $query->where(function ($q) use ($startFormatted, $endFormatted, $bufferTimeStr) {
            $q->whereRaw('? < ADDTIME(waktu_selesai, ?)', [$startFormatted, $bufferTimeStr])
              ->whereRaw('? > SUBTIME(waktu_mulai, ?)', [$endFormatted, $bufferTimeStr]);
        })->get();

        if ($conflicts->isNotEmpty()) {
            $first = $conflicts->first();
            $existingStart = substr($first->waktu_mulai, 0, 5);
            $existingEnd = substr($first->waktu_selesai, 0, 5);

            return [
                'has_collision' => true,
                'count' => $conflicts->count(),
                'conflicting_event' => [
                    'id' => $first->id,
                    'nama_acara' => $first->status === 'Terkunci' ? 'Jadwal Panggung Terkunci' : $first->nama_acara,
                    'status' => $first->status,
                    'waktu_mulai' => $existingStart,
                    'waktu_selesai' => $existingEnd,
                    'lokasi' => $first->lokasi,
                ],
                'message' => "Jadwal bertabrakan dengan acara '{$first->nama_acara}' ({$existingStart} - {$existingEnd} WIB) pada tanggal yang sama, termasuk jeda transit {$buffer} menit.",
            ];
        }

        return [
            'has_collision' => false,
            'count' => 0,
            'conflicting_event' => null,
            'message' => 'Jadwal aman dan tersedia untuk dibooking.',
        ];
    }

    /**
     * Mengeksekusi booking secara atomik (Race-Condition Safe).
     * Menggunakan DB::transaction dan SELECT ... FOR UPDATE untuk mengunci baris data jadwal.
     *
     * @param int $mcId
     * @param array $validatedData
     * @return array
     * @throws ValidationException
     */
    public function executeAtomicBooking(int $mcId, array $validatedData): array
    {
        return DB::transaction(function () use ($mcId, $validatedData) {
            $eventDate = $validatedData['tanggal_acara'];
            $startTime = $validatedData['waktu_mulai'];
            $endTime = $validatedData['waktu_selesai'];

            // 1. Kunci baris jadwal yang ada pada tanggal tersebut untuk mencegah race-condition
            Event::whereHas('client', function ($q) use ($mcId) {
                $q->where('mc_id', $mcId);
            })
            ->where('tanggal_acara', $eventDate)
            ->lockForUpdate()
            ->get();

            // 2. Evaluasi bentrok jadwal di dalam transaksi terisolasi
            $collision = $this->checkCollision($mcId, $eventDate, $startTime, $endTime);

            if ($collision['has_collision']) {
                throw ValidationException::withMessages([
                    'tanggal_acara' => [$collision['message']],
                ]);
            }

            // 3. Tentukan Harga Paket Layanan (Zero-Trust)
            $packagePrice = 12500000.00;
            if (!empty($validatedData['paket_layanan'])) {
                $package = CmsPackage::where('name', $validatedData['paket_layanan'])
                    ->where('mc_id', $mcId)
                    ->first();
                if ($package) {
                    $packagePrice = (float) $package->price;
                }
            }

            // 4. Buat Rekord Klien
            $client = Client::create([
                'mc_id' => $mcId,
                'nama_pic' => $validatedData['nama_pic'],
                'no_wa' => $validatedData['no_wa'],
                'email' => $validatedData['email'] ?? null,
                'tipe_klien' => $validatedData['tipe_klien'] ?? 'Personal',
                'kategori' => $validatedData['tipe_acara'] ?? 'Wedding',
                'nilai_kontrak' => $packagePrice,
                'nama_acara' => $validatedData['nama_acara'],
                'tanggal_acara' => $eventDate,
            ]);

            // 5. Buat Rekord Acara (Status awal: Tentative)
            $event = Event::create([
                'client_id' => $client->id,
                'nama_acara' => $validatedData['nama_acara'],
                'lokasi' => $validatedData['lokasi'],
                'tanggal_acara' => $eventDate,
                'waktu_mulai' => $startTime,
                'waktu_selesai' => $endTime,
                'status' => 'Tentative',
                'catatan_khusus' => $validatedData['catatan_khusus'] ?? '',
                'tipe_acara' => $validatedData['tipe_acara'] ?? 'Wedding Reception',
                'total_budget' => $packagePrice,
                'nilai_kontrak' => $packagePrice,
            ]);

            // 6. Buat Draft Tagihan / Invoice Resmi
            $dpNominal = $packagePrice * 0.30; // Kebijakan DP 30% standar
            $invNumber = 'INV-' . date('Ym') . '-' . str_pad((string) $event->id, 4, '0', STR_PAD_LEFT);

            $invoice = Invoice::create([
                'event_id' => $event->id,
                'invoice_number' => $invNumber,
                'total_biaya' => $packagePrice,
                'nominal_dp' => $dpNominal,
                'sisa_tagihan' => $packagePrice - $dpNominal,
                'status_bayar' => 'Unpaid',
                'batas_waktu_bayar' => now()->addDays(3),
                'qris_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . $invNumber,
            ]);

            return [
                'client' => $client,
                'event' => $event,
                'invoice' => $invoice,
            ];
        });
    }
}

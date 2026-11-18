<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Event;
use App\Models\UserMC;
use App\Services\EscPosBuilder;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * Memastikan Invoice selalu ada untuk suatu acara (Auto-create jika belum ada).
     */
    private function resolveInvoiceAndEvent($id): array
    {
        $invoice = Invoice::with(['event.client.mc'])->find($id);

        if (!$invoice) {
            $event = Event::with(['client.mc', 'invoice'])->findOrFail($id);
            $invoice = $event->invoice;

            // Auto-create invoice jika acara lama belum memiliki invoice
            if (!$invoice) {
                $total = (float) ($event->nilai_kontrak ?: ($event->total_budget ?: 12500000.00));
                $dp = round($total * 0.30, 2);
                $invNumber = 'INV-' . date('Ym') . '-' . str_pad((string)$event->id, 4, '0', STR_PAD_LEFT);

                $invoice = Invoice::create([
                    'event_id' => $event->id,
                    'invoice_number' => $invNumber,
                    'total_biaya' => $total,
                    'nominal_dp' => $dp,
                    'sisa_tagihan' => $total - $dp,
                    'status_bayar' => 'Unpaid',
                    'batas_waktu_bayar' => now()->addDays(3),
                    'qris_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . $invNumber,
                ]);
            }

            $mc = $event->client ? $event->client->mc : UserMC::first();
        } else {
            $event = $invoice->event;
            $mc = $event && $event->client ? $event->client->mc : UserMC::first();
        }

        if (!$mc) {
            $mc = UserMC::first();
        }

        return [$invoice, $event, $mc];
    }

    /**
     * Menampilkan Pratinjau Invoice Resmi Ber-QRIS siap cetak / PDF.
     */
    public function show($id)
    {
        [$invoice, $event, $mc] = $this->resolveInvoiceAndEvent($id);

        return view('admin.invoice-print', compact('invoice', 'event', 'mc'));
    }

    /**
     * Unduh / Pratinjau PDF Invoice.
     */
    public function downloadPdf($id)
    {
        return $this->show($id);
    }

    /**
     * Menampilkan Dokumen Surat Perjanjian Kerja (SPK) Kontrak Resmi siap cetak / PDF.
     */
    public function showSpk($eventId)
    {
        [$invoice, $event, $mc] = $this->resolveInvoiceAndEvent($eventId);

        return view('admin.spk-print', compact('event', 'mc', 'invoice'));
    }

    /**
     * Menampilkan Pratinjau Struk Kasir Thermal (58mm/80mm) siap cetak via Bluetooth / Web Print.
     */
    public function showThermalReceipt($id)
    {
        [$invoice, $event, $mc] = $this->resolveInvoiceAndEvent($id);

        return view('admin.thermal-receipt', compact('invoice', 'event', 'mc'));
    }

    /**
     * Mengunduh raw ESC/POS binary stream untuk dikirim langsung ke Bluetooth thermal printer.
     */
    public function downloadThermalBinary($id, EscPosBuilder $builder)
    {
        [$invoice, $event, $mc] = $this->resolveInvoiceAndEvent($id);

        $binary = $builder->buildReceipt($invoice, $event, $mc);

        return response($binary)
            ->header('Content-Type', 'application/octet-stream')
            ->header('Content-Disposition', 'attachment; filename="receipt-' . $invoice->invoice_number . '.bin"');
    }
}

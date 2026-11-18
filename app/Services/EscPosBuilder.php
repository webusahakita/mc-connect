<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Event;
use App\Models\UserMC;

class EscPosBuilder
{
    // ESC/POS Command Constants
    const ESC = "\x1B";
    const GS  = "\x1D";

    protected string $buffer = '';

    /**
     * Reset / Inisialisasi printer
     */
    public function initialize(): self
    {
        $this->buffer .= self::ESC . "@";
        return $this;
    }

    /**
     * Atur perataan teks (left, center, right)
     */
    public function align(string $alignment = 'left'): self
    {
        $alignByte = match (strtolower($alignment)) {
            'center' => "\x01",
            'right'  => "\x02",
            default  => "\x00",
        };
        $this->buffer .= self::ESC . "a" . $alignByte;
        return $this;
    }

    /**
     * Atur mode teks tebal (bold)
     */
    public function bold(bool $enabled = true): self
    {
        $this->buffer .= self::ESC . "E" . ($enabled ? "\x01" : "\x00");
        return $this;
    }

    /**
     * Atur ukuran teks ganda (Double Height / Width)
     */
    public function textDouble(bool $enabled = true): self
    {
        $this->buffer .= self::GS . "!" . ($enabled ? "\x11" : "\x00");
        return $this;
    }

    /**
     * Tambahkan satu baris teks dengan line feed
     */
    public function text(string $text): self
    {
        $this->buffer .= $text . "\n";
        return $this;
    }

    /**
     * Buat baris dua kolom (Rata Kiri & Rata Kanan)
     * Contoh: "Total Kontrak:       Rp 12.500.000" (lebar 32 karakter untuk 58mm)
     */
    public function twoColumn(string $left, string $right, int $width = 32): self
    {
        $leftLen = strlen($left);
        $rightLen = strlen($right);
        $spaceLen = max(1, $width - ($leftLen + $rightLen));
        $this->buffer .= $left . str_repeat(' ', $spaceLen) . $right . "\n";
        return $this;
    }

    /**
     * Garis pemisah horizontal
     */
    public function separator(string $char = '-', int $width = 32): self
    {
        $this->buffer .= str_repeat($char, $width) . "\n";
        return $this;
    }

    /**
     * Feed kertas beberapa baris
     */
    public function feed(int $lines = 3): self
    {
        $this->buffer .= self::ESC . "d" . chr($lines);
        return $this;
    }

    /**
     * Potong kertas (Paper Cut)
     */
    public function cut(): self
    {
        $this->buffer .= self::GS . "V" . "\x41" . "\x00";
        return $this;
    }

    /**
     * Ambil string biner ESC/POS yang siap dikirim ke socket/Bluetooth printer
     */
    public function getBinary(): string
    {
        return $this->buffer;
    }

    /**
     * Menghasilkan binary buffer struk kuitansi DP / pelunasan MC format 58mm (32 chars)
     */
    public function buildReceipt(Invoice $invoice, Event $event, UserMC $mc, int $width = 32): string
    {
        $stageName = strtoupper($mc->nama_panggung ?: 'MASTER OF CEREMONY');
        $invNumber = $invoice->invoice_number;
        $totalFormatted = 'Rp ' . number_format($invoice->total_biaya, 0, ',', '.');
        $dpFormatted = 'Rp ' . number_format($invoice->nominal_dp, 0, ',', '.');
        $sisaFormatted = 'Rp ' . number_format($invoice->sisa_tagihan, 0, ',', '.');
        $dateStr = $invoice->created_at ? $invoice->created_at->format('d/m/Y H:i') : date('d/m/Y H:i');
        $eventDateStr = $event->tanggal_acara ? $event->tanggal_acara->format('d/m/Y') : '-';
        $clientName = substr($event->client ? $event->client->nama_pic : 'Klien', 0, 18);
        $eventTitle = substr($event->nama_acara, 0, $width);

        return $this->initialize()
            ->align('center')
            ->bold(true)
            ->textDouble(true)
            ->text($stageName)
            ->textDouble(false)
            ->bold(false)
            ->text("KUITANSI TANDA TERIMA DP MC")
            ->text("WA: " . ($mc->no_telp ?: '08123456789'))
            ->separator('=', $width)
            ->align('left')
            ->twoColumn("No. Inv:", $invNumber, $width)
            ->twoColumn("Tanggal :", $dateStr, $width)
            ->twoColumn("Klien   :", $clientName, $width)
            ->twoColumn("Tgl Show:", $eventDateStr, $width)
            ->separator('-', $width)
            ->bold(true)
            ->text("ACARA: " . $eventTitle)
            ->bold(false)
            ->twoColumn("Waktu  :", substr($event->waktu_mulai, 0, 5) . " - " . substr($event->waktu_selesai, 0, 5) . " WIB", $width)
            ->separator('-', $width)
            ->twoColumn("Total Kontrak:", $totalFormatted, $width)
            ->bold(true)
            ->twoColumn("Uang Muka (DP):", $dpFormatted, $width)
            ->bold(false)
            ->twoColumn("Sisa Tagihan :", $sisaFormatted, $width)
            ->separator('=', $width)
            ->align('center')
            ->bold(true)
            ->text("STATUS: " . strtoupper($invoice->status_bayar ?: 'DP PAID'))
            ->bold(false)
            ->text("Pelunasan wajib diselesaikan")
            ->text("selambatnya H-7 sebelum acara.")
            ->text("--- Terima Kasih ---")
            ->feed(4)
            ->cut()
            ->getBinary();
    }
}

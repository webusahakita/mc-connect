<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Struk Thermal - {{ $invoice->invoice_number }} - {{ $mc->nama_panggung }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body {
            background: #0F172A;
            color: #0F172A;
            font-family: 'JetBrains Mono', monospace;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            min-height: 100vh;
            margin: 0;
            padding: 2.5rem 1rem;
        }
        .actions-bar {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            justify-content: center;
        }
        .btn-thermal {
            background: #D4AF37;
            color: #000;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            font-size: 0.9rem;
            padding: 0.65rem 1.4rem;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
            transition: all 0.2s;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .btn-thermal:hover { background: #B89628; transform: translateY(-1px); }
        .btn-sec {
            background: #1E293B;
            color: #CBD5E1;
            border: 1px solid #334155;
            box-shadow: none;
        }
        .btn-sec:hover { background: #334155; color: #fff; }
        .receipt-paper {
            width: 320px;
            background: #FFFFFF;
            padding: 1.8rem 1.4rem;
            box-shadow: 0 10px 35px rgba(0,0,0,0.4);
            border-radius: 4px;
            font-size: 12px;
            line-height: 1.45;
            color: #111827;
            border-top: 5px solid #D4AF37;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .brand-title {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .divider {
            border: none;
            border-top: 1px dashed #9CA3AF;
            margin: 0.65rem 0;
        }
        .divider-double {
            border: none;
            border-top: 1px solid #111827;
            border-bottom: 1px solid #111827;
            height: 3px;
            margin: 0.65rem 0;
        }
        .row-kv {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
        }
        .total-highlight {
            font-size: 13px;
            font-weight: 800;
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
        }
        .qr-center {
            display: flex;
            justify-content: center;
            margin: 0.8rem 0;
        }
        @media print {
            body { background: #fff; padding: 0; }
            .actions-bar { display: none !important; }
            .receipt-paper {
                box-shadow: none;
                border: none;
                width: 100% !important;
                max-width: 58mm;
                padding: 4mm 2mm;
                margin: 0;
            }
            @page {
                size: 58mm auto;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="actions-bar">
        <button class="btn-thermal" onclick="window.print()">🖨️ Cetak ke Printer Thermal (58/80mm)</button>
        <a href="{{ route('invoice.thermal-binary', $invoice->id) }}" class="btn-thermal btn-sec">💾 Unduh Raw Binary (ESC/POS)</a>
        <a href="/admin" class="btn-thermal btn-sec">← Kembali</a>
    </div>

    <div class="receipt-paper">
        <div class="text-center">
            <div class="brand-title">{{ strtoupper($mc->nama_panggung ?: 'MASTER OF CEREMONY') }}</div>
            <div style="font-size:10px; color:#4B5563;">PROFESSIONAL EVENT HOST</div>
            <div style="font-size:10px; color:#4B5563;">WA: {{ $mc->no_telp ?: '0812-3456-7890' }}</div>
        </div>

        <div class="divider-double"></div>

        <div class="text-center font-bold" style="font-size:11px; margin-bottom:4px;">
            KUITANSI TANDA TERIMA DP
        </div>

        <div class="row-kv"><span>No. Inv</span><span class="font-bold">{{ $invoice->invoice_number }}</span></div>
        <div class="row-kv"><span>Tanggal</span><span>{{ $invoice->created_at ? $invoice->created_at->format('d/m/Y H:i') : date('d/m/Y H:i') }}</span></div>
        <div class="row-kv"><span>Klien</span><span class="font-bold">{{ substr($event->client ? $event->client->nama_pic : 'Klien', 0, 16) }}</span></div>
        <div class="row-kv"><span>Tgl Acara</span><span>{{ $event->tanggal_acara ? $event->tanggal_acara->format('d/m/Y') : '-' }}</span></div>

        <div class="divider"></div>

        <div class="font-bold" style="margin-bottom:2px;">ACARA:</div>
        <div style="font-size:11px; margin-bottom:3px;">{{ $event->nama_acara }}</div>
        <div class="row-kv" style="font-size:11px;">
            <span>Waktu:</span>
            <span>{{ substr($event->waktu_mulai, 0, 5) }} - {{ substr($event->waktu_selesai, 0, 5) }} WIB</span>
        </div>

        <div class="divider"></div>

        <div class="row-kv"><span>Total Kontrak:</span><span>Rp {{ number_format($invoice->total_biaya, 0, ',', '.') }}</span></div>
        <div class="total-highlight">
            <span>UANG MUKA (DP):</span>
            <span>Rp {{ number_format($invoice->nominal_dp, 0, ',', '.') }}</span>
        </div>
        <div class="row-kv" style="color:#DC2626; font-weight:700;">
            <span>Sisa Tagihan:</span>
            <span>Rp {{ number_format($invoice->sisa_tagihan, 0, ',', '.') }}</span>
        </div>

        <div class="divider-double"></div>

        <div class="text-center">
            <span style="display:inline-block; border:1px solid #111827; padding:2px 8px; font-weight:800; font-size:11px; margin-bottom:6px;">
                STATUS: {{ strtoupper($invoice->status_bayar ?: 'DP PAID') }}
            </span>
            <div style="font-size:9.5px; color:#4B5563; line-height:1.4;">
                Pelunasan wajib diselesaikan selambatnya H-7 sebelum hari acara.
            </div>
            <div class="qr-center">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data={{ urlencode($invoice->invoice_number) }}" alt="QR" style="width:70px; height:70px;">
            </div>
            <div style="font-size:10px; font-weight:600;">*** TERIMA KASIH ***</div>
        </div>
    </div>
</body>
</html>

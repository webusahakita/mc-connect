<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $invoice->invoice_number }} - {{ $mc->nama_panggung }}</title>
    <style>
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #F1F5F9;
            color: #0F172A;
            margin: 0;
            padding: 2rem;
        }
        .invoice-sheet {
            max-width: 800px;
            margin: 0 auto;
            background: #FFFFFF;
            padding: 3rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
        }
        .brand-title {
            font-size: 1.8rem;
            font-weight: 800;
            color: #D4AF37;
        }
        .invoice-meta {
            text-align: right;
        }
        .invoice-number {
            font-size: 1.2rem;
            font-weight: 800;
            color: #0F172A;
        }
        .invoice-details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
            font-size: 0.95rem;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
        }
        th {
            background: #F8FAFC;
            padding: 0.9rem 1rem;
            text-align: left;
            font-size: 0.85rem;
            text-transform: uppercase;
            border-bottom: 2px solid #E2E8F0;
        }
        td {
            padding: 1rem;
            border-bottom: 1px solid #E2E8F0;
        }
        .total-box {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 2rem;
        }
        .total-table {
            width: 320px;
        }
        .total-table td {
            padding: 0.5rem 0;
            border: none;
        }
        .qris-section {
            background: #F8FAFC;
            border: 1px dashed #CBD5E1;
            padding: 1.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }
        .btn-print {
            background: #D4AF37;
            color: #000;
            font-weight: 700;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            position: fixed;
            top: 2rem;
            right: 2rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        @media print {
            body { background: #fff; padding: 0; }
            .invoice-sheet { box-shadow: none; padding: 0; }
            .btn-print { display: none; }
        }
    </style>
</head>
<body>
    <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>

    <div class="invoice-sheet">
        <div class="invoice-header">
            <div>
                <div class="brand-title">{{ $mc->nama_panggung }}</div>
                <div style="color:#64748B; font-size:0.9rem; margin-top:0.25rem;">
                    Professional Master of Ceremony & Event Host<br>
                    WhatsApp: {{ $mc->no_telp }} | Email: {{ $mc->email }}
                </div>
            </div>
            <div class="invoice-meta">
                <div class="invoice-number">{{ $invoice->invoice_number }}</div>
                <div style="color:#64748B; font-size:0.85rem; margin-top:0.25rem;">
                    Tanggal: {{ $invoice->created_at->format('d M Y') }}<br>
                    Batas Bayar: {{ $invoice->batas_waktu_bayar ? $invoice->batas_waktu_bayar->format('d M Y') : 'H-2 Acara' }}
                </div>
                <div style="margin-top:0.5rem;">
                    <span style="background:{{ $invoice->status_bayar === 'Fully Paid' ? '#DCFCE7' : ($invoice->status_bayar === 'DP Paid' ? '#FEF3C7' : '#FEE2E2') }}; color:{{ $invoice->status_bayar === 'Fully Paid' ? '#166534' : ($invoice->status_bayar === 'DP Paid' ? '#92400E' : '#991B1B') }}; padding:0.25rem 0.75rem; border-radius:999px; font-weight:700; font-size:0.75rem; text-transform:uppercase;">
                        Status: {{ $invoice->status_bayar }}
                    </span>
                </div>
            </div>
        </div>

        <div class="invoice-details-grid">
            <div>
                <strong style="color:#64748B; font-size:0.8rem; text-transform:uppercase;">Tagihan Kepada (Klien):</strong>
                <div style="font-size:1.1rem; font-weight:700; margin-top:0.25rem;">{{ $event->client->nama_pic }}</div>
                <div style="color:#475569; margin-top:0.2rem;">
                    Tipe Klien: {{ $event->client->tipe_klien }}<br>
                    No. WhatsApp: {{ $event->client->no_wa }}
                </div>
            </div>
            <div>
                <strong style="color:#64748B; font-size:0.8rem; text-transform:uppercase;">Detail Acara:</strong>
                <div style="font-size:1.05rem; font-weight:700; margin-top:0.25rem;">{{ $event->nama_acara }}</div>
                <div style="color:#475569; margin-top:0.2rem;">
                    Tanggal: {{ $event->tanggal_acara->format('d F Y') }}<br>
                    Waktu: {{ substr($event->waktu_mulai, 0, 5) }} - {{ substr($event->waktu_selesai, 0, 5) }} WIB<br>
                    Lokasi: {{ $event->lokasi }}
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Deskripsi Layanan</th>
                    <th style="text-align:right;">Investasi</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>Jasa Pemandu Acara Profesional (MC) - {{ $event->nama_acara }}</strong><br>
                        <span style="font-size:0.85rem; color:#64748B;">Termasuk koordinasi rundown, naskah suara teleprompter, cue musik panggung, dan konsultasi pra-acara.</span>
                    </td>
                    <td style="text-align:right; font-weight:700; font-size:1.05rem;">
                        Rp {{ number_format($invoice->total_biaya, 0, ',', '.') }}
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="total-box">
            <table class="total-table">
                <tr>
                    <td>Total Nilai Kontrak:</td>
                    <td style="text-align:right; font-weight:700;">Rp {{ number_format($invoice->total_biaya, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Nominal DP (50%):</td>
                    <td style="text-align:right; color:#16A34A; font-weight:700;">- Rp {{ number_format($invoice->nominal_dp, 0, ',', '.') }}</td>
                </tr>
                <tr style="font-size:1.2rem; border-top:2px solid #0F172A;">
                    <td><strong>Sisa Tagihan:</strong></td>
                    <td style="text-align:right; color:#DC2626; font-weight:800;">Rp {{ number_format($invoice->sisa_tagihan, 0, ',', '.') }}</td>
                </tr>
            </table>
        </div>

        <div class="qris-section">
            <img src="{{ $invoice->qris_url ?? 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=INVOICE_MOCK' }}" alt="QRIS" style="width:110px; height:110px; background:#fff; padding:4px; border-radius:4px;">
            <div>
                <strong style="font-size:1rem;">Instruksi Pembayaran Digital (QRIS / VA)</strong>
                <p style="font-size:0.85rem; color:#475569; margin:0.35rem 0 0.5rem;">
                    Pindai QRIS di samping menggunakan Mobile Banking (BCA, Mandiri, BNI, BRI) atau e-Wallet (GoPay, OVO, ShopeePay).
                </p>
                <div style="font-size:0.85rem; color:#0F172A;">
                    <strong>Rekening Transfer Alternatif:</strong> BCA 123-456-7890 a/n Vanya Arsyad
                </div>
            </div>
        </div>
    </div>
</body>
</html>

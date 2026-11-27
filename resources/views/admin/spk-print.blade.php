<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Surat Perjanjian Kerja (SPK) - {{ $event->nama_acara }} - {{ $mc->nama_panggung }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #F1F5F9;
            color: #0F172A;
            margin: 0;
            padding: 2.5rem 1rem;
            line-height: 1.6;
        }
        .contract-sheet {
            max-width: 850px;
            margin: 0 auto;
            background: #FFFFFF;
            padding: 3.5rem 4rem;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            border: 1px solid #E2E8F0;
        }
        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0F172A;
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
        }
        .brand-title {
            font-size: 1.8rem;
            font-weight: 800;
            color: #D4AF37;
            letter-spacing: -0.5px;
        }
        .brand-sub {
            color: #64748B;
            font-size: 0.88rem;
            margin-top: 0.25rem;
        }
        .doc-title-box {
            text-align: center;
            margin-bottom: 2.5rem;
        }
        .doc-title {
            font-size: 1.35rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0F172A;
        }
        .doc-number {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.88rem;
            color: #64748B;
            margin-top: 0.25rem;
        }
        .section-title {
            font-size: 1rem;
            font-weight: 700;
            color: #0F172A;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 0.35rem;
            margin-top: 1.75rem;
            margin-bottom: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        p, li {
            font-size: 0.9rem;
            color: #334155;
            margin: 0.5rem 0;
        }
        ol {
            padding-left: 1.4rem;
            margin: 0.5rem 0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 140px 10px 1fr;
            gap: 0.35rem 0;
            font-size: 0.9rem;
            margin: 0.75rem 0;
        }
        .info-label { color: #64748B; font-weight: 600; }
        .info-value { color: #0F172A; font-weight: 600; }
        .price-highlight {
            background: #FEF3C7;
            border-left: 4px solid #D4AF37;
            padding: 1rem 1.25rem;
            border-radius: 6px;
            margin: 1rem 0;
            font-size: 0.92rem;
        }
        .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            margin-top: 3.5rem;
            padding-top: 2rem;
            border-top: 1px dashed #CBD5E1;
            text-align: center;
        }
        .sig-box {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 160px;
        }
        .sig-role {
            font-size: 0.85rem;
            font-weight: 600;
            color: #64748B;
            text-transform: uppercase;
        }
        .sig-name {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0F172A;
            border-top: 1px solid #0F172A;
            padding-top: 0.4rem;
        }
        .btn-print {
            background: #D4AF37;
            color: #000;
            font-weight: 700;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            position: fixed;
            top: 2rem;
            right: 2rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            transition: all 0.2s;
            font-family: inherit;
        }
        .btn-print:hover { background: #B89628; transform: translateY(-1px); }
        .badge-verified {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #DCFCE7;
            color: #166534;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 700;
        }
        @media screen and (max-width: 640px) {
            body { padding: 0.75rem; }
            .contract-sheet { padding: 1.25rem; }
            .header-section { flex-direction: column; gap: 0.75rem; }
            .info-grid { grid-template-columns: 110px 8px 1fr; font-size: 0.85rem; }
            .signatures-grid { grid-template-columns: 1fr; gap: 1.5rem; margin-top: 2rem; }
            .sig-box { height: 120px; }
            .btn-print { position: static; display: block; width: 100%; margin-bottom: 1rem; }
        }
        @media print {
            body { background: #fff; padding: 0; }
            .contract-sheet { box-shadow: none; border: none; padding: 0; max-width: 100%; }
            .btn-print { display: none; }
        }
    </style>
</head>
<body>
    <button class="btn-print" onclick="window.print()">🖨️ Cetak / Unduh SPK PDF</button>

    <div class="contract-sheet">
        <!-- Header -->
        <div class="header-section">
            <div>
                <div class="brand-title">{{ $mc->nama_panggung }}</div>
                <div class="brand-sub">
                    Professional Master of Ceremony & Stage Director<br>
                    WhatsApp: {{ $mc->no_telp }} | Email: {{ $mc->email }}
                </div>
            </div>
            <div style="text-align:right;">
                <span class="badge-verified">✓ Dokumen Resmi Terverifikasi</span>
                <div style="font-size:0.75rem; color:#64748B; margin-top:0.35rem;">
                    Dicetak: {{ date('d M Y, H:i') }} WIB
                </div>
            </div>
        </div>

        <!-- Judul Dokumen -->
        <div class="doc-title-box">
            <div class="doc-title">Surat Perjanjian Kerja Sama (SPK)</div>
            <div style="font-size:0.95rem; font-weight:600; color:#475569;">Jasa Pemandu Acara Profesional (Master of Ceremony)</div>
            <div class="doc-number">Nomor: SPK-{{ date('Ym') }}-{{ str_pad((string)$event->id, 4, '0', STR_PAD_LEFT) }}</div>
        </div>

        <p>Pada hari ini, kesepakatan kerja sama pemanduan acara telah disepakati bersama oleh dan antara para pihak di bawah ini:</p>

        <!-- Pasal 1: Identitas Para Pihak -->
        <div class="section-title">Pasal 1: Para Pihak</div>
        <div class="info-grid">
            <span class="info-label">PIHAK PERTAMA</span><span>:</span><span class="info-value">{{ $mc->nama_lengkap ?? $mc->nama_panggung }} (Manajemen {{ $mc->nama_panggung }})</span>
            <span class="info-label">Profesi</span><span>:</span><span class="info-value">Professional Master of Ceremony</span>
            <span class="info-label">Kontak Resmi</span><span>:</span><span class="info-value">{{ $mc->no_telp }} (WhatsApp)</span>
        </div>
        <p style="font-size:0.85rem; color:#64748B; margin-bottom:1rem;">Selanjutnya disebut sebagai <strong>PIHAK PERTAMA (Penyedia Jasa)</strong>.</p>

        <div class="info-grid">
            <span class="info-label">PIHAK KEDUA</span><span>:</span><span class="info-value">{{ $event->client?->nama_pic ?? 'Klien (Belum Ditentukan)' }}</span>
            <span class="info-label">Tipe Klien</span><span>:</span><span class="info-value">{{ $event->client?->tipe_klien ?? 'Personal' }} ({{ $event->client?->kategori ?? 'Wedding' }})</span>
            <span class="info-label">No. WhatsApp</span><span>:</span><span class="info-value">{{ $event->client?->no_wa ?? '-' }}</span>
            <span class="info-label">Email</span><span>:</span><span class="info-value">{{ $event->client?->email ?? '-' }}</span>
        </div>
        <p style="font-size:0.85rem; color:#64748B;">Selanjutnya disebut sebagai <strong>PIHAK KEDUA (Klien / Pengguna Jasa)</strong>.</p>

        <!-- Pasal 2: Rincian Acara -->
        <div class="section-title">Pasal 2: Rincian Acara</div>
        <div class="info-grid">
            <span class="info-label">Nama Acara</span><span>:</span><span class="info-value">{{ $event->nama_acara }}</span>
            <span class="info-label">Hari / Tanggal</span><span>:</span><span class="info-value">{{ $event->tanggal_acara ? $event->tanggal_acara->translatedFormat('l, d F Y') : '-' }}</span>
            <span class="info-label">Waktu Panggung</span><span>:</span><span class="info-value">{{ substr($event->waktu_mulai, 0, 5) }} - {{ substr($event->waktu_selesai, 0, 5) }} WIB</span>
            <span class="info-label">Venue / Lokasi</span><span>:</span><span class="info-value">{{ $event->lokasi }}</span>
            <span class="info-label">Dresscode MC</span><span>:</span><span class="info-value">{{ $event->catatan_khusus ?: 'Sesuai arahan tema klien / Palet Formal' }}</span>
        </div>

        <!-- Pasal 3: Honorarium & Pembayaran -->
        <div class="section-title">Pasal 3: Nilai Kontrak & Pembayaran</div>
        <div class="price-highlight">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
                <span>Total Nilai Kontrak Investasi:</span>
                <strong style="font-size:1.1rem; color:#0F172A;">Rp {{ number_format($event->nilai_kontrak ?? $event->total_budget, 0, ',', '.') }}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; color:#166534;">
                <span>Uang Muka (DP 30-50% Terverifikasi):</span>
                <strong>Rp {{ number_format($invoice ? $invoice->nominal_dp : ($event->nilai_kontrak * 0.3), 0, ',', '.') }}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:1px dashed #CBD5E1; padding-top:0.4rem; color:#DC2626; font-weight:700;">
                <span>Sisa Pelunasan (Wajib Lunas H-7 Acara):</span>
                <span>Rp {{ number_format($invoice ? $invoice->sisa_tagihan : ($event->nilai_kontrak * 0.7), 0, ',', '.') }}</span>
            </div>
        </div>

        <!-- Pasal 4: Fasilitas & Technical Riders -->
        <div class="section-title">Pasal 4: Hak, Kewajiban & Technical Riders</div>
        <ol>
            <li><strong>PIHAK PERTAMA</strong> berkewajiban hadir di lokasi acara minimal <strong>60 menit</strong> sebelum acara dimulai untuk melakukan koordinasi rundown akhir dan soundcheck.</li>
            <li><strong>PIHAK KEDUA</strong> berkewajiban menyediakan fasilitas teknis audio standar panggung:
                <ul>
                    <li>Minimal 2 (dua) unit Wireless Microphone berkualitas profesional (Shure / Sennheiser) dengan baterai baru.</li>
                    <li>Stage monitor audio / foldback yang jelas di posisi MC berdiri.</li>
                    <li>Ruang transit / tunggu VIP serta konsumsi bagi MC dan 1 (satu) orang asisten panggung.</li>
                </ul>
            </li>
            <li>Koordinasi susunan acara (*Technical Meeting*) dilakukan selambat-lambatnya H-7 acara.</li>
        </ol>

        <!-- Pasal 5: Pembatalan & Force Majeure -->
        <div class="section-title">Pasal 5: Pembatalan & Force Majeure</div>
        <ol>
            <li>Pembatalan sepihak oleh PIHAK KEDUA lebih dari 30 hari sebelum hari H dikenakan pemotongan administrasi sebesar 50% dari uang muka (DP).</li>
            <li>Pembatalan antara H-14 hingga H-30 sebelum hari H mengakibatkan seluruh uang muka (DP) dinyatakan hangus.</li>
            <li>Pembatalan kurang dari 14 hari sebelum hari H mewajibkan PIHAK KEDUA melunasi 100% total nilai kontrak.</li>
            <li>Apabila terjadi keadaan kahar (*Force Majeure* seperti gempa bumi, banjir bandang, kebijakan darurat negara), kedua belah pihak sepakat melakukan penjadwalan ulang (*reschedule*) tanpa dikenakan denda.</li>
        </ol>

        <!-- Tanda Tangan Para Pihak -->
        <div class="signatures-grid">
            <div class="sig-box">
                <div class="sig-role">PIHAK PERTAMA (Penyedia Jasa)</div>
                <div style="margin: 1.5rem 0 0.5rem;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=SIGNED-BY-{{ urlencode($mc->nama_panggung) }}-SPK-{{ $event->id }}" alt="QR Sign" style="width:75px; height:75px; opacity:0.85;">
                </div>
                <div class="sig-name">{{ $mc->nama_lengkap ?? $mc->nama_panggung }}</div>
            </div>
            <div class="sig-box">
                <div class="sig-role">PIHAK KEDUA (Klien)</div>
                <div style="margin: 1.5rem 0 0.5rem;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=CLIENT-VERIFIED-{{ urlencode($event->client?->nama_pic ?? 'CLIENT') }}-{{ $event->id }}" alt="QR Sign" style="width:75px; height:75px; opacity:0.85;">
                </div>
                <div class="sig-name">{{ $event->client?->nama_pic ?? 'Klien Terdaftar' }}</div>
            </div>
        </div>
    </div>
</body>
</html>

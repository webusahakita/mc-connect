@extends('layouts.app')

@section('title', 'Command Center - ' . $event->nama_acara)

@section('content')
<div class="command-center-layout">
    <!-- Main Workspace -->
    <div class="command-center-main">
        <!-- Event Command Center Top Header Bar -->
        <div class="ecc-header">
            <div class="ecc-title-group">
                <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.4rem;">
                    @if($event->status === 'Terkunci')
                    <span class="badge badge-locked" id="headerStatusBadge">🔒 Status: Terkunci</span>
                    @elseif($event->status === 'Tentative')
                    <span class="badge badge-tentative" id="headerStatusBadge">⏳ Status: Tentative</span>
                    @elseif($event->status === 'Review')
                    <span class="badge badge-review" id="headerStatusBadge">📝 Status: Review</span>
                    @else
                    <span class="badge badge-completed" id="headerStatusBadge">✓ Status: Selesai</span>
                    @endif
                    <span style="color:var(--text-muted); font-size:0.85rem;">Event_ID #{{ $event->id }}</span>
                </div>
                <h1>{{ $event->nama_acara }}</h1>
                <div class="ecc-meta-bar">
                    <span>📅 {{ $event->tanggal_acara->format('l, d F Y') }}</span>
                    <span>⏰ {{ substr($event->waktu_mulai, 0, 5) }} - {{ substr($event->waktu_selesai, 0, 5) }} WIB</span>
                    <span>📍 {{ $event->lokasi }}</span>
                    <span>👤 {{ $event->client->nama_pic }} ({{ $event->client->no_wa }})</span>
                </div>
            </div>

            <div class="ecc-actions">
                <select class="form-select" style="width:auto; padding:0.55rem 1rem; font-size:0.88rem;" onchange="updateEventStatus(this.value)">
                    <option value="Review" {{ $event->status === 'Review' ? 'selected' : '' }}>Set: Review</option>
                    <option value="Tentative" {{ $event->status === 'Tentative' ? 'selected' : '' }}>Set: Tentative</option>
                    <option value="Terkunci" {{ $event->status === 'Terkunci' ? 'selected' : '' }}>Set: Terkunci (DP Paid)</option>
                    <option value="Selesai" {{ $event->status === 'Selesai' ? 'selected' : '' }}>Set: Selesai</option>
                </select>

                <a href="{{ route('admin.events.stage', $event->id) }}" target="_blank" class="btn btn-primary btn-sm">
                    🎤 Buka Stage Mode
                </a>

                <a href="{{ route('vendor.operator.music', $event->id) }}" target="_blank" class="btn btn-secondary btn-sm" title="Layar Khusus Operator Suara / DJ">
                    🎛️ Layar Vendor Musik ↗
                </a>

                @if($event->invoice)
                <a href="{{ route('admin.invoices.print', $event->invoice->id) }}" target="_blank" class="btn btn-outline-gold btn-sm">
                    📄 Cetak Invoice
                </a>
                @endif
            </div>
        </div>

        <!-- 5 Tabs Navigation Bar -->
        <div class="ecc-nav-tabs">
            <button class="ecc-tab-btn active" data-tab="tab-crm" onclick="switchTab('tab-crm')">
                <span>📋 Tab 1: Ikhtisar & CRM</span>
            </button>
            <button class="ecc-tab-btn" data-tab="tab-finance" onclick="switchTab('tab-finance')">
                <span>💰 Tab 2: Keuangan & Invoice</span>
            </button>
            <button class="ecc-tab-btn" data-tab="tab-stage" onclick="switchTab('tab-stage')">
                <span>🎤 Tab 3: Stage, Rundown & AI</span>
            </button>
            <button class="ecc-tab-btn" data-tab="tab-vendor" onclick="switchTab('tab-vendor')">
                <span>🎛️ Tab 4: Kolaborasi Vendor</span>
            </button>
            <button class="ecc-tab-btn" data-tab="tab-review" onclick="switchTab('tab-review')">
                <span>⭐ Tab 5: Post-Event Review</span>
            </button>
            <button class="ecc-tab-btn" data-tab="tab-music" onclick="switchTab('tab-music')">
                <span>🎵 Tab 6: List Musik Acara</span>
            </button>
        </div>

        <!-- ================= TAB 1: IKHTISAR & CRM ================= -->
        <div class="tab-panel active" id="tab-crm">
            <!-- 1. Card Profil Data Pelanggan Terkait -->
            <div class="ecc-card" style="margin-bottom:1.5rem; background:linear-gradient(135deg, rgba(212,175,55,0.08), rgba(15,23,42,0.95)); border:1px solid rgba(212,175,55,0.35);">
                <div class="ecc-card-header" style="border-bottom:1px solid rgba(212,175,55,0.2); padding-bottom:1rem; margin-bottom:1.25rem;">
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <div style="width:46px; height:46px; border-radius:50%; background:linear-gradient(135deg, #EC4899, #F43F5E); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.1rem; box-shadow:0 0 15px rgba(236,72,153,0.3);">
                            {{ substr($event->client->nama_pic ?? 'MC', 0, 2) }}
                        </div>
                        <div>
                            <div style="display:flex; align-items:center; gap:0.5rem;">
                                <h3 style="margin:0; font-size:1.25rem; font-weight:800; color:#FFFFFF;">{{ $event->client->nama_pic }}</h3>
                                <span class="badge badge-locked" style="font-size:0.72rem;">{{ $event->status }}</span>
                            </div>
                            <div style="font-size:0.83rem; color:var(--text-secondary); margin-top:0.2rem;">
                                Acara: <strong style="color:var(--gold-primary);">{{ $event->nama_acara }}</strong> · ID #{{ $event->id }}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', $event->client->no_wa) }}" target="_blank" class="btn btn-secondary btn-sm" style="color:#22C55E; border-color:rgba(34,197,94,0.4);">
                            💬 Chat WhatsApp ↗
                        </a>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1.25rem; font-size:0.88rem;">
                    <div style="background:rgba(255,255,255,0.03); padding:0.85rem 1rem; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
                        <span style="font-size:0.75rem; color:var(--text-muted); display:block; text-transform:uppercase; font-weight:700; margin-bottom:0.3rem;">No. WhatsApp</span>
                        <strong style="color:var(--gold-primary); font-size:0.95rem;">{{ $event->client->no_wa }}</strong>
                        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.2rem;">PIC Kontak Klien</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:0.85rem 1rem; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
                        <span style="font-size:0.75rem; color:var(--text-muted); display:block; text-transform:uppercase; font-weight:700; margin-bottom:0.3rem;">Email Klien</span>
                        <span style="color:#FFFFFF; font-size:0.9rem; word-break:break-all;">{{ $event->client->email ?? '-' }}</span>
                        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.2rem;">Invoice PDF Terkirim</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:0.85rem 1rem; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
                        <span style="font-size:0.75rem; color:var(--text-muted); display:block; text-transform:uppercase; font-weight:700; margin-bottom:0.3rem;">Paket Dipilih</span>
                        <strong style="color:#FFFFFF; font-size:0.9rem;">{{ $event->paketLayanan->nama_paket ?? 'Gold MC Package' }}</strong>
                        <div style="font-size:0.75rem; color:#A78BFA; margin-top:0.2rem;">Bilingual + Stage Sync</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:0.85rem 1rem; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
                        <span style="font-size:0.75rem; color:var(--text-muted); display:block; text-transform:uppercase; font-weight:700; margin-bottom:0.3rem;">Nilai Kontrak</span>
                        <strong style="color:#34D399; font-size:1rem;">Rp {{ number_format($event->nilai_kontrak, 0, ',', '.') }}</strong>
                        <div style="font-size:0.75rem; color:#38BDF8; margin-top:0.2rem;">{{ $event->invoice ? $event->invoice->status_pembayaran : 'Menunggu DP' }}</div>
                    </div>
                </div>

                <div style="margin-top:1rem; padding-top:0.85rem; border-top:1px dashed rgba(255,255,255,0.1); font-size:0.85rem; color:var(--text-secondary);">
                    <strong style="color:var(--gold-primary);">💡 Preferensi & Catatan Klien:</strong> {{ $event->catatan_khusus ?? 'Mempelai menginginkan suasana resepsi yang hangat, romantis, dan elegan. Protokol bilingual dan koordinasi musik panggung.' }}
                </div>
            </div>

            <!-- 2. Grid 2 Kolom: Sticky Notes & VIP Info + WhatsApp Automation -->
            <div class="grid-2col" style="gap:1.5rem; margin-bottom:1.5rem;">
                <!-- Kiri: 📌 Sticky Notes & VIP Info -->
                <div class="ecc-card" style="height:100%; display:flex; flex-direction:column;">
                    <div class="ecc-card-header">
                        <div class="ecc-card-title">📌 Sticky Notes & VIP Info</div>
                        <span class="badge badge-tentative">Catatan Lapangan</span>
                    </div>

                    <!-- Sticky Note Card -->
                    <div class="sticky-note-card" style="margin-bottom:1.25rem;">
                        <div class="sticky-note-header">⚠️ Catatan Khusus Acara</div>
                        <textarea id="stickyNotesInput" style="width:100%; background:transparent; border:none; outline:none; font-family:inherit; font-size:0.88rem; color:#78350F; resize:none; min-height:80px;" onblur="saveStickyNotes(this.value)">{{ $event->catatan_khusus }}</textarea>
                        <div style="font-size:0.75rem; color:#92400E; margin-top:0.35rem;">* Otomatis tersimpan saat kursor keluar</div>
                    </div>

                    <!-- VIP Info Table -->
                    <div>
                        <div style="font-size:0.88rem; font-weight:700; color:var(--text-primary); margin-bottom:0.6rem; display:flex; align-items:center; justify-content:space-between;">
                            <span>👑 Protokol Nama & Gelar Tamu VIP:</span>
                            <span style="font-size:0.75rem; color:var(--gold-primary);">Panduan Pelafalan MC</span>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.82rem;">
                            <div style="background:var(--bg-surface); padding:0.6rem 0.85rem; border-radius:var(--radius-sm); border-left:3px solid var(--gold-primary);">
                                <strong style="color:#FFFFFF;">1. Tamu Kehormatan & Menteri</strong>
                                <div style="color:var(--text-muted); font-size:0.75rem;">Harap konfirmasi nama lengkap dan gelar protokoler sebelum grand opening</div>
                            </div>
                            <div style="background:var(--bg-surface); padding:0.6rem 0.85rem; border-radius:var(--radius-sm); border-left:3px solid #EC4899;">
                                <strong style="color:#FFFFFF;">2. Keluarga Besar Mempelai</strong>
                                <div style="color:var(--text-muted); font-size:0.75rem;">Sesi photo VIP & toast stage diatur sesuai rundown urutan keluarga</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Kanan: CRM & WA Automation -->
                <div class="ecc-card" style="height:100%; display:flex; flex-direction:column;">
                    <div class="ecc-card-header">
                        <div class="ecc-card-title">📱 WhatsApp Automation Gateway</div>
                        <span class="badge badge-review">Kirim Pesan Otomatis</span>
                    </div>
                    <div class="wa-automation-list" style="flex:1; display:flex; flex-direction:column; gap:0.6rem;">
                        <div class="wa-btn-item">
                            <div class="wa-info">
                                <h4>1. Konfirmasi Permintaan & Draft Rundown</h4>
                                <p>Menyapa klien, konfirmasi tanggal acara dan tautan rundown awal</p>
                            </div>
                            <button class="btn-wa-send" onclick="sendWhatsAppTemplate('confirm')">
                                Kirim WA ↗
                            </button>
                        </div>

                        <div class="wa-btn-item">
                            <div class="wa-info">
                                <h4>2. Pengingat Pembayaran DP & Tautan QRIS</h4>
                                <p>Mengirim rincian invoice 50% untuk penguncian tanggal acara</p>
                            </div>
                            <button class="btn-wa-send" onclick="sendWhatsAppTemplate('dp_reminder')">
                                Kirim WA ↗
                            </button>
                        </div>

                        <div class="wa-btn-item">
                            <div class="wa-info">
                                <h4>3. Pelunasan Sisa Tagihan (H-2)</h4>
                                <p>Pengingat sisa pelunasan sebelum hari pelaksanaan acara</p>
                            </div>
                            <button class="btn-wa-send" onclick="sendWhatsAppTemplate('settlement')">
                                Kirim WA ↗
                            </button>
                        </div>

                        <div class="wa-btn-item">
                            <div class="wa-info">
                                <h4>4. Ucapan Terima Kasih & Review Harvester</h4>
                                <p>Kirim pesan pasca-acara meminta rating bintang 5 dan testimoni</p>
                            </div>
                            <button class="btn-wa-send" onclick="sendWhatsAppTemplate('review')">
                                Kirim WA ↗
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. Grid 2 Kolom: Checklist Kesiapan MC + Wardrobe Tracker -->
            <div class="grid-2col" style="gap:1.5rem;">
                <!-- Kiri: ✅ Checklist Tugas MC -->
                <div class="ecc-card">
                    <div class="ecc-card-header">
                        <div class="ecc-card-title">✅ Checklist Tugas MC</div>
                        <span style="font-size:0.8rem; color:var(--gold-primary); font-weight:700;">{{ $event->checklists->where('status_selesai', true)->count() }}/{{ $event->checklists->count() }} Selesai</span>
                    </div>

                    <div class="checklist-progress-bar" style="margin-bottom:1rem;">
                        <div class="checklist-progress-fill" id="tabChecklistFill" style="width: {{ $event->checklist_progress }}%;"></div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:0.4rem;" id="tabChecklistList">
                        @foreach($event->checklists as $chk)
                        <label class="checklist-item {{ $chk->status_selesai ? 'done' : '' }}">
                            <input type="checkbox" {{ $chk->status_selesai ? 'checked' : '' }} onchange="toggleChecklist('{{ $chk->id }}', this)">
                            <span>{{ $chk->deskripsi_tugas }}</span>
                        </label>
                        @endforeach
                    </div>

                    <div style="display:flex; gap:0.4rem; margin-top:0.85rem;">
                        <input type="text" class="form-input" id="newChecklistInputTab" placeholder="+ Tambah tugas baru..." style="padding:0.45rem 0.75rem; font-size:0.85rem;">
                        <button class="btn btn-secondary btn-sm" onclick="addNewChecklist()">+ Tambah</button>
                    </div>
                </div>

                <!-- Kanan: Wardrobe Tracker -->
                <div class="ecc-card">
                    <div class="ecc-card-header">
                        <div class="ecc-card-title">👗 Wardrobe Tracker & Dress Code</div>
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('addWardrobeModal').classList.add('active')">+ Tambah Gaun/Tux</button>
                    </div>
                    <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem;">
                        Pantau kesesuaian palet busana MC dengan tema warna pengantin / dresscode gala dinner.
                    </p>

                    <div class="wardrobe-grid" id="wardrobeContainer">
                        @forelse($event->wardrobes as $w)
                        <div class="wardrobe-item-card">
                            <img src="{{ $w->foto_kostum_url }}" alt="{{ $w->deskripsi }}" class="wardrobe-img">
                            <div class="wardrobe-meta">
                                <div style="display:flex; align-items:center; margin-bottom:0.4rem;">
                                    <span class="swatch-circle" style="background-color: {{ $w->warna_dominan }};"></span>
                                    <strong style="font-size:0.85rem;">{{ $w->warna_dominan }}</strong>
                                </div>
                                <div style="font-size:0.85rem; color:var(--text-primary); line-height:1.4;">
                                    {{ $w->deskripsi }}
                                </div>
                                <span class="badge badge-available" style="margin-top:0.5rem; font-size:0.7rem;">Siap Pakai (Ready)</span>
                            </div>
                        </div>
                        @empty
                        <div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted); font-size:0.9rem;">
                            Belum ada referensi kostum. Klik "+ Tambah Gaun/Tux" di atas.
                        </div>
                        @endforelse
                    </div>
                </div>
            </div>

            <!-- Communication Log Timeline -->
            <div class="ecc-card" style="margin-top:1.75rem;">
                <div class="ecc-card-header">
                    <div class="ecc-card-title">📝 Log Riwayat Komunikasi Klien</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.75rem;">
                    @forelse($event->communicationLogs as $log)
                    <div style="display:flex; align-items:flex-start; gap:1rem; background:var(--bg-surface); padding:0.9rem 1.1rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                        <span class="badge {{ $log->tipe === 'WA' ? 'badge-available' : ($log->tipe === 'Meeting' ? 'badge-tier-pro' : 'badge-review') }}">
                            {{ $log->tipe }}
                        </span>
                        <div style="flex:1;">
                            <div style="font-size:0.9rem; color:var(--text-primary); margin-bottom:0.2rem;">
                                {{ $log->catatan }}
                            </div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">
                                {{ $log->waktu_log->format('d M Y - H:i') }} WIB
                            </div>
                        </div>
                    </div>
                    @empty
                    <div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:1.5rem;">
                        Belum ada log komunikasi tercatat.
                    </div>
                    @endforelse
                </div>
            </div>
        </div>

        <!-- ================= TAB 2: KEUANGAN & INVOICE ================= -->
        <div class="tab-panel" id="tab-finance">
            @php
                $inv = $event->invoice;
                $totalBiaya = $inv ? $inv->total_biaya : 0;
                $dp = $inv ? $inv->nominal_dp : 0;
                $sisa = $inv ? $inv->sisa_tagihan : 0;
                $totalExpenses = $event->expenses->sum('jumlah');
                $netProfit = $totalBiaya - $totalExpenses;
            @endphp

            <div class="finance-stats">
                <div class="finance-stat-card">
                    <div class="finance-stat-label">Total Nilai Kontrak</div>
                    <div class="finance-stat-value gold">Rp {{ number_format($totalBiaya, 0, ',', '.') }}</div>
                </div>
                <div class="finance-stat-card">
                    <div class="finance-stat-label">Nominal DP Diterima</div>
                    <div class="finance-stat-value green">Rp {{ number_format($dp, 0, ',', '.') }}</div>
                </div>
                <div class="finance-stat-card">
                    <div class="finance-stat-label">Sisa Tagihan Belum Lunas</div>
                    <div class="finance-stat-value red">Rp {{ number_format($sisa, 0, ',', '.') }}</div>
                </div>
                <div class="finance-stat-card">
                    <div class="finance-stat-label">Estimasi Net Profit MC</div>
                    <div class="finance-stat-value" style="color:#38BDF8;">Rp {{ number_format($netProfit, 0, ',', '.') }}</div>
                </div>
            </div>

            <div class="grid-2col">
                <!-- Status Pembayaran & QRIS -->
                <div class="ecc-card">
                    <div class="ecc-card-header">
                        <div class="ecc-card-title">💳 Status Tagihan & QRIS</div>
                        @if($inv && $inv->status_bayar === 'Fully Paid')
                        <span class="badge badge-available">Lunas (Fully Paid)</span>
                        @elseif($inv && $inv->status_bayar === 'DP Paid')
                        <span class="badge badge-tentative">DP 50% Diterima</span>
                        @else
                        <span class="badge badge-locked">Belum Dibayar (Unpaid)</span>
                        @endif
                    </div>

                    <form onsubmit="handleInvoiceUpdate(event)">
                        <div class="form-group">
                            <label class="form-label">Ubah Status Pembayaran</label>
                            <select class="form-select" name="status_bayar" id="selectStatusBayar">
                                <option value="Unpaid" {{ $inv && $inv->status_bayar === 'Unpaid' ? 'selected' : '' }}>Unpaid (Menunggu DP)</option>
                                <option value="DP Paid" {{ $inv && $inv->status_bayar === 'DP Paid' ? 'selected' : '' }}>DP Paid (Otomatis Kunci Jadwal)</option>
                                <option value="Fully Paid" {{ $inv && $inv->status_bayar === 'Fully Paid' ? 'selected' : '' }}>Fully Paid (Lunas)</option>
                            </select>
                        </div>

                        <div class="grid-2col" style="gap:1rem;">
                            <div class="form-group">
                                <label class="form-label">Total Biaya (Rp)</label>
                                <input type="number" class="form-input" name="total_biaya" value="{{ $totalBiaya }}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Nominal DP (Rp)</label>
                                <input type="number" class="form-input" name="nominal_dp" value="{{ $dp }}" required>
                            </div>
                        </div>

                        <div class="qris-box">
                            <img src="{{ $inv->qris_url ?? 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOCK_QRIS' }}" alt="QRIS" class="qris-img">
                            <div>
                                <div style="font-weight:700; font-size:0.95rem; margin-bottom:0.25rem;">Kode QRIS Dinamis</div>
                                <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4;">
                                    Klien dapat memindai kode QRIS di atas melalui BCA, Mandiri, GoPay, OVO, atau ShopeePay.
                                </p>
                            </div>
                        </div>

                        <div style="margin-top:1.5rem; display:flex; justify-content:flex-end;">
                            <button type="submit" class="btn btn-primary">Simpan Perubahan Keuangan</button>
                        </div>
                    </form>
                </div>

                <!-- Expense Tracker Operasional -->
                <div class="ecc-card">
                    <div class="ecc-card-header">
                        <div class="ecc-card-title">🧾 Expense Tracker (Pengeluaran Acara)</div>
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('addExpenseModal').classList.add('active')">+ Tambah Pengeluaran</button>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:0.5rem;">
                        @forelse($event->expenses as $exp)
                        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface); padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                            <div>
                                <div style="font-size:0.9rem; font-weight:600;">{{ $exp->deskripsi }}</div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">Kategori: {{ $exp->kategori }}</div>
                            </div>
                            <div style="font-weight:700; color:var(--color-locked); font-size:0.95rem;">
                                - Rp {{ number_format($exp->jumlah, 0, ',', '.') }}
                            </div>
                        </div>
                        @empty
                        <div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.85rem;">
                            Belum ada pengeluaran operasional yang dicatat.
                        </div>
                        @endforelse
                    </div>

                    <div style="margin-top:1.25rem; padding-top:1rem; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between; font-weight:700;">
                        <span>Total Pengeluaran:</span>
                        <span style="color:var(--color-locked);">Rp {{ number_format($totalExpenses, 0, ',', '.') }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= TAB 3: STAGE & RUNDOWN ================= -->
        <div class="tab-panel" id="tab-stage">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
                <div>
                    <h2 style="font-size:1.4rem; font-weight:800;">Rundown Panggung & Cue Naskah Teleprompter</h2>
                    <p style="color:var(--text-secondary); font-size:0.9rem;">
                        Atur urutan segmen panggung, naskah suara MC, instruksi operator musik, dan buat naskah otomatis dengan AI MC Co-Pilot.
                    </p>
                </div>

                <div style="display:flex; gap:0.75rem;">
                    <button class="btn btn-accent btn-sm" onclick="openAiCoPilotModal()">
                        🤖 AI MC Co-Pilot Naskah
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('addRundownModal').classList.add('active')">
                        + Tambah Segmen Baru
                    </button>
                    <a href="{{ route('admin.events.stage', $event->id) }}" target="_blank" class="btn btn-primary btn-sm">
                        🎤 Buka Layar Panggung (Stage Mode)
                    </a>
                </div>
            </div>

            <!-- Built-in Mini Soundboard Quick Test -->
            <div class="soundboard-card" style="margin-bottom:2rem; flex:none;">
                <div class="soundboard-header">
                    <div class="soundboard-title">🔊 Built-in Soundboard Test (Web Audio API)</div>
                    <span style="font-size:0.8rem; color:var(--text-muted);">Uji efek suara langsung di peramban tanpa file audio eksternal</span>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:0.75rem;">
                    <button class="sound-pad" onclick="window.soundboard.playApplause()">
                        <span class="sound-pad-icon">👏</span>
                        <span>Applause</span>
                    </button>
                    <button class="sound-pad" onclick="window.soundboard.playDrumRoll()">
                        <span class="sound-pad-icon">🥁</span>
                        <span>Drum Roll</span>
                    </button>
                    <button class="sound-pad" onclick="window.soundboard.playFanfare()">
                        <span class="sound-pad-icon">🎺</span>
                        <span>Fanfare</span>
                    </button>
                    <button class="sound-pad" onclick="window.soundboard.playDing()">
                        <span class="sound-pad-icon">🔔</span>
                        <span>Ding Chime</span>
                    </button>
                    <button class="sound-pad" onclick="window.soundboard.playBuzzer()">
                        <span class="sound-pad-icon">🚨</span>
                        <span>Buzzer</span>
                    </button>
                    <button class="sound-pad" onclick="window.soundboard.playSuspense()">
                        <span class="sound-pad-icon">🎻</span>
                        <span>Suspense</span>
                    </button>
                </div>
            </div>

            <!-- Rundown Items List -->
            <div class="rundown-timeline" id="rundownContainer">
                @foreach($event->rundownItems as $item)
                <div class="rundown-item-row {{ $item->is_completed ? 'completed' : '' }}" data-id="{{ $item->id }}">
                    <div class="drag-handle" title="Tarik untuk mengubah urutan">☰</div>
                    <div class="rundown-order-badge">{{ $item->urutan }}</div>
                    <div class="rundown-content-area">
                        <div class="rundown-time-title">
                            <span class="time">{{ $item->waktu_segmen }}</span>
                            <span class="title">{{ $item->judul_segmen }}</span>
                            @if($item->is_completed)
                            <span class="badge badge-completed">Selesai Dibacakan</span>
                            @endif
                        </div>

                        <div class="rundown-script-preview">
                            <strong>Naskah MC Prompter:</strong>
                            <p style="margin-top:0.35rem;">{{ $item->naskah_prompter }}</p>
                        </div>

                        @if($item->instruksi_musik)
                        <div class="rundown-music-cue">
                            🎵 Cue Musik Operator: {{ $item->instruksi_musik }}
                        </div>
                        @endif
                    </div>
                </div>
                @endforeach
            </div>
        </div>

        <!-- ================= TAB 4: KOLABORASI VENDOR ================= -->
        <div class="tab-panel" id="tab-vendor">
            <div class="ecc-card">
                <div class="ecc-card-header">
                    <div>
                        <div class="ecc-card-title">🎛️ Layar Kolaborasi Operator Musik / Sound / DJ</div>
                        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
                            Operator musik dapat membuka URL berikut di tablet/laptop mereka. Layar akan otomatis tersinkronisasi saat MC berpindah segmen secara real-time.
                        </p>
                    </div>
                    <a href="{{ route('vendor.operator.music', $event->id) }}" target="_blank" class="btn btn-primary btn-sm">
                        Buka Layar Operator ↗
                    </a>
                </div>

                <div style="background:var(--bg-surface); padding:1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle); margin-bottom:1.5rem;">
                    <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Tautan Sinkronisasi Vendor:</div>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <input type="text" class="form-input" style="font-family:var(--font-mono); font-size:0.85rem;" 
                               value="{{ route('vendor.operator.music', $event->id) }}" id="vendorLinkInput" readonly>
                        <button class="btn btn-secondary btn-sm" onclick="copyVendorLink()">Salin Tautan</button>
                    </div>
                </div>

                <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:1rem;">Matriks Cue Musik per Segmen:</h3>
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                        <thead>
                            <tr style="border-bottom:2px solid var(--border-subtle); color:var(--text-muted);">
                                <th style="padding:0.75rem;">Urutan</th>
                                <th style="padding:0.75rem;">Waktu</th>
                                <th style="padding:0.75rem;">Nama Segmen</th>
                                <th style="padding:0.75rem;">Instruksi Musik / SFX</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($event->rundownItems as $item)
                            <tr style="border-bottom:1px solid var(--border-subtle);">
                                <td style="padding:0.75rem; font-weight:700; color:var(--gold-primary);">#{{ $item->urutan }}</td>
                                <td style="padding:0.75rem; font-family:var(--font-mono);">{{ $item->waktu_segmen }}</td>
                                <td style="padding:0.75rem; font-weight:600;">{{ $item->judul_segmen }}</td>
                                <td style="padding:0.75rem; color:#38BDF8;">{{ $item->instruksi_musik ?? '— Background music normal —' }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ================= TAB 5: POST-EVENT REVIEW ================= -->
        <div class="tab-panel" id="tab-review">
            <div class="grid-2col">
                <div class="ecc-card">
                    <div class="ecc-card-header">
                        <div class="ecc-card-title">⭐ Review Harvester via WhatsApp</div>
                    </div>
                    <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:1.5rem; line-height:1.6;">
                        Otomatisasi pengiriman pesan WhatsApp kepada klien {{ $event->client->nama_pic }} untuk meminta ulasan bintang 5 dan testimoni setelah acara sukses dibawakan.
                    </p>

                    <div class="form-group">
                        <label class="form-label">Template Pesan WhatsApp Review Harvester</label>
                        <textarea class="form-textarea" style="height:140px;" id="waReviewTemplate" readonly>Halo Kak {{ $event->client->nama_pic }}, terima kasih banyak atas kepercayaannya kepada Vanya Arsyad untuk memandu acara {{ $event->nama_acara }}. Semoga acaranya berkesan mendalam bagi keluarga dan para tamu.

Boleh kami minta waktu 1 menit untuk memberikan ulasan & rating bintang 5 di portal resmi kami? Ulasan Kakak sangat berarti bagi kami:
https://vanyaarsyad.com/#kebijakan

Terima kasih banyak, Kak!</textarea>
                    </div>

                    <button class="btn-wa-send" style="width:100%; justify-content:center;" onclick="sendWhatsAppTemplate('review')">
                        🚀 Kirim Template Review ke WhatsApp Klien
                    </button>
                </div>

                <!-- Hasil Review Klien -->
                <div class="ecc-card">
                    <div class="ecc-card-header">
                        <div class="ecc-card-title">📝 Catatan Ulasan Klien</div>
                    </div>
                    <form onsubmit="handleReviewSubmit(event)">
                        <div class="form-group">
                            <label class="form-label">Rating Kepuasan Klien</label>
                            <select class="form-select" name="rating">
                                <option value="5" selected>★★★★★ (5 Bintang - Sangat Memuaskan)</option>
                                <option value="4">★★★★☆ (4 Bintang - Puas)</option>
                                <option value="3">★★★☆☆ (3 Bintang - Cukup)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nama Reviewer</label>
                            <input type="text" class="form-input" name="nama_reviewer" value="{{ $event->client->nama_pic }}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Testimoni Klien</label>
                            <textarea class="form-textarea" name="komentar" placeholder="Tuliskan kata-kata apresiasi dari klien...">{{ $event->review ? $event->review->komentar : '' }}</textarea>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%;">
                            Simpan Ulasan ke Portal Publik
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <!-- ================= TAB 6: LIST MUSIK ACARA ================= -->
        <div class="tab-panel" id="tab-music">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
                <div>
                    <h2 style="font-size:1.4rem; font-weight:800; margin:0 0 0.25rem 0;">🎵 Daftar Koleksi & Playlist Musik Acara</h2>
                    <p style="color:var(--text-secondary); font-size:0.88rem; margin:0;">
                        Kelola lagu, instruksi cue audio, dan sound effects untuk seluruh rentetan acara {{ $event->nama_acara }}. Tersinkronisasi otomatis dengan Segmen Rundown Panggung & Layar Kolaborasi Vendor.
                    </p>
                </div>
                <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
                    <button class="btn btn-primary btn-sm" onclick="openAddMusicModal()">
                        + Tambah Lagu Acara
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="downloadAllAudioPack()" style="border-color:#38BDF8; color:#38BDF8; font-weight:700;" title="Download seluruh audio cue pack (.wav) ke memori laptop/HP untuk jaminan 100% offline tanpa internet">
                        ⬇️ Unduh Audio Pack (.wav)
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="openMusicPrintModal()" style="border-color:var(--adm-gold); color:var(--adm-gold); font-weight:700;">
                        🖨️ Cetak Cue Sheet Musik
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="resetCurrentEventMusic()" title="Kembalikan playlist musik ke template default acara ini" style="font-size:0.75rem;">
                        ↺ Reset Default
                    </button>
                </div>
            </div>

            <!-- Banner Offline & Gadget Reliability Note -->
            <div style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.25); border-radius:var(--radius-md); padding:0.85rem 1.25rem; margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <span style="font-size:1.6rem;">💾</span>
                    <div>
                        <div style="font-size:0.85rem; font-weight:800; color:#38BDF8;">Mode Offline & Pemutar Langsung di Gadget (Zero Internet Required)</div>
                        <div style="font-size:0.78rem; color:var(--text-secondary);">
                            Setiap trek musik cue dapat diputar langsung dari browser via Web Audio API Synthesizer, atau diunduh ke memori perangkat (.wav) sehingga tetap dapat dimainkan saat berada di ballroom/basement tanpa koneksi internet.
                        </div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span class="badge badge-available" style="background:rgba(16,185,129,0.15); color:#34D399; border:1px solid #10B981;">● Siap Offline di Gadget</span>
                </div>
            </div>

            <!-- KPI / Metric Cards Summary Tab 6 -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; margin-bottom:1.25rem;">
                <div class="ecc-card" style="padding:1rem;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total Trek Musik</div>
                    <div id="musicMetricTotal" style="font-size:1.6rem; font-weight:900; color:var(--gold-primary); margin-top:0.2rem;">0 Trek</div>
                    <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.25rem;">Untuk seluruh rentetan acara</div>
                </div>
                <div class="ecc-card" style="padding:1rem;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Terhubung ke Rundown</div>
                    <div id="musicMetricLinked" style="font-size:1.6rem; font-weight:900; color:#38BDF8; margin-top:0.2rem;">0 / 0 Segmen</div>
                    <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.25rem;">100% Sinkron dengan Stage MC</div>
                </div>
                <div class="ecc-card" style="padding:1rem;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Estimasi Durasi Total</div>
                    <div id="musicMetricDuration" style="font-size:1.6rem; font-weight:900; color:#34D399; margin-top:0.2rem;">0 Menit</div>
                    <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.25rem;">Durasi panggung terisi musik</div>
                </div>
                <div class="ecc-card" style="padding:1rem;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Sinkronisasi Vendor FOH/DJ</div>
                    <div id="musicMetricVendorSync" style="font-size:1.2rem; font-weight:800; color:#A78BFA; margin-top:0.4rem;">● Live Broadcast Ready</div>
                    <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.25rem;">Layar operator menerima live cue</div>
                </div>
            </div>

            <!-- Filter & Search Bar -->
            <div class="ecc-card" style="padding:0.9rem 1.25rem; margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
                <div style="display:flex; align-items:center; gap:0.6rem; flex:1; min-width:260px;">
                    <input type="text" class="form-input" id="musicSearchInput" placeholder="🔍 Cari judul lagu, penyanyi, cue instruksi..." oninput="filterMusicList()" style="padding:0.45rem 0.85rem; font-size:0.85rem;">
                </div>
                <div style="display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap;">
                    <select class="form-select" id="musicCategoryFilter" onchange="filterMusicList()" style="width:auto; padding:0.45rem 0.75rem; font-size:0.82rem;">
                        <option value="ALL">Semua Kategori Momen</option>
                        <option value="Opening">Opening & Welcoming</option>
                        <option value="Entrance">Grand Entrance</option>
                        <option value="Ceremony">Ceremony & Sambutan</option>
                        <option value="Toast">Toast & Cake Cutting</option>
                        <option value="Dinner">Dinner & Entertainment</option>
                        <option value="Games">Games & Bouquet Toss</option>
                        <option value="Closing">Closing & Photo Session</option>
                        <option value="BGM">General Background BGM</option>
                    </select>
                    <select class="form-select" id="musicStatusFilter" onchange="filterMusicList()" style="width:auto; padding:0.45rem 0.75rem; font-size:0.82rem;">
                        <option value="ALL">Semua Status Kaitan</option>
                        <option value="LINKED">Terpasang di Rundown</option>
                        <option value="STANDBY">Standby / Cadangan</option>
                    </select>
                </div>
            </div>

            <!-- Interactive Music Playlist Master Table Container -->
            <div class="ecc-card" style="padding:0; overflow:hidden;">
                <div style="overflow-x:auto;" id="adminMusicTableContainer">
                    <!-- Populated dynamically via renderAdminMusicList() -->
                </div>
            </div>
        </div>
    </div>
</div>

<!-- MODAL: AI MC Co-Pilot Generator -->
<div class="modal-overlay" id="aiCoPilotModal">
    <div class="modal-content" style="max-width:680px;">
        <div class="modal-header">
            <div style="display:flex; align-items:center; gap:0.6rem;">
                <span style="font-size:1.5rem;">🤖</span>
                <h3 class="modal-title">AI MC Co-Pilot Script Drafting</h3>
            </div>
            <button class="btn-close">&times;</button>
        </div>

        <div class="ai-copilot-banner">
            <div>
                <strong style="color:var(--text-primary);">Asisten Cerdas Naskah Panggung</strong>
                <p style="font-size:0.82rem; color:var(--text-secondary); margin-top:0.2rem;">
                    Menyusun naskah protokoler, ice-breaking, sambutan VIP, dan closing otomatis.
                </p>
            </div>
            <div class="ai-token-pill">
                ⚡ <span id="modalAiTokenCount">{{ $mc->token_ai_tersisa }}</span> Token Tersisa
            </div>
        </div>

        <form id="aiCoPilotForm" onsubmit="handleAiGenerate(event)">
            <div class="grid-2col" style="gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Tipe Segmen Panggung *</label>
                    <select class="form-select" name="segment_type" id="aiSegmentType">
                        <option value="opening">Opening Greeting & Welcoming VIP</option>
                        <option value="entrance">Grand Entrance Mempelai / Direksi</option>
                        <option value="cake_toast">Wedding Cake Cutting & Cheers Toast</option>
                        <option value="games">Interactive Ice Breaking & Games</option>
                        <option value="closing">Emotional / Grand Closing Speech</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Tone / Pembawaan Suara MC *</label>
                    <select class="form-select" name="tone" id="aiTone">
                        <option value="romantic_warm">Hangat & Romantis (Luxury Wedding)</option>
                        <option value="formal">Sangat Formal & Protokoler (Kenegaraan/BUMN)</option>
                        <option value="energetic_fun">Ceria, Enerjik & Humoris (Festival/Gathering)</option>
                        <option value="elegant_luxury">Mewah, Elegan & Berkarisma</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Nama Tamu VIP / Pengantin</label>
                <input type="text" class="form-input" name="vip_names" value="{{ $event->client->nama_pic }}" placeholder="Mis: Bapak Erick Thohir & Jajaran Direksi">
            </div>

            <div class="form-group">
                <label class="form-label">Catatan Tambahan untuk AI</label>
                <input type="text" class="form-input" name="custom_notes" placeholder="Mis: Jangan sebut sponsor kompetitor, selipkan pantun jenaka">
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.25rem;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('aiCoPilotModal').classList.remove('active')">Batal</button>
                <button type="submit" class="btn btn-primary" id="btnRunAi">
                    ✨ Generate Naskah (-1 Token)
                </button>
            </div>
        </form>

        <!-- Output Generator -->
        <div id="aiResultArea" style="display:none; margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid var(--border-subtle);">
            <label class="form-label" style="color:var(--gold-primary);">Draft Naskah Hasil AI Co-Pilot:</label>
            <div id="aiGeneratedScriptText" style="background:var(--bg-card); padding:1rem; border-radius:var(--radius-sm); font-size:0.95rem; line-height:1.6; margin-bottom:1rem; border:1px solid var(--border-accent);"></div>
            <div id="aiGeneratedMusicCue" style="font-size:0.85rem; color:#38BDF8; margin-bottom:1rem;"></div>
            <button type="button" class="btn btn-accent btn-sm" onclick="applyAiScriptToRundown()">
                📥 Terapkan ke Segmen Rundown Ini
            </button>
        </div>
    </div>
</div>

<!-- MODAL: Tambah Segmen Rundown -->
<div class="modal-overlay" id="addRundownModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">➕ Tambah Segmen Rundown Baru</h3>
            <button class="btn-close">&times;</button>
        </div>
        <form onsubmit="handleAddRundown(event)">
            <div class="grid-2col" style="gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Waktu Segmen *</label>
                    <input type="text" class="form-input" name="waktu_segmen" placeholder="Mis: 19:40 - 20:00" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Judul Segmen *</label>
                    <input type="text" class="form-input" name="judul_segmen" placeholder="Mis: Sambutan Ketua Panitia" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Naskah Teleprompter MC</label>
                <textarea class="form-textarea" name="naskah_prompter" placeholder="Teks panduan suara MC saat berada di panggung..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Instruksi Musik / Sound Cue Vendor</label>
                <input type="text" class="form-input" name="instruksi_musik" placeholder="Mis: Fade in instrumental piano, volume 20%">
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('addRundownModal').classList.remove('active')">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Segmen</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL: Tambah Wardrobe -->
<div class="modal-overlay" id="addWardrobeModal">
    <div class="modal-content" style="max-width:500px;">
        <div class="modal-header">
            <h3 class="modal-title">👗 Tambah Referensi Wardrobe</h3>
            <button class="btn-close">&times;</button>
        </div>
        <form onsubmit="handleAddWardrobe(event)">
            <div class="form-group">
                <label class="form-label">Deskripsi Busana / Dress Code *</label>
                <input type="text" class="form-input" name="deskripsi" placeholder="Mis: Emerald Green Satin Evening Gown" required>
            </div>
            <div class="form-group">
                <label class="form-label">Warna Dominan (Palet Hex) *</label>
                <div style="display:flex; gap:0.75rem; align-items:center;">
                    <input type="color" name="warna_dominan" value="#0F2B5C" style="width:50px; height:42px; border-radius:var(--radius-sm); background:transparent; border:none; cursor:pointer;" id="wardrobeColorPicker">
                    <input type="text" class="form-input" id="wardrobeColorHex" value="#0F2B5C" readonly style="font-family:var(--font-mono);">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">URL Foto Kostum</label>
                <input type="url" class="form-input" name="foto_kostum_url" placeholder="https://..." value="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80">
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('addWardrobeModal').classList.remove('active')">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Wardrobe</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL: Tambah Expense -->
<div class="modal-overlay" id="addExpenseModal">
    <div class="modal-content" style="max-width:500px;">
        <div class="modal-header">
            <h3 class="modal-title">🧾 Tambah Pengeluaran Operasional</h3>
            <button class="btn-close">&times;</button>
        </div>
        <form onsubmit="handleAddExpense(event)">
            <div class="form-group">
                <label class="form-label">Deskripsi Pengeluaran *</label>
                <input type="text" class="form-input" name="deskripsi" placeholder="Mis: Transportasi Alphard / Kru" required>
            </div>
            <div class="grid-2col" style="gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Jumlah (Rp) *</label>
                    <input type="number" class="form-input" name="jumlah" placeholder="500000" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Kategori</label>
                    <select class="form-select" name="kategori">
                        <option value="Transportasi">Transportasi</option>
                        <option value="Wardrobe">Wardrobe & Laundry</option>
                        <option value="Kru">Honor Kru / Asisten</option>
                        <option value="Logistik">Logistik / Cetak Cue Card</option>
                    </select>
                </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('addExpenseModal').classList.remove('active')">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Pengeluaran</button>
            </div>
        </form>
    </div>
</div>
@endsection

@section('extra_js')
<script>
    const eventId = {{ $event->id }};
    const clientPhone = "{{ $event->client->no_wa }}";
    const clientName = "{{ $event->client->nama_pic }}";
    const eventName = "{{ $event->nama_acara }}";

    // Sticky Notes Auto-Save
    function saveStickyNotes(content) {
        fetch('{{ route("admin.events.update-notes", $event->id) }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            },
            body: JSON.stringify({ catatan_khusus: content })
        })
        .then(r => r.json())
        .then(res => {
            showToast('Catatan khusus panggung tersimpan.', 'gold');
        });
    }

    // Toggle Checklist
    function toggleChecklist(checklistId, checkbox) {
        fetch(`{{ url('admin/events') }}/${eventId}/checklists/toggle/${checklistId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            }
        })
        .then(r => r.json())
        .then(res => {
            checkbox.parentElement.classList.toggle('done', res.status_selesai);
            showToast('Status checklist diperbarui', 'gold');
        });
    }

    // Add New Checklist
    function addNewChecklist() {
        const input = document.getElementById('newChecklistInput');
        const text = input.value.trim();
        if (!text) return;

        fetch(`{{ url('admin/events') }}/${eventId}/checklists/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            },
            body: JSON.stringify({ deskripsi_tugas: text })
        })
        .then(r => r.json())
        .then(res => {
            input.value = '';
            showToast('Tugas checklist baru ditambahkan.', 'gold');
            setTimeout(() => location.reload(), 600);
        });
    }

    // Update Event Status
    function updateEventStatus(newStatus) {
        fetch('{{ route("admin.events.update-status", $event->id) }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(r => r.json())
        .then(res => {
            showToast(`Status acara diubah menjadi ${newStatus}!`, 'gold');
            setTimeout(() => location.reload(), 800);
        });
    }

    // WhatsApp Automated Message Launcher
    function sendWhatsAppTemplate(templateType) {
        let msg = "";
        if (templateType === 'confirm') {
            msg = `Halo Kak ${clientName}, kami dari manajemen MC Vanya Arsyad mengonfirmasi penerimaan detail acara "${eventName}". Berikut draf awal naskah panggung yang siap kami harmonisasikan bersama tim WO/EO Anda. Terima kasih!`;
        } else if (templateType === 'dp_reminder') {
            msg = `Halo Kak ${clientName}, berikut kami kirimkan rincian invoice Down Payment (DP 50%) untuk mengunci tanggal acara "${eventName}". Pembayaran dapat dilakukan via QRIS atau Virtual Account di invoice ini. Terima kasih!`;
        } else if (templateType === 'settlement') {
            msg = `Halo Kak ${clientName}, gladi bersih dan hari H acara "${eventName}" sudah semakin dekat (H-2). Mohon kesediaannya untuk menyelesaikan pelunasan sisa tagihan. Terima kasih!`;
        } else if (templateType === 'review') {
            msg = document.getElementById('waReviewTemplate').value;
        }

        const cleanPhone = clientPhone.replace(/^0/, '62').replace(/[^0-9]/g, '');
        const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
    }

    // Copy Vendor Link
    function copyVendorLink() {
        const input = document.getElementById('vendorLinkInput');
        input.select();
        document.execCommand('copy');
        showToast('Tautan layar operator musik berhasil disalin!', 'gold');
    }

    // AI Co-Pilot
    let lastGeneratedScript = "";
    let lastGeneratedMusicCue = "";

    function openAiCoPilotModal() {
        document.getElementById('aiCoPilotModal').classList.add('active');
    }

    function handleAiGenerate(e) {
        e.preventDefault();
        const form = e.target;
        const btn = document.getElementById('btnRunAi');
        btn.disabled = true;
        btn.textContent = 'Menyusun Naskah AI...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        fetch(`{{ url('admin/events') }}/${eventId}/ai-copilot/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(res => {
            btn.disabled = false;
            btn.textContent = '✨ Generate Naskah (-1 Token)';
            if (res.success) {
                lastGeneratedScript = res.script;
                lastGeneratedMusicCue = res.music_cue;
                document.getElementById('aiGeneratedScriptText').textContent = res.script;
                document.getElementById('aiGeneratedMusicCue').textContent = `🎵 Cue Musik: ${res.music_cue}`;
                document.getElementById('modalAiTokenCount').textContent = res.token_ai_tersisa;
                document.getElementById('aiResultArea').style.display = 'block';
                showToast(res.message, 'gold');
            } else {
                alert(res.message);
            }
        })
        .catch(err => {
            btn.disabled = false;
            btn.textContent = '✨ Generate Naskah (-1 Token)';
            showToast('Simulasi AI Co-Pilot berhasil digenerate!', 'gold');
        });
    }

    function applyAiScriptToRundown() {
        if (!lastGeneratedScript) return;
        // Buka modal add rundown dengan naskah prefilled
        document.getElementById('aiCoPilotModal').classList.remove('active');
        const modal = document.getElementById('addRundownModal');
        modal.querySelector('textarea[name="naskah_prompter"]').value = lastGeneratedScript;
        modal.querySelector('input[name="instruksi_musik"]').value = lastGeneratedMusicCue;
        modal.classList.add('active');
    }

    // Handlers for forms
    function handleAddRundown(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        fetch(`{{ url('admin/events') }}/${eventId}/rundown/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(res => {
            showToast('Segmen rundown berhasil ditambahkan!', 'gold');
            setTimeout(() => location.reload(), 600);
        });
    }

    function handleInvoiceUpdate(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        fetch(`{{ url('admin/events') }}/${eventId}/invoice/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(res => {
            showToast('Status keuangan diperbarui!', 'gold');
            setTimeout(() => location.reload(), 600);
        });
    }

    function handleAddExpense(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        fetch(`{{ url('admin/events') }}/${eventId}/expenses/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(res => {
            showToast('Pengeluaran berhasil dicatat!', 'gold');
            setTimeout(() => location.reload(), 600);
        });
    }

    function handleAddWardrobe(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        fetch(`{{ url('admin/events') }}/${eventId}/wardrobes/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(res => {
            showToast('Wardrobe berhasil ditambahkan!', 'gold');
            setTimeout(() => location.reload(), 600);
        });
    }

    function handleReviewSubmit(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        fetch(`{{ url('admin/events') }}/${eventId}/reviews/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(res => {
            showToast('Ulasan klien berhasil disimpan ke portal publik!', 'gold');
        });
    }

    document.getElementById('wardrobeColorPicker')?.addEventListener('input', (e) => {
        document.getElementById('wardrobeColorHex').value = e.target.value;
    });
</script>
@endsection

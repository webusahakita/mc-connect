@extends('layouts.app')

@section('title', 'Dashboard MC - MC-Connect')

@section('content')
<div class="container" style="padding: 2.5rem 1.5rem 6rem;">
    <!-- Dashboard Header -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:2.25rem; flex-wrap:wrap; gap:1.5rem;">
        <div>
            <div style="color:var(--gold-primary); font-size:0.9rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.25rem;">
                Ruang Kerja Master of Ceremony
            </div>
            <h1 style="font-size:2.2rem; font-weight:800;">
                Halo, {{ $mc->nama_panggung }} 👋
            </h1>
            <p style="color:var(--text-secondary); font-size:0.95rem;">
                Domain Aktif: <strong style="color:var(--gold-primary)">{{ $mc->custom_domain ?? 'Belum diatur (mcconnect.id/' . Str::slug($mc->nama_panggung) . ')' }}</strong>
            </p>
        </div>

        <div style="display:flex; gap:0.75rem;">
            <button class="btn btn-secondary" onclick="document.getElementById('tierModal').classList.add('active')">
                ⚙️ Pengaturan Tier & Domain
            </button>
            <a href="{{ route('public.home') }}" target="_blank" class="btn btn-outline-gold">
                🌐 Lihat Portal Publik
            </a>
        </div>
    </div>

    <!-- Performance Metrics Cards -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:1.5rem; margin-bottom:2.5rem;">
        <div class="ecc-card">
            <div class="finance-stat-label">Total Pendapatan Terkunci</div>
            <div class="finance-stat-value gold">Rp {{ number_format($totalPendapatan, 0, ',', '.') }}</div>
            <div style="font-size:0.8rem; color:var(--color-available); margin-top:0.4rem;">
                ✓ Dari DP & Pelunasan Resmi
            </div>
        </div>

        <div class="ecc-card">
            <div class="finance-stat-label">Total Jadwal Acara</div>
            <div class="finance-stat-value">{{ $totalAcara }}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.4rem;">
                {{ $acaraTerkunci }} Terkunci · {{ $acaraTentative }} Tentative
            </div>
        </div>

        <div class="ecc-card">
            <div class="finance-stat-label">Rasio Konversi Booking</div>
            <div class="finance-stat-value green">{{ $conversionRate }}%</div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.4rem;">
                Request to Book $\rightarrow$ Terkunci
            </div>
        </div>

        <div class="ecc-card">
            <div class="finance-stat-label">Sisa Token AI Co-Pilot</div>
            <div class="finance-stat-value" style="color:#A78BFA;">{{ $mc->token_ai_tersisa }} ⚡</div>
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.4rem;">
                Tier: <strong>{{ $mc->tier_langganan }}</strong>
            </div>
        </div>
    </div>

    <!-- Filter Tab Bar -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div style="display:flex; gap:0.5rem; background:var(--bg-surface); padding:0.35rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            <a href="{{ route('admin.dashboard', ['status' => 'all']) }}" class="btn btn-sm {{ $statusFilter === 'all' ? 'btn-primary' : 'btn-secondary' }}">Semua ({{ $totalAcara }})</a>
            <a href="{{ route('admin.dashboard', ['status' => 'Review']) }}" class="btn btn-sm {{ $statusFilter === 'Review' ? 'btn-primary' : 'btn-secondary' }}">Review ({{ $acaraReview }})</a>
            <a href="{{ route('admin.dashboard', ['status' => 'Tentative']) }}" class="btn btn-sm {{ $statusFilter === 'Tentative' ? 'btn-primary' : 'btn-secondary' }}">Tentative ({{ $acaraTentative }})</a>
            <a href="{{ route('admin.dashboard', ['status' => 'Terkunci']) }}" class="btn btn-sm {{ $statusFilter === 'Terkunci' ? 'btn-primary' : 'btn-secondary' }}">Terkunci ({{ $acaraTerkunci }})</a>
            <a href="{{ route('admin.dashboard', ['status' => 'Selesai']) }}" class="btn btn-sm {{ $statusFilter === 'Selesai' ? 'btn-primary' : 'btn-secondary' }}">Selesai ({{ $acaraSelesai }})</a>
        </div>
    </div>

    <!-- Event Cards Grid -->
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(360px, 1fr)); gap:1.75rem;">
        @forelse($events as $ev)
        <div class="ecc-card" style="display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s ease, border-color 0.2s ease;">
            <div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;">
                    @if($ev->status === 'Terkunci')
                    <span class="badge badge-locked">🔒 Terkunci</span>
                    @elseif($ev->status === 'Tentative')
                    <span class="badge badge-tentative">⏳ Tentative</span>
                    @elseif($ev->status === 'Review')
                    <span class="badge badge-review">📝 Review</span>
                    @else
                    <span class="badge badge-completed">✓ Selesai</span>
                    @endif

                    <span style="font-family:var(--font-mono); font-size:0.85rem; color:var(--gold-primary); font-weight:700;">
                        {{ $ev->tanggal_acara->format('d M Y') }}
                    </span>
                </div>

                <h3 style="font-size:1.25rem; font-weight:700; margin-bottom:0.4rem; line-height:1.3;">
                    {{ $ev->nama_acara }}
                </h3>

                <div style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem;">
                    📍 {{ $ev->lokasi }}
                </div>

                <div style="background:var(--bg-surface); padding:0.75rem 1rem; border-radius:var(--radius-sm); font-size:0.85rem; margin-bottom:1.25rem; border:1px solid var(--border-subtle);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
                        <span style="color:var(--text-muted)">Klien / PIC:</span>
                        <strong>{{ $ev->client->nama_pic }} ({{ $ev->client->tipe_klien }})</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:var(--text-muted)">Waktu Panggung:</span>
                        <span>{{ substr($ev->waktu_mulai, 0, 5) }} - {{ substr($ev->waktu_selesai, 0, 5) }} WIB</span>
                    </div>
                </div>

                <!-- Checklist Mini Progress -->
                <div style="margin-bottom:1.5rem;">
                    <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-muted); margin-bottom:0.25rem;">
                        <span>Kesiapan Acara (Checklist)</span>
                        <span>{{ $ev->checklist_progress }}%</span>
                    </div>
                    <div class="checklist-progress-bar" style="margin:0;">
                        <div class="checklist-progress-fill" style="width: {{ $ev->checklist_progress }}%;"></div>
                    </div>
                </div>
            </div>

            <div style="display:flex; gap:0.5rem; padding-top:1rem; border-top:1px solid var(--border-subtle);">
                <a href="{{ route('admin.events.command-center', $ev->id) }}" class="btn btn-primary btn-sm" style="flex:1;">
                    ⚡ Event Command Center
                </a>
                <a href="{{ route('admin.events.stage', $ev->id) }}" target="_blank" class="btn btn-secondary btn-sm" title="Buka Stage Mode">
                    🎤 Stage
                </a>
            </div>
        </div>
        @empty
        <div style="grid-column: 1 / -1; text-align:center; padding:4rem 2rem; background:var(--bg-surface); border-radius:var(--radius-lg); border:1px dashed var(--border-subtle);">
            <div style="font-size:3rem; margin-bottom:1rem;">🗓️</div>
            <h3>Tidak ada acara dengan status ini</h3>
            <p style="color:var(--text-muted); margin-top:0.5rem;">Semua permintaan booking dari portal publik akan muncul secara otomatis di sini.</p>
        </div>
        @endforelse
    </div>
</div>

<!-- Floating Action Button (FAB) -->
<button class="fab-btn" onclick="document.getElementById('quickEventModal').classList.add('active')" title="Buat Acara Baru Cepat">
    +
</button>

<!-- MODAL: Pengaturan Tier & Domain -->
<div class="modal-overlay" id="tierModal">
    <div class="modal-content" style="max-width:520px;">
        <div class="modal-header">
            <h3 class="modal-title">⚙️ Monetisasi & Domain SaaS</h3>
            <button class="btn-close">&times;</button>
        </div>
        <form onsubmit="handleTierUpdate(event)">
            <div class="form-group">
                <label class="form-label">Tingkat Langganan (SaaS Tier)</label>
                <select class="form-select" name="tier_langganan" id="tierSelect">
                    <option value="Free" {{ $mc->tier_langganan === 'Free' ? 'selected' : '' }}>Free (1 Acara Aktif, 5 Token AI)</option>
                    <option value="Pro" {{ $mc->tier_langganan === 'Pro' ? 'selected' : '' }}>Pro (Unlimited Acara, 100 Token AI, Custom Domain)</option>
                    <option value="Agency" {{ $mc->tier_langganan === 'Agency' ? 'selected' : '' }}>Agency (Multi-MC Management, Unlimited Token AI)</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Custom Domain Personal MC</label>
                <input type="text" class="form-input" name="custom_domain" value="{{ $mc->custom_domain }}" placeholder="Mis: vanyaarsyad.com">
                <small style="color:var(--text-muted); font-size:0.8rem; margin-top:0.25rem; display:block;">
                    Arahkan CNAME DNS domain Anda ke <code>cname.mcconnect.id</code>.
                </small>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('tierModal').classList.remove('active')">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Pengaturan</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL: Quick Create Event -->
<div class="modal-overlay" id="quickEventModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">⚡ Buat Acara Cepat (MC Input)</h3>
            <button class="btn-close">&times;</button>
        </div>
        <form action="{{ route('public.booking.submit') }}" method="POST">
            @csrf
            <div class="form-group">
                <label class="form-label">Nama Acara *</label>
                <input type="text" class="form-input" name="nama_acara" placeholder="Mis: Gala Dinner BUMN 2026" required>
            </div>
            <div class="grid-2col" style="gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Nama PIC *</label>
                    <input type="text" class="form-input" name="nama_pic" placeholder="Nama Klien" required>
                </div>
                <div class="form-group">
                    <label class="form-label">No. WhatsApp *</label>
                    <input type="text" class="form-input" name="no_wa" placeholder="081..." required>
                </div>
            </div>
            <div class="grid-2col" style="gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Tanggal Acara *</label>
                    <input type="date" class="form-input" name="tanggal_acara" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Lokasi *</label>
                    <input type="text" class="form-input" name="lokasi" placeholder="Venue" required>
                </div>
            </div>
            <div class="grid-2col" style="gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Waktu Mulai *</label>
                    <input type="time" class="form-input" name="waktu_mulai" value="18:30" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Waktu Selesai *</label>
                    <input type="time" class="form-input" name="waktu_selesai" value="22:00" required>
                </div>
            </div>
            <input type="hidden" name="tipe_klien" value="Corporate">
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('quickEventModal').classList.remove('active')">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan & Buka Command Center</button>
            </div>
        </form>
    </div>
</div>
@endsection

@section('extra_js')
<script>
    function handleTierUpdate(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        fetch('{{ route("admin.subscription.update") }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(res => {
            showToast('Tingkat langganan & domain berhasil diperbarui!', 'gold');
            document.getElementById('tierModal').classList.remove('active');
            setTimeout(() => location.reload(), 1200);
        })
        .catch(err => {
            showToast('Pengaturan tier berhasil disimulasikan!', 'gold');
            document.getElementById('tierModal').classList.remove('active');
        });
    }
</script>
@endsection

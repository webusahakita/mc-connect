@extends('layouts.public')

@section('title', $mc->nama_panggung . ' - Master of Ceremony & Host')

@section('content')
<!-- Hero Section -->
<section class="hero-section" id="biodata">
    <div class="container hero-grid">
        <div class="hero-content">
            <div class="hero-subtitle">
                <span>★</span> Official Booking Portal
            </div>
            <h1 class="hero-title">
                Bring Extraordinary Energy to Your Stage with <span>{{ $mc->nama_panggung }}</span>
            </h1>
            <p class="hero-bio">
                {{ $mc->bio }}
            </p>

            <div class="hero-specializations">
                @foreach(explode(',', $mc->spesialisasi) as $spec)
                <span class="spec-chip">✨ {{ trim($spec) }}</span>
                @endforeach
            </div>

            <div class="hero-cta">
                <a href="#kalender" class="btn btn-primary">
                    📅 Cek Jadwal & Request Booking
                </a>
                <button class="btn btn-secondary" onclick="document.getElementById('pressKitModal').classList.add('active')">
                    📥 Download Press Kit & Riders
                </button>
            </div>
        </div>

        <div class="hero-visual">
            <div class="hero-card">
                <div class="hero-img-wrapper">
                    <img src="{{ $mc->foto_profil }}" alt="{{ $mc->nama_panggung }}" class="hero-img">
                    <button class="btn-play-showreel" onclick="openShowreelModal()" title="Putar Showreel Panggung">
                        ▶
                    </button>
                    <div class="hero-img-overlay">
                        <div class="hero-card-meta">
                            <h3>{{ $mc->nama_panggung }}</h3>
                            <p>Bilingual Indonesian & English Host</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Stats Bar -->
<section class="stats-bar">
    <div class="container stats-grid">
        <div class="stat-item">
            <div class="stat-num">500+</div>
            <div class="stat-label">Acara Sukses</div>
        </div>
        <div class="stat-item">
            <div class="stat-num">8+</div>
            <div class="stat-label">Tahun Pengalaman</div>
        </div>
        <div class="stat-item">
            <div class="stat-num">99.8%</div>
            <div class="stat-label">Kepuasan Klien</div>
        </div>
        <div class="stat-item">
            <div class="stat-num">100%</div>
            <div class="stat-label">Jadwal Terkunci Presisi</div>
        </div>
    </div>
</section>

<!-- Service Catalog Packages -->
<section class="section-padding" id="katalog">
    <div class="container">
        <div class="section-header">
            <div class="section-tag">Katalog Layanan & Investasi</div>
            <h2 class="section-title">Pilihan Paket Panggung Eksklusif</h2>
            <p class="section-desc">
                Setiap paket dirancang khusus untuk memastikan ritme, kemewahan, dan kenyamanan tamu pada hari istimewa Anda.
            </p>
        </div>

        <div class="packages-grid">
            @foreach($packages as $pkg)
            <div class="package-card {{ $pkg['id'] === 'gold' ? 'featured' : '' }}">
                @if(isset($pkg['badge']))
                <span class="badge {{ $pkg['id'] === 'gold' ? 'badge-tier-pro' : 'badge-review' }} package-badge">
                    {{ $pkg['badge'] }}
                </span>
                @endif
                <h3 class="package-name">{{ $pkg['name'] }}</h3>
                <div class="package-price">{{ $pkg['price'] }}</div>
                <div class="package-duration">{{ $pkg['duration'] }}</div>

                <ul class="package-features">
                    @foreach($pkg['features'] as $feat)
                    <li>{{ $feat }}</li>
                    @endforeach
                </ul>

                <button class="btn {{ $pkg['id'] === 'gold' ? 'btn-primary' : 'btn-secondary' }}" 
                        onclick="selectPackage('{{ $pkg['name'] }}')">
                    Pilih Paket Ini
                </button>
            </div>
            @endforeach
        </div>
    </div>
</section>

<!-- Calendar Availability Section -->
<section class="section-padding calendar-section" id="kalender">
    <div class="container">
        <div class="section-header">
            <div class="section-tag">Cek Ketersediaan Real-Time</div>
            <h2 class="section-title">Kalender Jadwal Panggung</h2>
            <p class="section-desc">
                Hindari risiko bentrok jadwal. Klik tanggal berwarna hijau atau tentative untuk mengajukan permintaan booking instan.
            </p>
        </div>

        <div class="calendar-widget-wrapper" id="calendarWidgetContainer">
            <!-- Rendered by JS -->
        </div>
    </div>
</section>

<!-- CMS Blog, FAQ & Policies -->
<section class="section-padding" id="kebijakan">
    <div class="container">
        <div class="section-header">
            <div class="section-tag">CMS Mini & Kebijakan</div>
            <h2 class="section-title">Syarat, Kebijakan Refund & FAQ</h2>
            <p class="section-desc">
                Transparansi menyeluruh untuk kolaborasi panggung yang nyaman dan profesional.
            </p>
        </div>

        <div class="cms-accordion">
            @if($terms)
            <div class="accordion-item active">
                <div class="accordion-header">
                    <span>📜 {{ $terms->judul }}</span>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content">
                    {{ $terms->konten }}
                </div>
            </div>
            @endif

            @if($refundPolicy)
            <div class="accordion-item">
                <div class="accordion-header">
                    <span>🛡️ {{ $refundPolicy->judul }}</span>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content">
                    {{ $refundPolicy->konten }}
                </div>
            </div>
            @endif

            @if($riders)
            <div class="accordion-item">
                <div class="accordion-header">
                    <span>🎤 {{ $riders->judul }}</span>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content">
                    {{ $riders->konten }}
                </div>
            </div>
            @endif

            @foreach($faqs as $faq)
            <div class="accordion-item">
                <div class="accordion-header">
                    <span>❓ {{ $faq->judul }}</span>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content">
                    {{ $faq->konten }}
                </div>
            </div>
            @endforeach
        </div>
    </div>
</section>

<!-- Client Testimonials -->
<section class="section-padding" style="background:var(--bg-surface); border-top:1px solid var(--border-subtle);">
    <div class="container">
        <div class="section-header">
            <div class="section-tag">Ulasan Klien Terverifikasi</div>
            <h2 class="section-title">Apa Kata Mereka?</h2>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1.75rem;">
            @foreach($reviews as $rev)
            <div class="ecc-card">
                <div style="color:var(--gold-primary); margin-bottom:0.5rem; font-size:1.1rem;">
                    @for($i = 0; $i < $rev->rating; $i++) ★ @endfor
                </div>
                <p style="font-style:italic; color:var(--text-secondary); margin-bottom:1rem; font-size:0.95rem;">
                    "{{ $rev->komentar }}"
                </p>
                <div style="font-weight:700; font-size:0.9rem; color:var(--text-primary);">
                    — {{ $rev->nama_reviewer }}
                </div>
            </div>
            @endforeach
        </div>
    </div>
</section>

<!-- MODAL 1: Request to Book Modal -->
<div class="modal-overlay" id="bookingModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">✨ Request to Book MC</h3>
            <button class="btn-close">&times;</button>
        </div>

        <form id="bookingForm" onsubmit="handleBookingSubmit(event)">
            <input type="hidden" id="selectedPackageInput" name="paket_layanan" value="Gold Luxury Wedding Package">

            <div class="form-group">
                <label class="form-label">Tipe Klien / Pemesan *</label>
                <select class="form-select" name="tipe_klien" required>
                    <option value="Personal">Personal (Calon Pengantin / Keluarga)</option>
                    <option value="WO">Wedding Organizer (WO)</option>
                    <option value="EO">Event Organizer (EO)</option>
                    <option value="Corporate">Perusahaan / Korporat</option>
                </select>
            </div>

            <div class="grid-2col" style="gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Nama PIC / Kontak *</label>
                    <input type="text" class="form-input" name="nama_pic" placeholder="Mis: Farhan & Natasha" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Nomor WhatsApp Aktif *</label>
                    <input type="text" class="form-input" name="no_wa" placeholder="081234567890" required>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Nama Acara *</label>
                <input type="text" class="form-input" name="nama_acara" placeholder="Mis: The Wedding of Dimas & Ratih" required>
            </div>

            <div class="grid-2col" style="gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Tanggal Acara *</label>
                    <input type="date" class="form-input" id="bookTanggalAcara" name="tanggal_acara" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Lokasi / Venue Acara *</label>
                    <input type="text" class="form-input" name="lokasi" placeholder="Mis: Hotel Mulia Grand Ballroom" required>
                </div>
            </div>

            <div class="grid-2col" style="gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Waktu Mulai *</label>
                    <input type="time" class="form-input" name="waktu_mulai" value="19:00" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Waktu Selesai *</label>
                    <input type="time" class="form-input" name="waktu_selesai" value="22:00" required>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Catatan Khusus / Permintaan Khusus</label>
                <textarea class="form-textarea" name="catatan_khusus" placeholder="Mis: Konsep intimate wedding, dresscode formal navy, ada sambutan VIP pejabat..."></textarea>
            </div>

            <div class="form-group" style="margin-top:1rem;">
                <label style="display:flex; align-items:center; gap:0.6rem; font-size:0.85rem; color:var(--text-secondary); cursor:pointer;">
                    <input type="checkbox" required style="accent-color:var(--gold-primary); width:18px; height:18px;">
                    Saya menyetujui Syarat & Ketentuan Booking serta Kebijakan DP/Refund yang berlaku.
                </label>
            </div>

            <div style="margin-top:1.5rem; display:flex; justify-content:flex-end; gap:0.75rem;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('bookingModal').classList.remove('active')">Batal</button>
                <button type="submit" class="btn btn-primary" id="btnSubmitBooking">Kirim Permintaan Booking</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL 2: Showreel Video Modal -->
<div class="modal-overlay" id="showreelModal">
    <div class="modal-content" style="max-width:800px; padding:1.5rem;">
        <div class="modal-header">
            <h3 class="modal-title">🎬 Video Showreel - {{ $mc->nama_panggung }}</h3>
            <button class="btn-close" onclick="closeShowreelModal()">&times;</button>
        </div>
        <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:var(--radius-md);">
            <iframe id="showreelIframe" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" 
                    src="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
    </div>
</div>

<!-- MODAL 3: Press Kit Download Modal -->
<div class="modal-overlay" id="pressKitModal">
    <div class="modal-content" style="max-width:540px;">
        <div class="modal-header">
            <h3 class="modal-title">📄 Download Press Kit & Riders</h3>
            <button class="btn-close">&times;</button>
        </div>
        <div style="text-align:center; padding:1.5rem 0;">
            <div style="font-size:3.5rem; margin-bottom:1rem;">📁</div>
            <h4 style="font-size:1.2rem; margin-bottom:0.5rem;">Media Kit & Technical Riders 2026</h4>
            <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1.5rem;">
                Termasuk kurikulum panggung, portofolio foto resolusi tinggi, floorplan mic wireless, dan detail riders hospitality.
            </p>
            <a href="javascript:void(0)" onclick="downloadMockPressKit()" class="btn btn-primary" style="width:100%;">
                ⬇ Unduh Portofolio PDF (4.8 MB)
            </a>
        </div>
    </div>
</div>
@endsection

@section('extra_js')
<script>
    const eventsData = @json($events->map(function($e) {
        return [
            'id' => $e->id,
            'title' => $e->nama_acara,
            'date' => $e->tanggal_acara->format('Y-m-d'),
            'status' => $e->status
        ];
    }));

    document.addEventListener('DOMContentLoaded', () => {
        window.calendarApp = new AvailabilityCalendar('calendarWidgetContainer', eventsData);
        window.calendarApp.init();
    });

    function selectPackage(pkgName) {
        document.getElementById('selectedPackageInput').value = pkgName;
        document.getElementById('bookingModal').classList.add('active');
    }

    function openShowreelModal() {
        const iframe = document.getElementById('showreelIframe');
        iframe.src = "https://www.youtube.com/embed/{{ $mc->showreel_youtube_id }}?autoplay=1";
        document.getElementById('showreelModal').classList.add('active');
    }

    function closeShowreelModal() {
        const iframe = document.getElementById('showreelIframe');
        iframe.src = "";
        document.getElementById('showreelModal').classList.remove('active');
    }

    function handleBookingSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const btn = document.getElementById('btnSubmitBooking');
        btn.disabled = true;
        btn.textContent = 'Memproses Permintaan...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        fetch('{{ route("public.booking.submit") }}', {
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
            btn.textContent = 'Kirim Permintaan Booking';
            if (res.success) {
                document.getElementById('bookingModal').classList.remove('active');
                form.reset();
                showToast('Permintaan terkirim! Status jadwal di kalender kini TENTATIVE.', 'gold');
                // Tambahkan event lokal ke kalender
                eventsData.push({
                    id: res.event_id,
                    title: 'Tentative Booking',
                    date: data.tanggal_acara,
                    status: 'Tentative'
                });
                window.calendarApp.setEvents(eventsData);
            }
        })
        .catch(err => {
            btn.disabled = false;
            btn.textContent = 'Kirim Permintaan Booking';
            showToast('Permintaan booking berhasil disimulasikan!', 'gold');
            document.getElementById('bookingModal').classList.remove('active');
        });
    }

    function downloadMockPressKit() {
        showToast('Mengunduh Press Kit PDF Vanya Arsyad...', 'gold');
        setTimeout(() => {
            document.getElementById('pressKitModal').classList.remove('active');
        }, 1000);
    }
</script>
@endsection

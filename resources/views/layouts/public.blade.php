<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Vanya Arsyad - Professional MC & Host') | MC-Connect</title>
    <meta name="description" content="Portal booking dan profil resmi Master of Ceremony profesional untuk Luxury Wedding, Corporate Gala, dan Awarding Night.">
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    <link rel="stylesheet" href="{{ asset('css/landing.css') }}">
    @yield('extra_css')
</head>
<body>
    <!-- Public Site Navigation -->
    <nav class="site-nav">
        <div class="container nav-wrapper">
            <a href="{{ route('public.home') }}" class="brand-logo">
                <div class="brand-icon">MC</div>
                <div class="brand-text">MC-<span>Connect</span></div>
            </a>
            
            <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Toggle Menu">
                <span></span>
                <span></span>
                <span></span>
            </button>

            <ul class="nav-links">
                <li><a href="#biodata">Profil</a></li>
                <li><a href="#showreel">Showreel</a></li>
                <li><a href="#katalog">Paket Layanan</a></li>
                <li><a href="#kalender">Kalender Jadwal</a></li>
                <li><a href="#kebijakan">T&C & FAQ</a></li>
            </ul>

            <div class="nav-actions">
                <a href="#kalender" class="btn btn-primary btn-sm">Request to Book</a>
                <a href="{{ route('admin.dashboard') }}" class="btn btn-secondary btn-sm" title="Masuk ke Event Command Center">Login MC</a>
            </div>
        </div>
    </nav>

    <!-- Main Body -->
    <main>
        @yield('content')
    </main>

    <!-- Footer -->
    <footer style="background:var(--bg-surface); border-top:1px solid var(--border-subtle); padding:3rem 0; margin-top:4rem; text-align:center;">
        <div class="container">
            <div class="brand-logo" style="justify-content:center; margin-bottom:1rem;">
                <div class="brand-icon">MC</div>
                <div class="brand-text">MC-<span>Connect</span></div>
            </div>
            <p style="color:var(--text-secondary); font-size:0.9rem; max-width:500px; margin:0 auto 1.5rem;">
                Sistem Manajemen & Booking MC Terpadu berbasis Event-Centric SaaS. Presisi panggung, otomasi invoice, dan kemudahan booking.
            </p>
            <p style="color:var(--text-muted); font-size:0.8rem;">
                &copy; {{ date('Y') }} MC-Connect Platform. All rights reserved.
            </p>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="{{ asset('js/calendar.js') }}"></script>
    <script src="{{ asset('js/app.js') }}"></script>
    @yield('extra_js')
</body>
</html>

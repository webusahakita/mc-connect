<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'MC-Connect - Sistem Manajemen & Booking MC Terpadu')</title>
    <meta name="description" content="Platform Event-Centric SaaS untuk Master of Ceremony Profesional.">
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    <link rel="stylesheet" href="{{ asset('css/command-center.css') }}">
    <link rel="stylesheet" href="{{ asset('css/stage-mode.css') }}">
    <link rel="stylesheet" href="{{ asset('css/admin.css') }}">
    @yield('extra_css')
</head>
<body>
    <div class="admin-shell">
        <!-- Sidebar Navigasi Utama -->
        <aside class="admin-sidebar">
            <div class="sidebar-header">
                <a href="{{ route('admin.dashboard') }}" class="brand-logo">
                    <div class="brand-icon">MC</div>
                    <div class="brand-text">MC-<span>Connect</span></div>
                </a>
                <span style="font-size:0.7rem; font-weight:800; background:rgba(212,175,55,0.15); color:var(--gold-primary); border:1px solid var(--border-accent); padding:0.15rem 0.5rem; border-radius:999px;">
                    v8.0
                </span>
            </div>

            <div class="sidebar-profile">
                <img src="{{ $mc->foto_profil_url ?? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' }}" alt="{{ $mc->nama_panggung ?? 'MC' }}" class="sidebar-avatar">
                <div class="sidebar-user-info">
                    <h4>{{ $mc->nama_panggung ?? 'Vanya Arsyad, S.I.Kom' }}</h4>
                    <span>Master of Ceremony</span>
                </div>
            </div>

            <div class="sidebar-menu-group">
                <div class="sidebar-group-title">Menu Utama Workspace</div>
                <ul class="sidebar-menu">
                    <li>
                        <a href="{{ route('admin.dashboard') }}" class="sidebar-item-btn {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">
                            <div class="sidebar-item-left">
                                <span class="sidebar-icon">📊</span>
                                <span>Dashboard</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.dashboard') }}#calendar" class="sidebar-item-btn">
                            <div class="sidebar-item-left">
                                <span class="sidebar-icon">📅</span>
                                <span>Kalender Acara</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.dashboard') }}#customers" class="sidebar-item-btn">
                            <div class="sidebar-item-left">
                                <span class="sidebar-icon">👥</span>
                                <span>Data Pelanggan</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.dashboard') }}#cashflow" class="sidebar-item-btn">
                            <div class="sidebar-item-left">
                                <span class="sidebar-icon">💰</span>
                                <span>Cash Flow</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.dashboard') }}#cms" class="sidebar-item-btn">
                            <div class="sidebar-item-left">
                                <span class="sidebar-icon">⚙️</span>
                                <span>Pengaturan Landing Page</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.command-center', ['id' => 101]) }}" class="sidebar-item-btn {{ request()->routeIs('admin.command-center*') ? 'active' : '' }}">
                            <div class="sidebar-item-left">
                                <span class="sidebar-icon">⚡</span>
                                <span>Event Command Center</span>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.stage', ['id' => 101]) }}" target="_blank" class="sidebar-item-btn">
                            <div class="sidebar-item-left">
                                <span class="sidebar-icon">🎤</span>
                                <span>6. Stage Mode (Prompter)</span>
                            </div>
                            <span class="badge badge-available" style="font-size:0.65rem; background:rgba(99,102,241,0.2); color:#A5B4FC;">Live ↗</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('vendor.screen', ['id' => 101]) }}" target="_blank" class="sidebar-item-btn">
                            <div class="sidebar-item-left">
                                <span class="sidebar-icon">🎛️</span>
                                <span>7. Layar Vendor Musik</span>
                            </div>
                            <span class="badge badge-available" style="font-size:0.65rem; background:rgba(56,189,248,0.2); color:#38BDF8;">FOH ↗</span>
                        </a>
                    </li>

                </ul>
            </div>

            <div class="sidebar-footer">
                <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.82rem;">
                    <div class="ai-token-pill" style="padding:0.25rem 0.65rem; font-size:0.78rem;">
                        ⚡ <span>{{ $mc->token_ai_tersisa ?? 85 }} Token AI</span>
                    </div>
                    <a href="{{ route('public.home') }}" target="_blank" style="color:var(--gold-primary); font-size:0.8rem;">
                        Lihat Web ↗
                    </a>
                </div>
                <form action="{{ route('auth.logout') }}" method="POST">
                    @csrf
                    <button type="submit" class="btn btn-secondary btn-sm" style="border-color:rgba(239,68,68,0.4); color:#F87171; justify-content:center; width:100%;">
                        🚪 Logout / Keluar
                    </button>
                </form>
            </div>
        </aside>

        <!-- Main Body Content -->
        <main class="admin-body-content">
            @yield('content')
        </main>
    </div>

    <!-- Scripts -->
    <script src="{{ asset('js/soundboard.js') }}"></script>
    <script src="{{ asset('js/teleprompter.js') }}"></script>
    <script src="{{ asset('js/live-sync.js') }}"></script>
    <script src="{{ asset('js/calendar.js') }}"></script>
    <script src="{{ asset('js/app.js') }}"></script>
    @yield('extra_js')
</body>
</html>

<!DOCTYPE html>
<html lang="id" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>MC-Connect — Sistem Manajemen & Booking MC Terpadu</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/admin.css?v=8.17">
    <link rel="stylesheet" href="/css/command-center.css?v=8.4">
    <link rel="stylesheet" href="/css/custom-modal.css?v=8.3">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.tsx'])
</head>
<body class="bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950 min-h-screen">
    <div id="app">
        <div id="spa-initial-loader" style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #020617; color: #f8fafc; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 1.5rem;">
            <div style="width: 44px; height: 44px; border: 3px solid rgba(212,175,55,0.2); border-top-color: #D4AF37; border-radius: 50%; animation: mcSpin 0.8s linear infinite; margin-bottom: 1.25rem;"></div>
            <div style="font-size: 0.9rem; font-weight: 800; letter-spacing: 0.08em; color: #D4AF37;">MEMUAT MC-CONNECT...</div>
            <p style="font-size: 0.78rem; color: #64748B; margin-top: 0.4rem; max-width: 320px;">Menghubungkan ke ruang kerja operasional & sinkronisasi data...</p>
            <div id="spa-loader-fallback" style="display: none; margin-top: 1.5rem;">
                <p style="font-size: 0.8rem; color: #F87171; margin-bottom: 0.75rem;">Pemuatan membutuhkan waktu lebih lama dari biasanya.</p>
                <button onclick="window.location.reload()" style="background: #D4AF37; color: #020617; border: none; font-weight: 700; font-size: 0.82rem; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer;">
                    Muat Ulang Halaman
                </button>
            </div>
        </div>
        <style>
            @keyframes mcSpin { to { transform: rotate(360deg); } }
        </style>
        <script>
            setTimeout(function() {
                var fallback = document.getElementById('spa-loader-fallback');
                if (fallback && document.getElementById('spa-initial-loader')) {
                    fallback.style.display = 'block';
                }
            }, 6000);
        </script>
    </div>
</body>
</html>

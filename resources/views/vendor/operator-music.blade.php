<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Screen Operator Musik & Sound - {{ $event->nama_acara }}</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    <link rel="stylesheet" href="{{ asset('css/stage-mode.css') }}">
    <style>
        .sync-active-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid #10B981;
            color: #34D399;
            padding: 0.4rem 1rem;
            border-radius: var(--radius-full);
            font-size: 0.85rem;
            font-weight: 700;
        }
        .sync-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #10B981;
            animation: pulseDot 1.2s infinite;
        }
        @keyframes pulseDot {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.4); opacity: 0.5; }
        }
    </style>
</head>
<body class="vendor-screen">
    <div class="container" style="max-width:1100px;">
        <!-- Top Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:1.5rem; margin-bottom:2rem; flex-wrap:wrap; gap:1rem;">
            <div>
                <div style="color:var(--gold-primary); font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.25rem;">
                    🎛️ Layar Kolaborasi Vendor Musik & Soundman
                </div>
                <h1 style="font-size:1.8rem; font-weight:800;">{{ $event->nama_acara }}</h1>
                <div style="color:var(--text-secondary); font-size:0.9rem;">
                    Venue: {{ $event->lokasi }} | MC: Vanya Arsyad
                </div>
            </div>

            <div style="display:flex; align-items:center; gap:1rem;">
                <div class="sync-active-badge">
                    <span class="sync-dot"></span>
                    <span id="syncStatusLabel">Tersinkronisasi Real-Time (Live)</span>
                </div>
            </div>
        </div>

        <!-- Active Live Segment Banner -->
        <div style="background:linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(56, 189, 248, 0.15)); border:2px solid var(--gold-primary); border-radius:var(--radius-lg); padding:1.75rem 2rem; margin-bottom:2rem; box-shadow:var(--shadow-gold);">
            <div style="font-size:0.85rem; font-weight:800; color:var(--gold-primary); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:0.4rem;">
                🔥 SEGMEN PANGGUNG AKTIF SAAT INI:
            </div>
            <h2 id="activeLiveTitle" style="font-size:2rem; font-weight:800; margin-bottom:0.75rem;">
                Segmen 1: {{ $event->rundownItems->first()->judul_segmen ?? 'Opening' }}
            </h2>
            <div style="background:rgba(0,0,0,0.4); padding:1rem 1.5rem; border-radius:var(--radius-md); border-left:4px solid #38BDF8;">
                <span style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Instruksi Musik / Audio Cue:</span>
                <div id="activeLiveCue" style="font-size:1.4rem; font-weight:700; color:#38BDF8; margin-top:0.25rem;">
                    {{ $event->rundownItems->first()->instruksi_musik ?? 'Fade-in Ambience Theme, volume 30%' }}
                </div>
            </div>
        </div>

        <!-- Full Rundown Cue Matrix -->
        <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:1rem;">Daftar Cue Musik Panggung Lengkap:</h3>
        <table class="vendor-table">
            <thead>
                <tr>
                    <th>Urutan</th>
                    <th>Waktu</th>
                    <th>Nama Segmen</th>
                    <th>Instruksi Musik & Sound Effect</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody id="vendorRundownTableBody">
                @foreach($event->rundownItems as $idx => $item)
                <tr id="row-segment-{{ $item->urutan }}" class="{{ $idx === 0 ? 'active-live' : '' }}">
                    <td style="font-weight:800; font-size:1.1rem; color:var(--gold-primary);">#{{ $item->urutan }}</td>
                    <td style="font-family:var(--font-mono); font-weight:600;">{{ $item->waktu_segmen }}</td>
                    <td style="font-weight:700; font-size:1rem;">{{ $item->judul_segmen }}</td>
                    <td style="color:#38BDF8; font-weight:600; font-size:0.95rem;">
                        {{ $item->instruksi_musik ?? '— Background music normal —' }}
                    </td>
                    <td>
                        <span class="badge {{ $idx === 0 ? 'badge-available' : 'badge-completed' }}" id="badge-seg-{{ $item->urutan }}">
                            {{ $idx === 0 ? 'LIVE ON STAGE' : 'Standby' }}
                        </span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <script src="{{ asset('js/soundboard.js') }}"></script>
    <script src="{{ asset('js/live-sync.js') }}"></script>
    <script>
        const eventId = {{ $event->id }};

        // Listen for real-time broadcasts from the MC Stage Mode!
        window.liveSync.subscribe((data) => {
            if (data.type === 'SEGMENT_CHANGE') {
                const p = data.payload;
                // Update live banner
                document.getElementById('activeLiveTitle').textContent = `Segmen ${p.segmentIndex}: ${p.segmentTitle}`;
                document.getElementById('activeLiveCue').textContent = p.musicCue || '— Background music normal —';

                // Update table rows
                document.querySelectorAll('.vendor-table tr').forEach(r => r.classList.remove('active-live'));
                document.querySelectorAll('.vendor-table .badge').forEach(b => {
                    b.className = 'badge badge-completed';
                    b.textContent = 'Standby';
                });

                const activeRow = document.getElementById(`row-segment-${p.segmentIndex}`);
                const activeBadge = document.getElementById(`badge-seg-${p.segmentIndex}`);
                if (activeRow) activeRow.classList.add('active-live');
                if (activeBadge) {
                    activeBadge.className = 'badge badge-available';
                    activeBadge.textContent = 'LIVE ON STAGE';
                }

                // Play subtle chime to alert operator
                window.soundboard.playDing();
            }
        });
    </script>
</body>
</html>

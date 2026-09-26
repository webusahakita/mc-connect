@extends('layouts.stage')

@section('title', 'Stage Mode - ' . $event->nama_acara)

@section('content')
<div class="stage-container">
    <!-- 70% Prompter Section -->
    <div class="stage-prompter-pane">
        <div class="prompter-top-bar">
            <div style="display:flex; align-items:center; gap:0.75rem;">
                <a href="{{ route('admin.events.command-center', $event->id) }}" class="prompter-ctrl-btn" title="Kembali ke Command Center">
                    ◀ Exit Stage
                </a>
                <span class="prompter-segment-badge" id="currentSegmentBadge">
                    Segmen 1/{{ $event->rundownItems->count() }}: {{ $event->rundownItems->first()->judul_segmen ?? 'Pembukaan' }}
                </span>
            </div>

            <div class="prompter-controls">
                <button class="prompter-ctrl-btn" onclick="window.teleprompter.decreaseFont()" title="Kecilkan Font">A-</button>
                <button class="prompter-ctrl-btn" onclick="window.teleprompter.increaseFont()" title="Besarkan Font">A+</button>
                <button class="prompter-ctrl-btn" id="btnMirrorToggle" onclick="toggleMirrorMode()">🪞 Mirror</button>
                <button class="prompter-ctrl-btn" id="btnVoiceToggle" onclick="toggleVoiceMode()">🎙️ Voice Auto-Advance</button>
                <button class="prompter-ctrl-btn" id="btnScrollToggle" onclick="toggleAutoScroll()" style="background:var(--gold-primary); color:#000;">
                    ▶ Auto-Scroll
                </button>
            </div>
        </div>

        <div class="prompter-viewport" id="prompterViewport">
            <div id="prompterMusicHint" class="prompter-music-hint">
                🎵 Music Cue: {{ $event->rundownItems->first()->instruksi_musik ?? 'Fade in background ambience' }}
            </div>

            <div class="prompter-text" id="prompterTextContainer">
                <p id="prompterActiveScript">
                    {{ $event->rundownItems->first()->naskah_prompter ?? 'Selamat malam bapak ibu hadirin sekalian...' }}
                </p>
            </div>
        </div>

        <div class="speech-active-indicator" id="speechIndicator">
            <span>●</span> Suara MC Terdeteksi (Prompter Bergulir Otomatis)
        </div>
    </div>

    <!-- 30% Soundboard & Digital Timer Section -->
    <div class="stage-sidebar-pane">
        <!-- Stage Clock & Stopwatch -->
        <div class="stage-timer-card">
            <div class="stage-clock" id="stageDigitalClock">19:00:00</div>
            <div class="stage-stopwatch-label">Durasi Segmen Berjalan</div>
            <div class="stage-stopwatch" id="stageStopwatchDisplay">00:00:00</div>

            <div class="stage-timer-controls">
                <button class="btn btn-secondary btn-sm" onclick="startStopwatch()">Start</button>
                <button class="btn btn-secondary btn-sm" onclick="pauseStopwatch()">Pause</button>
                <button class="btn btn-secondary btn-sm" onclick="resetStopwatch()">Reset</button>
            </div>
        </div>

        <!-- Built-in Soundboard Module -->
        <div class="soundboard-card">
            <div class="soundboard-header">
                <div class="soundboard-title">⚡ Stage Soundboard</div>
                <span style="font-size:0.75rem; color:var(--text-muted);">Web Audio API</span>
            </div>

            <div class="soundboard-grid">
                <button class="sound-pad" onclick="triggerSound('applause')">
                    <span class="sound-pad-icon">👏</span>
                    <span>Applause</span>
                </button>
                <button class="sound-pad" onclick="triggerSound('drumroll')">
                    <span class="sound-pad-icon">🥁</span>
                    <span>Drum Roll</span>
                </button>
                <button class="sound-pad" onclick="triggerSound('fanfare')">
                    <span class="sound-pad-icon">🎺</span>
                    <span>Fanfare</span>
                </button>
                <button class="sound-pad" onclick="triggerSound('ding')">
                    <span class="sound-pad-icon">🔔</span>
                    <span>Chime / Ding</span>
                </button>
                <button class="sound-pad" onclick="triggerSound('buzzer')">
                    <span class="sound-pad-icon">🚨</span>
                    <span>Buzzer</span>
                </button>
                <button class="sound-pad" onclick="triggerSound('suspense')">
                    <span class="sound-pad-icon">🎻</span>
                    <span>Suspense</span>
                </button>
            </div>
        </div>

        <!-- Stage Segment Navigation -->
        <div class="stage-nav-bar">
            <button class="stage-nav-btn btn-secondary" onclick="prevSegment()">
                ◀ Prev Segmen
            </button>
            <button class="stage-nav-btn btn-primary" onclick="nextSegment()">
                Next Segmen ▶
            </button>
        </div>
    </div>
</div>
@endsection

@section('extra_js')
<script>
    const rundownItems = @json($event->rundownItems);
    let currentIndex = 0;
    const eventId = {{ $event->id }};

    document.addEventListener('DOMContentLoaded', () => {
        window.teleprompter.init('prompterViewport', 'prompterTextContainer');
        startClock();
        loadSegment(0);
    });

    function loadSegment(index) {
        if (index < 0 || index >= rundownItems.length) return;
        currentIndex = index;
        const item = rundownItems[index];

        document.getElementById('currentSegmentBadge').textContent = `Segmen ${item.urutan}/${rundownItems.length}: ${item.judul_segmen}`;
        document.getElementById('prompterActiveScript').textContent = item.naskah_prompter || '— Tanpa naskah prompter —';
        
        const musicHint = document.getElementById('prompterMusicHint');
        if (item.instruksi_musik) {
            musicHint.style.display = 'block';
            musicHint.textContent = `🎵 Music Cue: ${item.instruksi_musik}`;
        } else {
            musicHint.style.display = 'none';
        }

        // Scroll back to top
        document.getElementById('prompterViewport').scrollTop = 0;

        // Reset timer
        resetStopwatch();
        startStopwatch();

        // Broadcast to Vendor Music Screen via LiveSync
        window.liveSync.syncActiveSegment(eventId, index + 1, item.judul_segmen, item.instruksi_musik);
    }

    function nextSegment() {
        if (currentIndex < rundownItems.length - 1) {
            loadSegment(currentIndex + 1);
        } else {
            alert('Ini adalah segmen penutup terakhir dari rundown!');
        }
    }

    function prevSegment() {
        if (currentIndex > 0) {
            loadSegment(currentIndex - 1);
        }
    }

    function toggleAutoScroll() {
        const isScrolling = window.teleprompter.toggleScroll();
        const btn = document.getElementById('btnScrollToggle');
        if (isScrolling) {
            btn.textContent = '⏸ Pause Scroll';
            btn.style.background = '#EF4444';
            btn.style.color = '#FFF';
        } else {
            btn.textContent = '▶ Auto-Scroll';
            btn.style.background = 'var(--gold-primary)';
            btn.style.color = '#000';
        }
    }

    function toggleVoiceMode() {
        const active = window.teleprompter.toggleVoiceMode();
        const btn = document.getElementById('btnVoiceToggle');
        btn.classList.toggle('active', active);
    }

    function toggleMirrorMode() {
        const isMirror = window.teleprompter.toggleMirror();
        const btn = document.getElementById('btnMirrorToggle');
        btn.classList.toggle('active', isMirror);
    }

    function triggerSound(sound) {
        if (sound === 'applause') window.soundboard.playApplause();
        if (sound === 'drumroll') window.soundboard.playDrumRoll();
        if (sound === 'fanfare') window.soundboard.playFanfare();
        if (sound === 'ding') window.soundboard.playDing();
        if (sound === 'buzzer') window.soundboard.playBuzzer();
        if (sound === 'suspense') window.soundboard.playSuspense();
    }

    // Real-Time Digital Clock
    function startClock() {
        setInterval(() => {
            const now = new Date();
            const timeStr = now.toTimeString().split(' ')[0];
            document.getElementById('stageDigitalClock').textContent = timeStr;
        }, 1000);
    }

    // Stage Stopwatch Timer
    let stopwatchSeconds = 0;
    let stopwatchInterval = null;

    function startStopwatch() {
        if (stopwatchInterval) return;
        stopwatchInterval = setInterval(() => {
            stopwatchSeconds++;
            const h = String(Math.floor(stopwatchSeconds / 3600)).padStart(2, '0');
            const m = String(Math.floor((stopwatchSeconds % 3600) / 60)).padStart(2, '0');
            const s = String(stopwatchSeconds % 60).padStart(2, '0');
            document.getElementById('stageStopwatchDisplay').textContent = `${h}:${m}:${s}`;
        }, 1000);
    }

    function pauseStopwatch() {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
    }

    function resetStopwatch() {
        pauseStopwatch();
        stopwatchSeconds = 0;
        document.getElementById('stageStopwatchDisplay').textContent = '00:00:00';
    }
</script>
@endsection

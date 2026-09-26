/**
 * MC-Connect Luxury Ambient Background Music (BGM) Engine v9.1
 * Pure HTML5 Web Audio API - Zero External Dependencies - 100% Offline
 *
 * Provides:
 * 1. Warm, lush, arpeggiated acoustic piano & lounge chord progressions.
 * 2. Instant Zero-Latency Turn Off (Matikan Musik) with physical voice bus disconnection.
 * 3. Immediate Track Switching between 3 distinct themes (Wedding, Gala, Sunset).
 * 4. Comprehensive Volume Controls (Slider, Steps -/+, Presets 0-100%, Mute).
 * 5. 100% Synchronous state management ensuring immediate UI updates.
 */

class LuxuryBgmEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.voiceGain = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = 0.5; // Default 50%
        this.previousVolume = 0.5;
        this.currentTrack = 'wedding'; // 'wedding' | 'gala' | 'acoustic'
        this.chordIndex = 0;
        this.noteTimer = null;
        this.activeNodes = [];

        // 3 Distinct Musical Themes
        this.tracks = {
            wedding: {
                name: 'Wedding Romance (Piano & Strings)',
                shortName: 'Wedding Romance',
                bpm: 64,
                // Chord progression in MIDI notes:
                // Cmaj9, Am9, Fmaj7, Gsus4-G, Cmaj7
                chords: [
                    { bass: 36, notes: [48, 52, 55, 59, 64] }, // Cmaj9 (C2 bass, C3, E3, G3, B3, E4)
                    { bass: 33, notes: [45, 48, 52, 55, 60] }, // Am9 (A1 bass, A2, C3, E3, G3, C4)
                    { bass: 29, notes: [41, 45, 48, 52, 57] }, // Fmaj7 (F1 bass, F2, A2, C3, E3, A3)
                    { bass: 31, notes: [43, 47, 50, 55, 62] }, // Gsus4 / G7 (G1 bass, G2, B2, D3, G3, D4)
                    { bass: 36, notes: [48, 55, 59, 64, 67] }  // Cmaj7 (C2 bass, C3, G3, B3, E4, G4)
                ]
            },
            gala: {
                name: 'Corporate Gala Lounge & Wine',
                shortName: 'Gala Lounge',
                bpm: 76,
                // Jazz Lounge: Dm9, G13, Cmaj9, A7b9
                chords: [
                    { bass: 38, notes: [50, 53, 57, 60, 64] }, // Dm9 (D2 bass, D3, F3, A3, C4, E4)
                    { bass: 31, notes: [43, 47, 52, 57, 59] }, // G13 (G1 bass, G2, B2, E3, A3, B3)
                    { bass: 36, notes: [48, 52, 55, 59, 62] }, // Cmaj9 (C2 bass, C3, E3, G3, B3, D4)
                    { bass: 33, notes: [45, 49, 52, 55, 61] }  // A7b9 (A1 bass, A2, C#3, E3, G3, C#4)
                ]
            },
            acoustic: {
                name: 'Sunset Celebration Vibe',
                shortName: 'Sunset Vibe',
                bpm: 82,
                // Celebratory Acoustic: Gmaj7, Em7, Cmaj7, Dadd9
                chords: [
                    { bass: 31, notes: [43, 47, 50, 55, 59] }, // Gmaj7 (G1 bass, G2, B2, D3, G3, B3)
                    { bass: 28, notes: [40, 43, 47, 52, 55] }, // Em7 (E1 bass, E2, G2, B2, E3, G3)
                    { bass: 36, notes: [48, 52, 55, 59, 64] }, // Cmaj7 (C2 bass, C3, E3, G3, B3, E4)
                    { bass: 38, notes: [50, 54, 57, 62, 66] }  // Dadd9 (D2 bass, D3, F#3, A3, D4, F#4)
                ]
            }
        };

        this.loadPreferences();
    }

    loadPreferences() {
        try {
            const savedVol = localStorage.getItem('mc_bgm_volume');
            if (savedVol !== null) {
                const parsed = parseFloat(savedVol);
                if (!isNaN(parsed)) {
                    this.volume = Math.max(0, Math.min(1, parsed));
                    this.previousVolume = this.volume > 0 ? this.volume : 0.5;
                }
            }
            const savedMute = localStorage.getItem('mc_bgm_muted');
            if (savedMute !== null) {
                this.isMuted = savedMute === '1';
            }
            const savedTrack = localStorage.getItem('mc_bgm_track');
            if (savedTrack && this.tracks[savedTrack]) {
                this.currentTrack = savedTrack;
            }
        } catch (e) {}
    }

    savePreferences() {
        try {
            localStorage.setItem('mc_bgm_volume', this.volume.toString());
            localStorage.setItem('mc_bgm_muted', this.isMuted ? '1' : '0');
            localStorage.setItem('mc_bgm_track', this.currentTrack);
        } catch (e) {}
    }

    ensureAudioContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();

            this.masterGain = this.ctx.createGain();
            const effVol = (this.isMuted || this.volume === 0) ? 0 : this.volume;
            // Clear, robust master volume scaling (0.85 max for rich loudness)
            this.masterGain.gain.setValueAtTime(effVol * 0.85, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.voiceGain = this.ctx.createGain();
            this.voiceGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
            this.voiceGain.connect(this.masterGain);
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            try {
                this.ctx.resume();
            } catch (e) {}
        }
    }

    stopVoiceBus() {
        if (this.voiceGain && this.ctx) {
            try {
                this.voiceGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.voiceGain.gain.setValueAtTime(0, this.ctx.currentTime);
                this.voiceGain.disconnect();
            } catch (e) {}
        }
        if (this.ctx && this.masterGain) {
            try {
                this.voiceGain = this.ctx.createGain();
                this.voiceGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
                this.voiceGain.connect(this.masterGain);
            } catch (e) {}
        }
    }

    stopAllActiveNodes() {
        this.stopVoiceBus();
        if (this.activeNodes && this.activeNodes.length > 0) {
            this.activeNodes.forEach(node => {
                try {
                    if (typeof node.stop === 'function') {
                        node.stop(0);
                    }
                    node.disconnect();
                } catch (e) {}
            });
            this.activeNodes = [];
        }
    }

    midiToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    // Play a single piano/rhodes acoustic tone
    playSingleNote(freq, startTime, duration, velocity = 0.5, pan = 0) {
        if (!this.ctx || !this.isPlaying || !this.voiceGain) return;

        const now = Math.max(startTime, this.ctx.currentTime + 0.005);

        // Fundamental tone (warm sine wave)
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, now);

        // Acoustic overtone (triangle wave with slight warmth)
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 1.001, now);

        // Low-pass filter for soothing acoustic character
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, now);
        try {
            filter.frequency.exponentialRampToValueAtTime(700, now + duration);
        } catch (e) {}

        // Note Envelope
        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0.0001, now);
        // Instant pleasant attack
        noteGain.gain.linearRampToValueAtTime(velocity * 0.48, now + 0.025);
        // Piano decay & release
        try {
            noteGain.gain.exponentialRampToValueAtTime(velocity * 0.18, now + 0.7);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        } catch (e) {}

        // Stereo pan
        const panner = (typeof this.ctx.createStereoPanner === 'function') 
            ? this.ctx.createStereoPanner() 
            : null;
        if (panner) {
            panner.pan.setValueAtTime(pan, now);
        }

        // Routing through voiceGain
        osc1.connect(noteGain);
        osc2.connect(noteGain);
        noteGain.connect(filter);

        if (panner) {
            filter.connect(panner);
            panner.connect(this.voiceGain);
        } else {
            filter.connect(this.voiceGain);
        }

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration + 0.1);
        osc2.stop(now + duration + 0.1);

        const cleanup = () => {
            try { osc1.disconnect(); } catch (e) {}
            try { osc2.disconnect(); } catch (e) {}
            try { noteGain.disconnect(); } catch (e) {}
            try { filter.disconnect(); } catch (e) {}
            if (panner) try { panner.disconnect(); } catch (e) {}
        };
        osc1.onended = cleanup;

        this.activeNodes.push(osc1, osc2, noteGain, filter);
        if (this.activeNodes.length > 80) {
            this.activeNodes.splice(0, 30);
        }
    }

    // Play warm background ambient strings pad for the chord
    playPad(notes, startTime, duration, velocity = 0.25) {
        if (!this.ctx || !this.isPlaying || !this.voiceGain) return;

        const now = Math.max(startTime, this.ctx.currentTime + 0.005);
        notes.forEach((midi) => {
            const freq = this.midiToFreq(midi);
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            const padFilter = this.ctx.createBiquadFilter();
            padFilter.type = 'lowpass';
            padFilter.frequency.setValueAtTime(850, now);

            const padGain = this.ctx.createGain();
            padGain.gain.setValueAtTime(0.0001, now);
            padGain.gain.linearRampToValueAtTime(velocity * 0.22, now + 0.5);
            padGain.gain.linearRampToValueAtTime(velocity * 0.18, now + duration - 0.4);
            try {
                padGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.4);
            } catch (e) {}

            osc.connect(padGain);
            padGain.connect(padFilter);
            padFilter.connect(this.voiceGain);

            osc.start(now);
            osc.stop(now + duration + 0.5);

            osc.onended = () => {
                try { osc.disconnect(); } catch (e) {}
                try { padGain.disconnect(); } catch (e) {}
                try { padFilter.disconnect(); } catch (e) {}
            };

            this.activeNodes.push(osc, padGain, padFilter);
        });
    }

    // Schedules a rich, flowing musical bar
    scheduleBar() {
        if (!this.isPlaying || !this.ctx) return;

        const track = this.tracks[this.currentTrack] || this.tracks.wedding;
        const chords = track.chords;
        const chordObj = chords[this.chordIndex % chords.length];

        const barDurationSec = (60 / track.bpm) * 4; // 4 beats per bar
        const now = this.ctx.currentTime + 0.05;

        // 1. Play deep bass note on Beat 1
        const bassFreq = this.midiToFreq(chordObj.bass);
        this.playSingleNote(bassFreq, now, barDurationSec * 0.95, 0.75, 0);

        // 2. Play warm background ambient strings pad
        this.playPad(chordObj.notes.slice(0, 3), now, barDurationSec, 0.28);

        // 3. Play elegant arpeggiated piano notes rolling through the chord
        const notes = chordObj.notes;
        const stepSec = barDurationSec / 8;
        const arpPattern = (this.currentTrack === 'gala') 
            ? [0, 3, 1, 4, 2, 4, 1, 3] 
            : ((this.currentTrack === 'acoustic') ? [0, 2, 4, 3, 2, 4, 1, 3] : [0, 2, 4, 1, 3, 2, 4, 3]);

        arpPattern.forEach((noteIdx, step) => {
            const midi = notes[noteIdx % notes.length];
            const freq = this.midiToFreq(midi);
            const noteTime = now + (step * stepSec);
            const pan = ((step % 2 === 0) ? -0.25 : 0.25);
            const vel = (step === 0 || step === 4) ? 0.7 : 0.5;
            this.playSingleNote(freq, noteTime, 1.8, vel, pan);
        });

        // Advance to next chord
        this.chordIndex++;

        // Schedule next bar
        this.noteTimer = setTimeout(() => {
            if (this.isPlaying) {
                this.scheduleBar();
            }
        }, Math.max(100, (barDurationSec * 1000) - 80));
    }

    start() {
        this.ensureAudioContext();
        if (this.isPlaying) {
            this.updateUi();
            return;
        }

        this.isPlaying = true;
        this.isMuted = false;

        if (this.volume === 0) {
            this.volume = this.previousVolume > 0 ? this.previousVolume : 0.5;
        }

        // Ramp master gain to target volume
        if (this.masterGain && this.ctx) {
            try {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.setValueAtTime(this.volume * 0.85, this.ctx.currentTime);
            } catch (e) {}
        }

        this.chordIndex = 0;
        this.scheduleBar();
        this.savePreferences();
        this.updateUi();

        if (typeof showToast === 'function') {
            const tName = (this.tracks[this.currentTrack] || this.tracks.wedding).name;
            showToast(`🎵 Memutar Musik: "${tName}" (${Math.round(this.volume * 100)}%)`, 'gold');
        }
    }

    stop() {
        this.isPlaying = false;

        if (this.noteTimer) {
            clearTimeout(this.noteTimer);
            this.noteTimer = null;
        }

        // 1. Immediately cut voice bus and active nodes for instant silence
        this.stopAllActiveNodes();

        this.savePreferences();
        this.updateUi();

        if (typeof showToast === 'function') {
            showToast('⏹ Musik latar berhasil dimatikan (Hening)', 'gold');
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    setVolume(newVal) {
        const num = Math.max(0, Math.min(1, parseFloat(newVal)));
        this.volume = num;

        if (num > 0) {
            this.isMuted = false;
            this.previousVolume = num;
        } else {
            this.isMuted = true;
        }

        this.ensureAudioContext();

        const effectiveVol = this.isMuted ? 0 : this.volume;
        if (this.masterGain && this.ctx) {
            try {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.setValueAtTime(effectiveVol * 0.85, this.ctx.currentTime);
            } catch (e) {}
        }

        this.savePreferences();
        this.updateUi();

        // If user raised volume while stopped, auto-start playback
        if (num > 0 && !this.isPlaying) {
            this.start();
        }
    }

    stepVolume(delta) {
        let current = (this.isMuted || this.volume === 0) ? 0 : this.volume;
        let next = Math.round((current + delta) * 10) / 10;
        next = Math.max(0, Math.min(1, next));
        this.setVolume(next);

        if (typeof showToast === 'function') {
            showToast(`Volume: ${Math.round(this.volume * 100)}%`, 'gold');
        }
    }

    setVolumePercent(pct) {
        const num = Math.max(0, Math.min(1, pct / 100));
        this.setVolume(num);

        if (typeof showToast === 'function') {
            showToast(`Volume diatur ke ${pct}%`, 'gold');
        }
    }

    toggleMute() {
        this.ensureAudioContext();
        this.isMuted = !this.isMuted;

        if (this.isMuted) {
            this.previousVolume = this.volume > 0 ? this.volume : 0.5;
            if (this.masterGain && this.ctx) {
                try {
                    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
                } catch (e) {}
            }
            if (typeof showToast === 'function') {
                showToast('🔇 Suara Musik Dimatikan (Mute)', 'gold');
            }
        } else {
            this.volume = this.previousVolume > 0 ? this.previousVolume : 0.5;
            if (this.masterGain && this.ctx) {
                try {
                    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                    this.masterGain.gain.setValueAtTime(this.volume * 0.85, this.ctx.currentTime);
                } catch (e) {}
            }
            if (!this.isPlaying) {
                this.start();
            } else if (typeof showToast === 'function') {
                showToast(`🔊 Suara Musik Aktif: ${Math.round(this.volume * 100)}%`, 'gold');
            }
        }

        this.savePreferences();
        this.updateUi();
    }

    setTrack(trackKey) {
        if (!this.tracks[trackKey]) return;
        this.currentTrack = trackKey;
        this.chordIndex = 0;
        this.savePreferences();

        // Stop all active notes immediately to avoid clashing audio
        this.stopAllActiveNodes();
        if (this.noteTimer) {
            clearTimeout(this.noteTimer);
            this.noteTimer = null;
        }

        // Always update UI immediately so pill and select change immediately
        this.updateUi();

        // Start playing the new track immediately so user hears their choice
        if (!this.isPlaying) {
            this.start();
        } else {
            this.scheduleBar();
            if (typeof showToast === 'function') {
                showToast(`🎵 Nuansa Musik: "${this.tracks[trackKey].name}"`, 'gold');
            }
        }
    }

    updateUi() {
        const isSilent = this.isMuted || this.volume === 0;
        const displayVol = isSilent ? 0 : Math.round(this.volume * 100);
        const activePlaying = this.isPlaying && !isSilent;

        // 1. Play / Stop Buttons
        const dedicatedPlayBtn = document.getElementById('bgmDedicatedPlayBtn');
        const dedicatedStopBtn = document.getElementById('bgmDedicatedStopBtn');

        if (dedicatedPlayBtn) {
            if (this.isPlaying) {
                dedicatedPlayBtn.classList.remove('active-play');
                dedicatedPlayBtn.style.opacity = '0.55';
                dedicatedPlayBtn.title = "Musik sedang diputar";
            } else {
                dedicatedPlayBtn.classList.add('active-play');
                dedicatedPlayBtn.style.opacity = '1';
                dedicatedPlayBtn.title = "Nyalakan Musik Latar";
            }
        }

        if (dedicatedStopBtn) {
            if (this.isPlaying) {
                dedicatedStopBtn.style.opacity = '1';
                dedicatedStopBtn.classList.add('active-stop');
                dedicatedStopBtn.title = "Matikan Musik Seketika (Hening)";
            } else {
                dedicatedStopBtn.style.opacity = '0.55';
                dedicatedStopBtn.classList.remove('active-stop');
                dedicatedStopBtn.title = "Musik sudah mati";
            }
        }

        // 2. Navbar Toggle Button
        const navBtn = document.getElementById('navBgmToggleBtn');
        if (navBtn) {
            if (activePlaying) {
                navBtn.innerHTML = `<span>🎵</span> <span class="nav-bgm-wave">ılıllı</span> <span>Musik: ON (${displayVol}%)</span>`;
                navBtn.classList.add('active');
                navBtn.title = "Klik untuk mematikan musik latar";
            } else {
                navBtn.innerHTML = `<span>🔇</span> <span>Musik: OFF</span>`;
                navBtn.classList.remove('active');
                navBtn.title = "Klik untuk memutar musik latar";
            }
        }

        // 3. Mute Button & Icons
        const muteBtn = document.getElementById('bgmMuteBtn');
        const muteIcon = document.getElementById('bgmMuteIcon');

        if (muteIcon) {
            muteIcon.textContent = isSilent ? '🔇' : (this.volume < 0.35 ? '🔈' : (this.volume < 0.7 ? '🔉' : '🔊'));
        }
        if (muteBtn) {
            if (isSilent) {
                muteBtn.classList.add('muted');
                muteBtn.title = "Nyalakan Suara (Unmute)";
            } else {
                muteBtn.classList.remove('muted');
                muteBtn.title = "Matikan Suara (Mute)";
            }
        }

        // 4. Volume Slider & Percentage Label
        const slider = document.getElementById('bgmVolumeSlider');
        const label = document.getElementById('bgmVolumeLabel');
        const miniBadge = document.getElementById('bgmMiniVolumeBadge');

        if (slider) {
            slider.value = displayVol;
        }
        if (label) {
            label.textContent = `${displayVol}%`;
        }
        if (miniBadge) {
            miniBadge.textContent = `${displayVol}%`;
        }

        // 5. Volume Preset Buttons Active State
        document.querySelectorAll('.bgm-preset-btn').forEach(btn => {
            const p = parseInt(btn.getAttribute('data-pct'));
            if (!isNaN(p) && p === displayVol) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 6. Track Pills & Dropdown Selector
        const trackSelect = document.getElementById('bgmTrackSelect');
        if (trackSelect) {
            trackSelect.value = this.currentTrack;
        }

        document.querySelectorAll('.bgm-track-pill').forEach(pill => {
            const t = pill.getAttribute('data-track');
            if (t === this.currentTrack) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });

        // 7. Visualizer
        const visualizer = document.getElementById('bgmVisualizer');
        if (visualizer) {
            if (activePlaying) {
                visualizer.classList.add('animating');
            } else {
                visualizer.classList.remove('animating');
            }
        }

        // 8. Status Foot Text
        const statusText = document.getElementById('bgmStatusText');
        if (statusText) {
            if (this.isPlaying) {
                if (isSilent) {
                    statusText.textContent = '○ Musik sedang hening (Mute 0%)';
                    statusText.style.color = '#F87171';
                } else {
                    const tName = (this.tracks[this.currentTrack] || this.tracks.wedding).shortName;
                    statusText.textContent = `● Mengalun: ${tName} (${displayVol}%)`;
                    statusText.style.color = 'var(--color-available)';
                }
            } else {
                statusText.textContent = '○ Musik latar dalam kondisi mati';
                statusText.style.color = 'var(--text-muted)';
            }
        }
    }
}

// Instantiate globally
window.luxuryBgm = new LuxuryBgmEngine();

// UI Toggle between collapsed mini-pill and full audio panel
function toggleBgmWidgetExpand() {
    const widget = document.getElementById('bgmFloatingWidget');
    const btn = document.getElementById('bgmCollapseBtn');
    const miniBadge = document.getElementById('bgmMiniVolumeBadge');
    if (widget) {
        const isCollapsed = widget.classList.toggle('collapsed');
        if (btn) btn.textContent = isCollapsed ? '▲' : '—';
        if (miniBadge) miniBadge.style.display = isCollapsed ? 'inline-block' : 'none';
    }
}
window.toggleBgmWidgetExpand = toggleBgmWidgetExpand;

// Setup events when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.luxuryBgm.updateUi();

    const slider = document.getElementById('bgmVolumeSlider');
    if (slider) {
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) / 100;
            window.luxuryBgm.setVolume(val);
        });
        slider.addEventListener('change', (e) => {
            const val = parseFloat(e.target.value) / 100;
            window.luxuryBgm.setVolume(val);
        });
    }

    // Auto unlock AudioContext on first interaction
    const unlockAudio = () => {
        if (window.luxuryBgm && window.luxuryBgm.ctx && window.luxuryBgm.ctx.state === 'suspended') {
            window.luxuryBgm.ctx.resume();
        }
    };
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
});

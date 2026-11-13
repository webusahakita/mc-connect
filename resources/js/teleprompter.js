/**
 * MC-Connect Voice-Activated Teleprompter Engine
 * Features:
 * - Ultra-smooth 60fps variable-speed auto-scroller with requestAnimationFrame
 * - Reliable start/stop/toggle state synchronization
 * - Web Speech API voice tracking & speech-guided advance
 * - Dynamic font scaler with instant CSS override & localStorage persistence
 * - Mirror mode toggle
 */

class TeleprompterEngine {
    constructor() {
        this.viewport = null;
        this.textContainer = null;
        this.speed = 1.2;
        this.isScrolling = false;
        this.scrollAnimId = null;
        this.scrollInterval = null;
        this.scrollAccumulator = 0;
        
        // Restore saved font size or default to 36px
        let savedSize = 36;
        try {
            const stored = localStorage.getItem('mc_prompter_font_size');
            if (stored) savedSize = parseInt(stored, 10) || 36;
        } catch (e) {}
        this.fontSize = savedSize;

        this.isMirror = false;
        this.recognition = null;
        this.isVoiceActive = false;
        this.onScrollChange = null;
    }

    init(viewportId, textId) {
        this.viewport = document.getElementById(viewportId) || document.querySelector('.prompter-viewport');
        this.textContainer = document.getElementById(textId) || document.querySelector('.prompter-text');

        this.applyFontSize();
        this.setupSpeechRecognition();
    }

    applyFontSize() {
        if (!this.textContainer) {
            this.textContainer = document.getElementById('prompterTextContainer') || document.querySelector('.prompter-text');
        }

        if (this.textContainer) {
            this.textContainer.style.setProperty('font-size', `${this.fontSize}px`, 'important');
            this.textContainer.style.setProperty('line-height', '1.55', 'important');

            const scriptEl = document.getElementById('prompterActiveScript') || this.textContainer.querySelector('p');
            if (scriptEl) {
                scriptEl.style.setProperty('font-size', `${this.fontSize}px`, 'important');
                scriptEl.style.setProperty('line-height', '1.55', 'important');
            }

            // Also ensure all paragraph and block elements scale proportionally
            this.textContainer.querySelectorAll('p, div, span').forEach(el => {
                el.style.setProperty('font-size', `${this.fontSize}px`, 'important');
                el.style.setProperty('line-height', '1.55', 'important');
            });
        }
    }

    startScroll() {
        if (!this.viewport) {
            this.viewport = document.getElementById('prompterViewport') || document.querySelector('.prompter-viewport');
        }
        if (!this.viewport) return false;

        if (this.isScrolling) return true;

        const maxScroll = this.viewport.scrollHeight - this.viewport.clientHeight;
        // If already at or near bottom, rewind to top so it can scroll again
        if (maxScroll > 10 && this.viewport.scrollTop >= maxScroll - 5) {
            this.viewport.scrollTop = 0;
        }

        this.isScrolling = true;
        this.scrollAccumulator = this.viewport.scrollTop;

        if (typeof this.onScrollChange === 'function') {
            this.onScrollChange(true);
        }

        const raf = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame.bind(window)
            : (cb) => setTimeout(() => cb(performance.now()), 25);
        const caf = typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function'
            ? window.cancelAnimationFrame.bind(window)
            : clearTimeout;

        if (this.scrollAnimId) {
            caf(this.scrollAnimId);
            this.scrollAnimId = null;
        }

        let lastTime = performance.now();
        const scrollStep = (now) => {
            if (!this.isScrolling || !this.viewport) return;

            const delta = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;

            const currentMax = this.viewport.scrollHeight - this.viewport.clientHeight;
            if (currentMax > 5 && this.viewport.scrollTop >= currentMax - 2) {
                this.stopScroll();
                return;
            }

            // Scroll advance: default ~50px per second at speed 1.2
            this.scrollAccumulator += (this.speed * 42) * delta;
            this.viewport.scrollTop = this.scrollAccumulator;

            this.scrollAnimId = raf(scrollStep);
        };

        this.scrollAnimId = raf(scrollStep);
        return true;
    }

    stopScroll() {
        this.isScrolling = false;
        const caf = typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function'
            ? window.cancelAnimationFrame.bind(window)
            : clearTimeout;

        if (this.scrollAnimId) {
            caf(this.scrollAnimId);
            this.scrollAnimId = null;
        }
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
        if (typeof this.onScrollChange === 'function') {
            this.onScrollChange(false);
        }
        return false;
    }

    toggleScroll() {
        if (this.isScrolling) {
            return this.stopScroll();
        } else {
            return this.startScroll();
        }
    }

    setSpeed(newSpeed) {
        this.speed = parseFloat(newSpeed);
    }

    increaseFont() {
        if (this.fontSize < 84) {
            this.fontSize += 4;
            try { localStorage.setItem('mc_prompter_font_size', this.fontSize); } catch (e) {}
            this.applyFontSize();
            if (typeof window.showToast === 'function') {
                window.showToast('Ukuran Font: ' + this.fontSize + 'px', 'gold');
            }
        }
        return this.fontSize;
    }

    decreaseFont() {
        if (this.fontSize > 16) {
            this.fontSize -= 4;
            try { localStorage.setItem('mc_prompter_font_size', this.fontSize); } catch (e) {}
            this.applyFontSize();
            if (typeof window.showToast === 'function') {
                window.showToast('Ukuran Font: ' + this.fontSize + 'px', 'gold');
            }
        }
        return this.fontSize;
    }

    toggleMirror() {
        this.isMirror = !this.isMirror;
        if (this.viewport) {
            this.viewport.classList.toggle('mirror', this.isMirror);
        }
        return this.isMirror;
    }

    setupSpeechRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn('Speech Recognition API is not supported in this browser.');
            return;
        }

        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'id-ID';

        this.recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.toLowerCase();

            // When speech is recognized, advance prompter smoothly by 40px
            if (this.viewport) {
                this.viewport.scrollTop += 40;
                this.scrollAccumulator = this.viewport.scrollTop;
            }

            const indicator = document.getElementById('speechIndicator');
            if (indicator) {
                indicator.classList.add('active');
                setTimeout(() => indicator.classList.remove('active'), 1200);
            }
        };

        this.recognition.onerror = (err) => {
            console.warn('Speech recognition error:', err);
        };
    }

    toggleVoiceMode() {
        if (!this.recognition) {
            alert('Fitur Voice-Activated Prompter memerlukan peramban Google Chrome / Edge dengan izin mikrofon aktif.');
            return false;
        }

        if (this.isVoiceActive) {
            this.recognition.stop();
            this.isVoiceActive = false;
            return false;
        } else {
            try {
                this.recognition.start();
                this.isVoiceActive = true;
                return true;
            } catch (e) {
                console.error(e);
                return false;
            }
        }
    }
}

window.teleprompter = new TeleprompterEngine();

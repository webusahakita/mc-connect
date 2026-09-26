/**
 * MC-Connect Voice-Activated Teleprompter Engine
 * Features:
 * - Smooth variable-speed auto-scroller
 * - Web Speech API voice tracking & speech-guided advance
 * - Dynamic font scaler & Mirror mode toggle
 */

class TeleprompterEngine {
    constructor() {
        this.viewport = null;
        this.textContainer = null;
        this.speed = 1.2;
        this.isScrolling = false;
        this.scrollInterval = null;
        this.fontSize = 35; // px
        this.isMirror = false;
        this.recognition = null;
        this.isVoiceActive = false;
    }

    init(viewportId, textId) {
        this.viewport = document.getElementById(viewportId);
        this.textContainer = document.getElementById(textId);

        if (this.textContainer) {
            this.textContainer.style.fontSize = `${this.fontSize}px`;
        }

        this.setupSpeechRecognition();
    }

    startScroll() {
        if (this.isScrolling) return;
        this.isScrolling = true;
        this.scrollInterval = setInterval(() => {
            if (this.viewport) {
                this.viewport.scrollTop += this.speed;
                // Auto loop or stop at end
                if (this.viewport.scrollTop >= (this.viewport.scrollHeight - this.viewport.clientHeight)) {
                    this.stopScroll();
                }
            }
        }, 25);
    }

    stopScroll() {
        this.isScrolling = false;
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
    }

    toggleScroll() {
        if (this.isScrolling) {
            this.stopScroll();
            return false;
        } else {
            this.startScroll();
            return true;
        }
    }

    setSpeed(newSpeed) {
        this.speed = parseFloat(newSpeed);
    }

    increaseFont() {
        if (this.fontSize < 72) {
            this.fontSize += 4;
            if (this.textContainer) {
                this.textContainer.style.fontSize = `${this.fontSize}px`;
            }
        }
    }

    decreaseFont() {
        if (this.fontSize > 20) {
            this.fontSize -= 4;
            if (this.textContainer) {
                this.textContainer.style.fontSize = `${this.fontSize}px`;
            }
        }
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

            // When speech is recognized, advance prompter smoothly by 35px
            if (this.viewport) {
                this.viewport.scrollTop += 40;
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

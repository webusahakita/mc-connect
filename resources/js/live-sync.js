/**
 * MC-Connect Real-Time Live Sync Engine
 * Uses the HTML5 BroadcastChannel API for multi-window / multi-screen synchronization
 * Synchronizes MC Stage Mode with Vendor / Music Operator screens!
 */

class LiveSyncEngine {
    constructor(channelName = 'mc_connect_live_channel') {
        this.channelName = channelName;
        this.channel = null;
        this.listeners = [];

        if (typeof BroadcastChannel !== 'undefined') {
            this.channel = new BroadcastChannel(this.channelName);
            this.channel.onmessage = (event) => {
                this.notifyListeners(event.data);
            };
        } else {
            // Fallback via LocalStorage events
            window.addEventListener('storage', (e) => {
                if (e.key === this.channelName && e.newValue) {
                    try {
                        const data = JSON.parse(e.newValue);
                        this.notifyListeners(data);
                    } catch (err) {}
                }
            });
        }
    }

    broadcast(type, payload) {
        const message = {
            type,
            payload,
            timestamp: Date.now()
        };

        if (this.channel) {
            this.channel.postMessage(message);
        } else {
            localStorage.setItem(this.channelName, JSON.stringify(message));
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notifyListeners(data) {
        this.listeners.forEach(cb => {
            try {
                cb(data);
            } catch (e) {
                console.error('Error in live sync listener', e);
            }
        });
    }

    // High level helpers
    syncActiveSegment(eventId, segmentIndex, segmentTitle, musicCue) {
        this.broadcast('SEGMENT_CHANGE', {
            eventId,
            segmentIndex,
            segmentTitle,
            musicCue
        });
    }

    triggerSoundCue(soundName) {
        this.broadcast('TRIGGER_SFX', { soundName });
    }
}

window.liveSync = new LiveSyncEngine();

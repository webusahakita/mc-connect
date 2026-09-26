/**
 * MC-Connect Audio Storage Engine (IndexedDB + ObjectURL Caching)
 * Provides permanent, high-capacity client-side storage for uploaded
 * MP3, WAV, M4A, OGG, and AAC audio files. 100% works offline in gadget!
 */

class MCConnectAudioStorage {
    constructor() {
        this.dbName = 'MCConnectAudioDB';
        this.dbVersion = 1;
        this.storeName = 'audio_files';
        this.db = null;
        this.urlCache = new Map(); // id -> objectURL
        this.initPromise = this.initDB();
    }

    async initDB() {
        if (!window.indexedDB) {
            console.warn('[AudioStorage] IndexedDB not supported; falling back to in-memory/base64 cache.');
            return null;
        }

        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };

            request.onerror = (e) => {
                console.error('[AudioStorage] Error opening IndexedDB:', e);
                resolve(null);
            };
        });
    }

    // Save audio File/Blob to IndexedDB
    async saveAudioBlob(id, fileOrBlob, metadata = {}) {
        await this.initPromise;
        if (!id) id = 'audio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

        const record = {
            id: id,
            blob: fileOrBlob,
            name: metadata.name || fileOrBlob.name || 'audio_file',
            type: fileOrBlob.type || 'audio/mpeg',
            size: fileOrBlob.size || 0,
            updatedAt: Date.now()
        };

        // Cache object URL immediately for zero latency
        if (this.urlCache.has(id)) {
            try { URL.revokeObjectURL(this.urlCache.get(id)); } catch(e) {}
        }
        const objUrl = URL.createObjectURL(fileOrBlob);
        this.urlCache.set(id, objUrl);

        if (!this.db) {
            // Fallback: store data URL in localStorage if small (< 1MB)
            if (fileOrBlob.size < 1024 * 1024) {
                try {
                    const dataUrl = await this.fileToDataUrl(fileOrBlob);
                    localStorage.setItem(`ecc_audio_fallback_${id}`, dataUrl);
                } catch(e) {}
            }
            return { id, url: objUrl, name: record.name, size: record.size };
        }

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.put(record);

            req.onsuccess = () => {
                resolve({ id, url: objUrl, name: record.name, size: record.size });
            };

            req.onerror = (e) => {
                console.error('[AudioStorage] saveAudioBlob error:', e);
                resolve({ id, url: objUrl, name: record.name, size: record.size });
            };
        });
    }

    // Retrieve audio playable URL (ObjectURL or DataURL)
    async getAudioUrl(id) {
        if (!id) return null;

        // Check memory cache first
        if (this.urlCache.has(id)) {
            return this.urlCache.get(id);
        }

        await this.initPromise;
        if (!this.db) {
            const fallback = localStorage.getItem(`ecc_audio_fallback_${id}`);
            return fallback || null;
        }

        return new Promise((resolve) => {
            const tx = this.db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.get(id);

            req.onsuccess = () => {
                const res = req.result;
                if (res && res.blob) {
                    const objUrl = URL.createObjectURL(res.blob);
                    this.urlCache.set(id, objUrl);
                    resolve(objUrl);
                } else {
                    const fallback = localStorage.getItem(`ecc_audio_fallback_${id}`);
                    resolve(fallback || null);
                }
            };

            req.onerror = () => {
                resolve(null);
            };
        });
    }

    // Retrieve original Blob (useful for downloading or offline export)
    async getAudioBlob(id) {
        if (!id) return null;
        await this.initPromise;
        if (!this.db) return null;

        return new Promise((resolve) => {
            const tx = this.db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.get(id);

            req.onsuccess = () => {
                resolve(req.result ? req.result.blob : null);
            };

            req.onerror = () => {
                resolve(null);
            };
        });
    }

    // Delete audio record
    async deleteAudioBlob(id) {
        if (!id) return;
        if (this.urlCache.has(id)) {
            try { URL.revokeObjectURL(this.urlCache.get(id)); } catch(e) {}
            this.urlCache.delete(id);
        }
        try { localStorage.removeItem(`ecc_audio_fallback_${id}`); } catch(e) {}

        await this.initPromise;
        if (!this.db) return;

        return new Promise((resolve) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.delete(id);
            req.onsuccess = () => resolve(true);
            req.onerror = () => resolve(false);
        });
    }

    // Helper: Convert File/Blob to Base64 Data URL
    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Format file size helper
    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Global Singleton
window.audioStorage = new MCConnectAudioStorage();

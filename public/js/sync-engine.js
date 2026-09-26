/**
 * MC-Connect Sync Engine
 * Jembatan antara frontend dan backend Laravel (MySQL) tanpa cache localStorage statis.
 */

window.AdminDB = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { 
        this.data[key] = value; 
        
        // Panggil push otomatis setelah menyimpan state
        if (window._isSyncing) return;
        try {
            const parsed = JSON.parse(value);
            window._isSyncing = true;
            switch(key) {
                case 'mc_biodata_config':
                    SyncEngine.push('/api/cms/biodata', parsed);
                    break;
                case 'mc_packages_config':
                    SyncEngine.push('/api/cms/packages', { packages: parsed });
                    break;
                case 'mc_policies_config':
                    SyncEngine.push('/api/cms/policies', parsed);
                    break;
                case 'mc_payment_settings':
                    SyncEngine.push('/api/cms/payment-settings', parsed);
                    break;
                case 'mc_testimonials_config':
                    SyncEngine.push('/api/cms/testimonials', { testimonials: parsed });
                    break;
                case 'mc_presskit_v2':
                    SyncEngine.push('/api/cms/presskit', parsed);
                    break;
                case 'mc_gallery_config':
                    SyncEngine.push('/api/cms/gallery', { gallery: parsed });
                    break;
                case 'mc_cashflow_categories':
                    SyncEngine.push('/api/cms/cashflow-categories', { categories: parsed });
                    break;
            }
        } catch(e) {}
        window._isSyncing = false;
    },
    removeItem(key) { delete this.data[key]; }
};

window.SyncEngine = {
    async pullAll() {
        console.log('[Sync Engine] Menarik data dari database MySQL...');
        
        // Flush queue pertama kali sebelum tarik data agar server mendapat update terbaru!
        await this.flushOfflineQueue();
        
        try {
            // Ambil CSRF Token
            const tRes = await fetch('/api/csrf-token');
            const tData = await tRes.json();
            window.CSRF_TOKEN = tData.token;

            const endpoints = [
                { ep: '/api/cms/biodata', key: 'mc_biodata_config' },
                { ep: '/api/cms/gallery', key: 'mc_gallery_config' },
                { ep: '/api/cms/packages', key: 'mc_packages_config' },
                { ep: '/api/cms/policies', key: 'mc_policies_config' },
                { ep: '/api/cms/testimonials', key: 'mc_testimonials_config' },
                { ep: '/api/cms/presskit', key: 'mc_presskit_v2' },
                { ep: '/api/cms/riders', key: 'appRidersData' },
                { ep: '/api/cms/wardrobe-catalog', key: 'mc_wardrobe_catalog' },
                { ep: '/api/cms/cashflow-categories', key: 'mc_cashflow_categories' },
                { ep: '/api/cms/customers', key: 'mc_customers_db_v1' },
                { ep: '/api/cms/events', key: 'mc_events_db_v1' },
                { ep: '/api/cms/payment-settings', key: 'mc_payment_settings' }
            ];

            for (const item of endpoints) {
                try {
                    const res = await fetch(item.ep, { headers: { 'Accept': 'application/json' } });
                    if (!res.ok) continue;
                    const json = await res.json();
                    
                    if (json.success && json.data !== null) {
                        // For events: stamp _dbEventId so frontend can push updates back
                        if (item.key === 'mc_events_db_v1' && Array.isArray(json.data)) {
                            json.data = json.data.map(ev => ({
                                ...ev,
                                _dbEventId: ev.id, // Server DB ID for PUT/DELETE
                            }));
                        }
                        
                        // Disable sync trigger saat pulling
                        window._isSyncing = true;
                        AdminDB.setItem(item.key, JSON.stringify(json.data));
                        
                        // Compatibility aliases
                        if (item.key === 'mc_presskit_v2') {
                            AdminDB.setItem('mc_presskit_config', JSON.stringify({
                                title: json.data.stageName,
                                url: window.location.origin + '/storage/presskit.pdf',
                                note: json.data.ridersFooter
                            }));
                        }
                        window._isSyncing = false;
                    }
                } catch(e) {
                    console.warn(`[Sync] Failed endpoint ${item.ep}`);
                }
            }
            console.log('[Sync Engine] Tarikan data dari DB selesai.');
            setTimeout(() => {
                const loader = document.getElementById('globalAppLoader');
                if (loader) loader.classList.add('hidden');
            }, 500); // Give a little buffer for other async UI updates
        } catch(e) {
            console.error('[Sync Engine] Error:', e);
            setTimeout(() => {
                const loader = document.getElementById('globalAppLoader');
                if (loader) loader.classList.add('hidden');
            }, 1000);
        }
    },

    async push(endpoint, data) {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': window.CSRF_TOKEN || ''
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                this.addToOfflineQueue(endpoint, data);
                return { success: false, offline: true };
            }
            return await res.json();
        } catch(e) {
            console.warn('[Sync Push] Error:', e);
            this.addToOfflineQueue(endpoint, data);
            if (typeof window.showToast === 'function') {
                window.showToast('⚠️ Sedang offline. Perubahan disimpan di antrean lokal.', 'red');
            }
            return { success: false, offline: true };
        }
    },

    addToOfflineQueue(endpoint, data) {
        const queueRaw = localStorage.getItem('mc_offline_queue');
        let queue = [];
        if (queueRaw) {
            try { queue = JSON.parse(queueRaw); } catch(e) {}
        }
        
        // Hapus duplikat endpoint agar hanya data terbaru yang tersimpan
        queue = queue.filter(item => item.endpoint !== endpoint);
        
        queue.push({ endpoint, data, timestamp: new Date().getTime() });
        localStorage.setItem('mc_offline_queue', JSON.stringify(queue));
    },

    async flushOfflineQueue() {
        const queueRaw = localStorage.getItem('mc_offline_queue');
        if (!queueRaw) return;
        
        let queue = [];
        try { queue = JSON.parse(queueRaw); } catch(e) {}
        
        if (!Array.isArray(queue) || queue.length === 0) return;
        
        console.log(`[Sync Engine] Ditemukan ${queue.length} antrean offline. Mulai memproses sinkronisasi...`);
        let hasSuccess = false;
        let newQueue = [];
        
        for (const item of queue) {
            try {
                const res = await fetch(item.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': window.CSRF_TOKEN || ''
                    },
                    body: JSON.stringify(item.data)
                });
                
                if (res.ok) {
                    hasSuccess = true;
                } else {
                    newQueue.push(item);
                }
            } catch(e) {
                newQueue.push(item); // Gagal lagi (masih offline)
            }
        }
        
        if (newQueue.length === 0) {
            localStorage.removeItem('mc_offline_queue');
        } else {
            localStorage.setItem('mc_offline_queue', JSON.stringify(newQueue));
        }
        
        if (hasSuccess) {
            if (typeof window.showToast === 'function') {
                window.showToast('✅ Data offline berhasil disinkronkan ke server utama!', 'green');
            }
        }
    }
};

// Listener untuk otomatis sinkronisasi saat internet kembali menyala
window.addEventListener('online', () => {
    console.log('[Sync Engine] Internet terhubung kembali. Mencoba sinkronisasi antrean...');
    if (typeof window.SyncEngine.flushOfflineQueue === 'function') {
        window.SyncEngine.flushOfflineQueue();
    }
});

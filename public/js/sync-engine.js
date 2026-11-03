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
        console.log('[Sync Engine] Menarik data terpadu dari database...');
        await this.flushOfflineQueue();
        
        try {
            const res = await fetch('/api/cms/bootstrap', {
                headers: { 'Accept': 'application/json' }
            });
            
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    if (json.csrf_token) window.CSRF_TOKEN = json.csrf_token;
                    const d = json.data;

                    window._isSyncing = true;

                    // 1. Events
                    if (Array.isArray(d.events)) {
                        d.events = d.events.map(ev => ({
                            ...ev,
                            _dbEventId: ev.id,
                        }));
                    }
                    AdminDB.setItem('mc_events_db_v1', JSON.stringify(d.events || []));

                    // 2. Customers
                    AdminDB.setItem('mc_customers_db_v1', JSON.stringify(d.customers || []));

                    // 3. Configurations
                    AdminDB.setItem('mc_biodata_config', JSON.stringify(d.biodata || {}));
                    AdminDB.setItem('mc_gallery_config', JSON.stringify(d.gallery || []));
                    AdminDB.setItem('mc_packages_config', JSON.stringify(d.packages || []));
                    AdminDB.setItem('mc_policies_config', JSON.stringify(d.policies || {}));
                    AdminDB.setItem('mc_testimonials_config', JSON.stringify(d.testimonials || []));
                    AdminDB.setItem('mc_presskit_v2', JSON.stringify(d.presskit || {}));
                    AdminDB.setItem('appRidersData', JSON.stringify(d.riders || []));
                    AdminDB.setItem('mc_wardrobe_catalog', JSON.stringify(d.wardrobe_catalog || []));
                    AdminDB.setItem('mc_cashflow_categories', JSON.stringify(d.cashflow_categories || []));
                    AdminDB.setItem('mc_payment_settings', JSON.stringify(d.payment_settings || {}));
                    AdminDB.setItem('mc_music_bank_data', JSON.stringify(d.music_bank || []));

                    if (d.presskit) {
                        AdminDB.setItem('mc_presskit_config', JSON.stringify({
                            title: d.presskit.stageName,
                            url: window.location.origin + '/storage/presskit.pdf',
                            note: d.presskit.ridersFooter
                        }));
                    }

                    window._isSyncing = false;

                    // Set global runtime state
                    window.currentEventCategories = d.event_categories || [];
                    window.currentClientCategories = d.client_categories || [];
                    window.mcCustomers = d.customers || [];
                    window.adminEventsDb = d.events || [];
                    window.cmsConfig = window.cmsConfig || {};
                    window.cmsConfig.bio = d.biodata || {};
                    window.cmsConfig.eventCategories = d.event_categories || [];
                    window.cmsConfig.pkgs = d.packages || [];
                    window.cmsConfig.policies = d.policies || {};
                    window.cmsConfig.gallery = d.gallery || [];
                    window.cmsConfig.presskit = d.presskit || {};
                    window.cmsConfig.riders = d.riders || [];
                    window.cmsConfig.testimonials = d.testimonials || [];

                    console.log('[Sync Engine] Tarikan data terpadu selesai dalam 1 request.');
                    const loader = document.getElementById('globalAppLoader');
                    if (loader) loader.classList.add('hidden');
                    return;
                }
            }
            
            // Fallback
            console.warn('[Sync Engine] Bootstrap gagal, beralih ke fallback...');
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
                { ep: '/api/cms/payment-settings', key: 'mc_payment_settings' },
                { ep: '/api/cms/music-bank', key: 'mc_music_bank_data' }
            ];

            await Promise.all(endpoints.map(async item => {
                try {
                    const r = await fetch(item.ep, { headers: { 'Accept': 'application/json' } });
                    if (!r.ok) return;
                    const j = await r.json();
                    if (j.success && j.data !== null) {
                        if (item.key === 'mc_events_db_v1' && Array.isArray(j.data)) {
                            j.data = j.data.map(ev => ({ ...ev, _dbEventId: ev.id }));
                        }
                        window._isSyncing = true;
                        AdminDB.setItem(item.key, JSON.stringify(j.data));
                        window._isSyncing = false;
                    }
                } catch (e) {}
            }));

            const loader = document.getElementById('globalAppLoader');
            if (loader) loader.classList.add('hidden');
        } catch(e) {
            console.error('[Sync Engine] Error:', e);
            const loader = document.getElementById('globalAppLoader');
            if (loader) loader.classList.add('hidden');
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
                if (res.status >= 500) this.addToOfflineQueue(endpoint, data);
                return { success: false, offline: res.status >= 500, status: res.status };
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
        const ownerId = window.MCSession?.user?.id;
        if (!ownerId) return;
        const queueRaw = localStorage.getItem('mc_offline_queue');
        let queue = [];
        if (queueRaw) {
            try { queue = JSON.parse(queueRaw); } catch(e) {}
        }
        
        // Hapus duplikat endpoint agar hanya data terbaru yang tersimpan
        queue = queue.filter(item => item.endpoint !== endpoint || item.ownerId !== ownerId);
        
        queue.push({ endpoint, data, ownerId, timestamp: new Date().getTime() });
        localStorage.setItem('mc_offline_queue', JSON.stringify(queue));
    },

    async flushOfflineQueue() {
        if (window.MCSession) await window.MCSession.ready;
        const ownerId = window.MCSession?.user?.id;
        if (!ownerId) return;
        const queueRaw = localStorage.getItem('mc_offline_queue');
        if (!queueRaw) return;
        
        let queue = [];
        try { queue = JSON.parse(queueRaw); } catch(e) {}
        
        if (!Array.isArray(queue) || queue.length === 0) return;
        
        console.log(`[Sync Engine] Ditemukan ${queue.length} antrean offline. Mulai memproses sinkronisasi...`);
        let hasSuccess = false;
        let newQueue = [];
        
        for (const item of queue) {
            // Keep older/unowned entries, but never replay another account's changes.
            if (item.ownerId !== ownerId) {
                newQueue.push(item);
                continue;
            }
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

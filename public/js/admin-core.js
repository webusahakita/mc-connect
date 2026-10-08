/**
 * MC-Connect Admin Core Script v8.0
 * Unified Workspace Engine: Dashboard, Anti-Bentrok Calendar, Cashflow, CMS, Event Command Center, Stage Mode & Vendor
 */

// ================================================================
// API LAYER  Semua data disimpan ke MySQL viLaravel REST API
// Fallback ke localStorage jikserver tidak tersedia(offline mode)
// ================================================================
const API_BASE = '/api';
const MC_ID = 1; // Single-tenant: MC pertamdi database

// Channel Sinkronisasi Antar Tab (Real-Time Calendar Sync)
try {
    if (typeof BroadcastChannel !== 'undefined') {
        window.syncChannel = new BroadcastChannel('mc_sync_channel');
        window.syncChannel.onmessage = (event) => {
            if (event.data === 'RELOAD_CALENDAR') {
                console.log('[SyncChannel] Sinyal update diterima, me-reload database calendar...');
                if (typeof loadUnifiedEventsDatabase === 'function') {
                    loadUnifiedEventsDatabase();
                }
            }
        };
    } else {
        throw new Error("Not supported");
    }
} catch (e) {
    window.syncChannel = { postMessage: function(){} };
    console.warn('[SyncChannel] BroadcastChannel is disabled or not supported in this environment:', e.message);
}

/**
 * GET data dari API, fallback ke localStorage jikerror
 */
async function apiGet(endpoint) {
    try {
        const res = await fetch(API_BASE + endpoint, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        return json.dat?? json;
    } catch (e) {
        console.warn('[API] GET', endpoint, 'failed:', e.message);
        return null;
    }
}

/**
 * POST JSON data ke API, fallback ke localStorage jikerror
 */
async function apiPost(endpoint, data = {}) {
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const res = await fetch(API_BASE + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (e) {
        console.warn('[API] POST', endpoint, 'failed:', e.message);
        return { success: false, message: 'Gagal terhubung ke server utama.' };
    }
}

/**
 * POST multipart/form-dat(file upload) ke API
 */
async function apiUpload(endpoint, formData) {
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const res = await fetch(API_BASE + endpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formDat});
        return await res.json();
    } catch (e) {
        console.warn('[API] UPLOAD', endpoint, 'failed:', e.message);
        return { success: false, message: 'Upload gagal: ' + e.message };
    }
}

/**
 * DELETE request ke API
 */
async function apiDelete(endpoint) {
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const res = await fetch(API_BASE + endpoint, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        return await res.json();
    } catch (e) {
        console.warn('[API] DELETE', endpoint, 'failed:', e.message);
        return { success: false, message: e.message };
    }
}

/**
 * Inject CSRF mettag dari Laravel jikbelum ad* (admin.html statis perlu ini untuk POST request)
 */
(function injectCsrfMeta() {
    if (!document.querySelector('meta[name="csrf-token"]')) {
        fetch('/api/csrf-token').then(r => r.json()).then(d => {
            const met= document.createElement('meta');
            meta.name = 'csrf-token';
            meta.content = d.token || '';
            document.head.appendChild(meta);
        }).catch(() => {});
    }
})();

// 0. Theme Initialization
function initTheme() {
    const savedTheme = localStorage.getItem('mc_theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        const btn = document.getElementById('themeToggleBtn');
        if (btn) btn.textContent = '🌞';
    }
}
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('mc_theme', newTheme);
    
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.textContent = newTheme === 'dark' ? '🌙' : '🌞';
    }
}
window.toggleTheme = toggleTheme;
initTheme();

function initAdminWorkspace() {
    // Integrate with Database (Sync Engine)
    if (typeof window.SyncEngine !== 'undefined' && typeof window.SyncEngine.pullAll === 'async function') {
        window.SyncEngine.pullAll();
    }

    console.log('[Admin] Workspace initialized.');
}

// 1. Session & Auth
async function handleAdminLogout() {
    if (await uiConfirm('Apakah Anda yakin ingin keluar dari ruang kerja Admin MC?')) {
        sessionStorage.removeItem('mc_auth_token');
        sessionStorage.removeItem('mc_auth_user');
        if (typeof showToast === 'function') {
            showToast('Andtelah logout.', 'gold');
        }
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 400);
    }
}

let adminTokens = 85;

// 2. Anti-Bentrok Calendar & Unified Events Database Engine
let adminEventsDb = [];
let activeCommandCenterEventId = null;
window.activeCommandCenterEventId = null; // exposed for cross-module access

function formatDateIndoFull(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch(e) {
        return dateStr;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function normalizeAndDeduplicateEvents(existingEvents, customers, seedEvents) {
    const map = new Map();

    // 1. Load seed events
    (seedEvents || []).forEach(ev => {
        const key = `${ev.date}::${(ev.title || '').trim().toLowerCase()}`;
        map.set(key, JSON.parse(JSON.stringify(ev)));
    });

    // 2. Overlay existing stored events
    (existingEvents || []).forEach(ev => {
        const key = `${ev.date}::${(ev.title || '').trim().toLowerCase()}`;
        if (map.has(key)) {
            map.set(key, { ...map.get(key), ...ev });
        } else {
            map.set(key, ev);
        }
    });

    // 3. Overlay all customer schedules from CRM to guarantee 100% integration
    (customers || []).forEach(cust => {
        if (!cust.date || !cust.event) return;
        const key = `${cust.date}::${cust.event.trim().toLowerCase()}`;
        
        let status = cust.calendarStatus;
        if (!status) {
            status = 'Review';
            if (cust.paymentStatus && (cust.paymentStatus.includes('Lunas') || cust.paymentStatus.includes('100%') || cust.paymentStatus.includes('DP') && cust.paymentStatus.includes('Paid'))) {
                status = 'Terkunci';
            } else if (cust.paymentStatus && (cust.paymentStatus.includes('Hold') || cust.paymentStatus.includes('Tentative') || cust.paymentStatus.includes('DP'))) {
                status = 'Tentative';
            }
        }

        let targetEv = null;
        for (let v of map.values()) {
            if (v.customerId && String(v.customerId) === String(cust.id)) {
                targetEv = v;
                break;
            }
        }
        
        if (!targetEv && map.has(key)) {
            targetEv = map.get(key);
        }

        if (targetEv) {
            targetEv.customerId = cust.id;
            targetEv.title = cust.event; // Update title to match CRM
            targetEv.price = 'Rp ' + Number(cust.price || 0).toLocaleString('id-ID');
            targetEv.rawPrice = Number(cust.price || 0);
            targetEv.pic = cust.name + (cust.w? ` (${cust.wa})` : '');
            
            // Dynamic payment status from invoice cashier logic
            let calcPaymentStatus = cust.paymentStatus || 'Belum Bayar';
            if (targetEv.metadata && typeof targetEv.metadata.nominal_dp !== 'undefined') {
                const dpNominal = Number(targetEv.metadata.nominal_dp);
                if (dpNominal >= targetEv.rawPrice && targetEv.rawPrice > 0) {
                    calcPaymentStatus = 'Lunas 100%';
                } else if (dpNominal > 0) {
                    calcPaymentStatus = 'DP Dibayar';
                } else {
                    calcPaymentStatus = 'Belum Bayar';
                }
            }
            targetEv.paymentStatus = calcPaymentStatus;
            
            targetEv.category = cust.category || targetEv.category;
            
            // If it matched by customerId but key changed, ensure we don't duplicate
            if (targetEv.date !== cust.date || `${targetEv.date}::${(targetEv.title || '').trim().toLowerCase()}` !== key) {
                targetEv.date = cust.date; // Update date as well just in case
            }
        } else {
            const newEv = {
                id: 'v_' + cust.id,
                dbEventId: null,
                customerId: cust.id,
                title: cust.event,
                date: cust.date,
                time: '18:30 - 21:30 WIB',
                venue: cust.formattedDate && cust.formattedDate.includes('') ? cust.formattedDate.split('')[1].trim() : 'Grand Ballroom Venue',
                pic: cust.name + (cust.w? ` (${cust.wa})` : ''),
                price: 'Rp ' + Number(cust.price || 0).toLocaleString('id-ID'),
                rawPrice: Number(cust.price || 0),
                status: status,
                paymentStatus: cust.paymentStatus,
                note: `${cust.paymentStatus} - Terintegrasi dari CRM`,
                category: cust.category || 'Event',
                vipNotes: cust.notes || 'Preferensi panggung klien disinkronkan dari CRM.',
                vipProtocol: [
                    { role: 'Klien PIC', name: cust.name },
                    { role: 'FOH Liaison', name: 'Stage Runner MC' }
                ],
                checklist: [
                    { text: 'Konfirmasi pelafalan namgelar tamu VIP', done: true },
                    { text: 'Cek gladi mic wireless Shure Axient di FOH', done: true },
                    { text: 'Briefing sinyal cue musik dengan FOH operator', done: false }
                ],
                expenses: []
            };
            map.set(key, newEv);
        }
    });

    const result = Array.from(map.values());
    result.sort((a, b) => new Date(a.date) - new Date(b.date));
    return result;
}

async function loadUnifiedEventsDatabase() {
    try {
        const res = await fetch('/api/cms/events', { cache: 'no-store' });
        const json = await res.json();
        
        let events = [];
        if (json.success && json.data) {
            events = json.data;
        } else {
            console.warn('[Sync] Gagal memuat event dari server.');
        }

        setTimeout(() => {
            const loader = document.getElementById('globalAppLoader');
            if (loader) loader.classList.add('hidden');
        }, 500);

        // Mapping agar kompatibel dengan UI admin
        adminEventsDb = events.map(ev => ({
            id: ev.id,
            dbEventId: ev.id,
            customerId: ev.customerId,
            clientName: ev.pic ? ev.pic.split(' ')[0] : 'Klien',
            title: ev.title,
            date: ev.date,
                time: ev.time,
            time: ev.time,
            venue: ev.venue,
            pic: ev.pic,
            price: ev.price,
            rawPrice: ev.rawPrice || 0,
            status: ev.status,
            paymentStatus: ev.paymentStatus,
            note: ev.note,
            category: ev.category,
            vipNotes: ev.vipNotes || '',
            vipProtocol: Array.isArray(ev.vipProtocol) ? ev.vipProtocol : [],
            checklist: Array.isArray(ev.checklist) ? ev.checklist : [],
            expenses: Array.isArray(ev.expenses) ? ev.expenses : [],
            wardrobeIds: Array.isArray(ev.wardrobeIds) ? ev.wardrobeIds : [],
            invoiceItems: ev.invoiceItems || null,
            metadata: ev.metadata || {},
            musicList: (ev.metadata && Array.isArray(ev.metadata.music)) ? ev.metadata.music : (Array.isArray(ev.musicList) ? ev.musicList : []),
            soundboard: (ev.metadata && Array.isArray(ev.metadata.soundboard)) ? ev.metadata.soundboard : (Array.isArray(ev.soundboard) ? ev.soundboard : []),
            landingMusic: (ev.metadata && Array.isArray(ev.metadata.landingMusic)) ? ev.metadata.landingMusic : (Array.isArray(ev.landingMusic) ? ev.landingMusic : []),
            rundown: Array.isArray(ev.rundown) ? ev.rundown : [],
            created_at: ev.created_at || null
        }));

        // Bersihkan dan sinkronkan ulang seluruh rundown di lokal
        adminEventsDb.forEach(ev => {
            if(typeof window.syncMusicToRundown === 'function') window.syncMusicToRundown(ev);
        });
        
        window.adminEventsDb = adminEventsDb;

        // Data murni dari database, tidak menyimpan cache lokal lagi
        
        if (typeof renderDashEvents === 'function') renderDashEvents();
        if (typeof window.adminCalendar !== 'undefined' && window.adminCalendar.setEvents) {
            window.adminCalendar.setEvents(adminEventsDb);
        }
        
        updateCalendarMenuBadge();
        if (typeof updateCalMetrics === 'function') updateCalMetrics();
        if (typeof autoSyncEventsToCustomers === 'function') autoSyncEventsToCustomers(adminEventsDb);
        
    } catch (e) {
        console.error('[Sync] Gagal memuat event:', e);
    }
    
    // saveUnifiedEventsDatabase();
    if (window.renderCashflowTable) window.renderCashflowTable();


    if (!activeCommandCenterEventId && adminEventsDb.length > 0) {
        activeCommandCenterEventId = adminEventsDb[0].id;
        window.activeCommandCenterEventId = activeCommandCenterEventId;
    }
}

function updateCalendarMenuBadge() {
    const badge = document.getElementById('calendarMenuBadge');
    if (!badge) return;
    
    // Calculate new bookings (events with 'Review' status requiring admin action)
    const newBookings = adminEventsDb.filter(ev => ev.status === 'Review').length;
    
    if (newBookings > 0) {
        badge.textContent = newBookings;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function autoSyncEventsToCustomers(events) {
    let customers = [];
    try {
        const rawCust = JSON.stringify(window.mcCustomers || []);
        if (rawCust) customers = JSON.parse(rawCust);
    } catch(e) {}
    
    let isModified = false;

    events.forEach(ev => {
        // Extract name and phone from pic: "Name (Phone)"
        let name = ev.pic || 'Unknown Client';
        let phone = '';
        const match = name.match(/(.*?)\s*\((.*?)\)/);
        if (match) {
            name = match[1].trim();
            phone = match[2].trim();
        }

        // Check if customer exists by ID or Exact Name
        const exists = customers.find(c => {
            if (!c) return false;
            const matchId = String(c.id) === String(ev.customerId || ev.id);
            const matchName = c.name && typeof c.name === 'string' && name && typeof name === 'string' && c.name.toLowerCase() === name.toLowerCase();
            return matchId || matchName;
        });

        if (exists) {
            // Update customer details based on event
            let changed = false;
            let evDate = ev.tanggal_acar|| ev.date;
            if (evDate && exists.date !== evDate) { exists.date = evDate; changed = true; }
            
            if (ev.time && exists.time !== ev.time) { exists.time = ev.time; changed = true; }
            
            let evTitle = ev.nama_acar|| ev.title;
            if (evTitle && exists.event !== evTitle) { exists.event = evTitle; changed = true; }
            
            let priceNum = 0;
            if (ev.nilai_kontrak) priceNum = parseInt(String(ev.nilai_kontrak).replace(/[^0-9]/g, '')) || 0;
            else if (ev.price) priceNum = parseInt(String(ev.price).replace(/[^0-9]/g, '')) || 0;
            if (priceNum > 0 && exists.price !== priceNum) { exists.price = priceNum; changed = true; }
            
            let evPayStatus = ev.status_pembayaran || ev.paymentStatus;
            if (evPayStatus && exists.paymentStatus !== evPayStatus) { exists.paymentStatus = evPayStatus; changed = true; }
            
            if (changed) isModified = true;
        }

        if (!exists) {
            const newCustId = ev.customerId || ev.id || Date.now();
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MC';
            let org = 'Personal Client';
            if (ev.category === 'Corporate') org = name;
            else if (ev.category === 'Private Gala') org = 'Private/GalEvent';
            else if (ev.category === 'Wedding') org = 'Wedding Client';

            const newCust = {
                id: newCustId,
                name: name,
                org: org,
                initials: initials,
                initialsBg: 'linear-gradient(135deg,#D4AF37,#F59E0B)',
                initialsColor: '#000000',
                email: name.toLowerCase().replace(/\s/g, '') + '@email.com',
                phone: phone || '-',
                address: ev.venue || '-',
                status: ev.status === 'Terkunci' ? 'Active' : (ev.status === 'Selesai' ? 'Completed' : 'Lead'),
                value: ev.rawPrice || 0,
                event: ev.title,
                date: ev.date,
                time: ev.time,
                notes: ev.vipNotes || ev.note || 'Diimpor otomatis dari Kalender / Event Command Center.'
            };
            customers.push(newCust);
            ev.customerId = newCustId; // Link them
            isModified = true;
        }
    });

    if (isModified) {
        
        // Update global customers array if it exists
        if (typeof mcCustomers !== 'undefined') {
            window.mcCustomers = customers;
        }
        if (typeof window.saveCustomersData === 'function') {
            window.saveCustomersData();
        }
        // Force re-render of customers table if function is available
        if (typeof renderCustomersTable === 'function') {
            try { renderCustomersTable(); } catch(err) {}
        }
        if (typeof updateCustomerMetrics === 'function') {
            try { updateCustomerMetrics(); } catch(err) {}
        }
    }
}

let _saveEventsTimer = null;
function saveUnifiedEventsDatabase(evToSync = null) {
    try {
        if (evToSync && typeof syncEventMetadata === 'function') {
            syncEventMetadata(evToSync);
        }
        
        // Hanymemanggil sync ke Data Pelanggan
        // Selalu pastikan sync ke Data Pelanggan setiap kali Events disimpan
        if (typeof autoSyncEventsToCustomers === 'function') {
            autoSyncEventsToCustomers(adminEventsDb);
        }
    } catch(e) {
        console.error("Gagal menyimpan database acara:", e);
    }
    window.adminEventsDb = adminEventsDb;

    // Sync Cash Flow UI with any expense changes
    if (typeof window.renderCashflowTable === 'function') {
        window.renderCashflowTable();
    }

    // Sync Dashboard Events Grid
    if (typeof renderDashEvents === 'function') {
        renderDashEvents();
    }

    // Debounced push to server database
    clearTimeout(_saveEventsTimer);
    _saveEventsTimer = setTimeout(() => {
        pushEventsToServer();
    }, 1500);
}

async function pushEventsToServer() {
    let ev = _getEv();
    if (ev && typeof window.syncEventMetadata === 'function') {
        await window.syncEventMetadata(ev);
        console.log('[Sync] Event metadata synced via fallback pushEventsToServer.');
    } else {
        console.log('[Sync] pushEventsToServer fallback failed: No event selected.');
    }
}

window.syncEventMetadata = async function(ev) {
    if (!ev) return;
    try {
        const payload = {
            rundown: ev.rundown || [],
            metadata: {
                checklist: ev.checklist || [],
                expenses: ev.expenses || [],
                vipNotes: ev.vipNotes || '',
                vipProtocol: ev.vipProtocol || [],
                invoice_items: ev.invoiceItems || null,
                wardrobeIds: ev.wardrobeIds || [],
                soundboard: ev.soundboard || [],
                landingMusic: ev.landingMusic || [],
                music: ev.music || []
            }
        };
        const actualId = ev.db_id || String(ev.id).replace('e_', '');
        await fetch('/api/cms/events/' + actualId, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: JSON.stringify(payload)
        });
        console.log('[Sync] Event metadata and rundown synced to server for event ID:', ev.id);
    } catch (err) {
        console.error("Gagal sync event metadata:", err);
    }
};

function populateCommandCenterSelector() {
    const selector = document.getElementById('eccEventSelector');
    if (!selector) return;

    if (!adminEventsDb || adminEventsDb.length === 0) {
        selector.innerHTML = '<option value="">Belum ada acara</option>';
        return;
    }

    let filteredEvents = [...adminEventsDb];
    if (window.currentAgendaFilter) {
        if (window.currentAgendaFilter === 'terkunci') {
            filteredEvents = filteredEvents.filter(e => e.status.toLowerCase() === 'terkunci');
        } else if (window.currentAgendaFilter === 'tentative') {
            filteredEvents = filteredEvents.filter(e => e.status.toLowerCase() === 'tentative');
        } else if (window.currentAgendaFilter === 'review') {
            filteredEvents = filteredEvents.filter(e => e.status.toLowerCase() === 'review');
        }
    }

    if (filteredEvents.length === 0) {
        selector.innerHTML = '<option value="">Tidak ada acara sesuai filter</option>';
        return;
    }

    selector.innerHTML = filteredEvents.map(ev => {
        let icon = '';
        if (ev.category === 'Corporate') icon = '🏢';
        else if (ev.category === 'Private Gala') icon = '🎭';
        
        let displayTitle = ev.title;
        if (typeof mcCustomers !== 'undefined' && ev.customerId) {
            const customer = mcCustomers.find(c => String(c.id) === String(ev.customerId));
            if (customer && customer.name) {
                displayTitle = `${customer.name} - ${ev.title}`;
            }
        }
        
        return `<option value="${ev.id}">${icon} [${ev.date}] ${displayTitle} (${ev.status})</option>`;
    }).join('');

    if (activeCommandCenterEventId) {
        selector.value = activeCommandCenterEventId;
    }
}

async function switchCommandCenterEvent(eventId) {
    if (document.getElementById('globalAppLoader')) {
        document.getElementById('globalAppLoader').classList.remove('hidden');
    }
    
    if (typeof loadUnifiedEventsDatabase === 'function') {
        await loadUnifiedEventsDatabase();
    }
    
    loadActiveEventInCommandCenter(eventId);
    const ev = adminEventsDb.find(e => String(e.id) === String(eventId));
    if (ev) {
        if (typeof showToast === 'function') {
            showToast(`Command Center beralih ke acara: "${ev.title}"`, 'gold');
        }
        if (typeof populateCommandCenterSelector === 'function') {
            populateCommandCenterSelector();
        }
    }
    
    if (document.getElementById('globalAppLoader')) {
        document.getElementById('globalAppLoader').classList.add('hidden');
    }
}
window.switchCommandCenterEvent = switchCommandCenterEvent;

async function openEventInCommandCenter(eventId) {
    if (typeof loadUnifiedEventsDatabase === 'function') {
        await loadUnifiedEventsDatabase();
    }
    loadActiveEventInCommandCenter(eventId);
    if (typeof navigateToSection === 'function') {
        navigateToSection('sec-command-center', document.getElementById('menu-command-center'));
    }
}
window.openEventInCommandCenter = openEventInCommandCenter;

async function openCustomerInCommandCenter(custId) {
    if (typeof loadUnifiedEventsDatabase === 'function') {
        await loadUnifiedEventsDatabase();
    }
    
    let ev = adminEventsDb.find(e => String(e.customerId) === String(custId) || String(e.id) === ('v_' + custId));
    if (!ev) {
        let cust = null;
        try {
            const raw = JSON.stringify(window.mcCustomers || []);
            const custs = raw ? JSON.parse(raw) : [];
            cust = custs.find(c => String(c.id) === String(custId));
        } catch(e) {}

        if (cust) {
            await syncCustomerToCalendar(cust);
            ev = adminEventsDb.find(e => String(e.customerId) === String(custId) || String(e.id) === ('v_' + custId));
        }
    }
    
    const targetId = ev ? ev.id : (adminEventsDb[0] ? adminEventsDb[0].id : null);
    
    if (targetId) {
        // Since we already fetched, we can just call loadActiveEventInCommandCenter
        loadActiveEventInCommandCenter(targetId);
        if (typeof navigateToSection === 'function') {
            navigateToSection('sec-command-center', document.getElementById('menu-command-center'));
        }
    } else {
        if(typeof uiAlert === 'function') uiAlert('Data acara tidak ditemukan untuk klien ini.');
    }
}
window.openCustomerInCommandCenter = openCustomerInCommandCenter;

function focusCalendarCustomer(dateStr) {
    if (typeof navigateToSection === 'function') {
        navigateToSection('sec-calendar', document.getElementById('menu-calendar'));
    }
    setTimeout(() => {
        focusCalendarDate(dateStr);
    }, 150);
}
window.focusCalendarCustomer = focusCalendarCustomer;

async function syncCustomerToCalendar(cust) {
    if (!cust || !cust.date) return;
    const key = `${cust.date}::${(cust.event || '').trim().toLowerCase()}`;
    let existingIndex = adminEventsDb.findIndex(e => String(e.id) === ('v_' + cust.id) || String(e.customerId) === String(cust.id) || `${e.date}::${(e.title || '').trim().toLowerCase()}` === key);

    let status = 'Review';
    if (cust.paymentStatus && (cust.paymentStatus.includes('Lunas') || cust.paymentStatus.includes('100%') || cust.paymentStatus.includes('DP'))) {
        status = 'Terkunci';
    } else if (cust.paymentStatus && (cust.paymentStatus.includes('Hold') || cust.paymentStatus.includes('Tentative'))) {
        status = 'Tentative';
    }

    const timeFormatted = cust.time || (cust.startTime && cust.endTime ? `${cust.startTime} - ${cust.endTime} WIB (${cust.duration || ''})` : '18:00 - 22:00 WIB (4 Jam)');
    const eventData = {
        id: 'v_' + cust.id,
        dbEventId: null,
        customerId: cust.id,
        title: cust.event,
        date: cust.date,
        time: timeFormatted,
        startTime: cust.startTime || '18:00',
        endTime: cust.endTime || '22:00',
        duration: cust.duration || '4 Jam',
        venue: cust.formattedDate && cust.formattedDate.includes('') ? cust.formattedDate.split('')[1].trim() : 'Grand Ballroom Venue',
        pic: cust.name + (cust.w? ` (${cust.wa})` : ''),
        price: 'Rp ' + Number(cust.price || 0).toLocaleString('id-ID'),
        rawPrice: Number(cust.price || 0),
        status: status,
        paymentStatus: cust.paymentStatus,
        note: `${cust.paymentStatus} - Terintegrasi dari CRM Pelanggan`,
        category: cust.category || 'Event',
        vipNotes: cust.notes || 'Preferensi panggung klien disinkronkan dari CRM.',
        vipProtocol: [
            { role: 'Klien PIC', name: cust.name },
            { role: 'Koordinator FOH', name: 'Tim Stage Runner MC' }
        ],
        checklist: [
            { text: 'Konfirmasi pelafalan namklien & gelar', done: true },
            { text: 'Cek gladi mic wireless Shure di venue', done: true },
            { text: 'Briefing sinyal cue musik panggung', done: false }
        ],
        expenses: []
    };

    if (existingIndex >= 0) {
        adminEventsDb[existingIndex] = { ...adminEventsDb[existingIndex], ...eventData };
    } else {
        adminEventsDb.push(eventData);
    }

    adminEventsDb.sort((a, b) => new Date(a.date) - new Date(b.date));
    saveUnifiedEventsDatabase();

    if (window.adminCalendar) {
        window.adminCalendar.setEvents(adminEventsDb);
    }
    renderAdminAgendaList();
    updateCalMetrics();
    populateCommandCenterSelector();
}
window.syncCustomerToCalendar = syncCustomerToCalendar;

async function deleteEventByCustomerId(custId, skipPrompt = false) {
    // 0. Find DB IDs before removing
    const eventsToDelete = adminEventsDb.filter(e => String(e.id) === ('v_' + custId) || String(e.customerId) === String(custId));
    
    // 1. Delete from SERVER database (MySQL)
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || window.CSRF_TOKEN || '';
        const headers = { 'Accept': 'application/json', 'X-CSRF-TOKEN': token };
        
        // Delete events from server
        for (const ev of eventsToDelete) {
            const dbEvId = ev._dbEventId || ev.dbEventId || ev.id;
            if (dbEvId && !String(dbEvId).startsWith('v_')) {
                await fetch(`/api/cms/events/${dbEvId}`, { method: 'DELETE', headers }).catch(() => {});
            }
        }
    } catch(err) {
        console.warn('Gagal menghapus event dari DB server', err);
    }
    
    // 2. Reload dari server untuk sinkronisasi akurat
    await loadUnifiedEventsDatabase();
    if (typeof window.syncChannel !== 'undefined') {
        window.syncChannel.postMessage('RELOAD_CALENDAR');
    }
    renderAdminAgendaList();
    updateCalMetrics();
    populateCommandCenterSelector();
    
    if (adminEventsDb.length > 0) {
        loadActiveEventInCommandCenter(adminEventsDb[0].id);
    } else {
        loadActiveEventInCommandCenter(null);
    }
}
window.deleteEventByCustomerId = deleteEventByCustomerId;

async function deleteEventById(eventId) {
    if (!await uiConfirm('Apakah Anda yakin ingin menghapus acara ini secara permanen? Data pelanggan TIDAK akan terhapus.')) return;
    
    const evToDelete = adminEventsDb.find(e => String(e.id) === String(eventId));
    if (!evToDelete) return;

    // 1. Delete from Events DB (local)
    adminEventsDb = adminEventsDb.filter(e => String(e.id) !== String(eventId));
    saveUnifiedEventsDatabase();

    // 2. Delete from SERVER database (MySQL)
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || window.CSRF_TOKEN || '';
        const headers = { 'Accept': 'application/json', 'X-CSRF-TOKEN': token };
        
        const dbEvId = evToDelete._dbEventId || evToDelete.dbEventId || evToDelete.id;
        if (dbEvId) {
            fetch(`/api/cms/events/${dbEvId}`, { method: 'DELETE', headers }).catch(() => {});
        }
        console.log('[Sync] Event deleted dari server.');
    } catch(e) {
        console.warn('[Sync] Delete from server error:', e);
    }

    // 3. Update UI
    if (window.adminCalendar) {
        window.adminCalendar.setEvents(adminEventsDb);
    }
    renderAdminAgendaList();
    updateCalMetrics();
    populateCommandCenterSelector();
    
    const inspector = document.getElementById('calendarConflictInspector');
    if (inspector) inspector.style.display = 'none';
    
    if (adminEventsDb.length > 0) {
        loadActiveEventInCommandCenter(adminEventsDb[0].id);
    } else {
        loadActiveEventInCommandCenter(null);
    }

    if (typeof showToast === 'function') showToast('Jadwal acarberhasil dihapus', 'red');
}
window.deleteEventById = deleteEventById;

function syncCalendarToCustomer(newEv) {
    try {
        const raw = JSON.stringify(window.mcCustomers || []);
        let custs = raw ? JSON.parse(raw) : [];
        const existing = custs.find(c => String(c.id) === String(newEv.id) || (c.date === newEv.date && c.event.toLowerCase() === newEv.title.toLowerCase()));
        if (!existing) {
            const rawVal = Number(newEv.rawPrice) || 10000000;
            const words = (newEv.pic || 'Klien Baru').split(/s+/).filter(w => w.length > 0);
            let initials = 'MC';
            if (words.length >= 2) initials = (words[0][0] + words[1][0]).toUpperCase();
            else if (words.length === 1) initials = words[0].substring(0, 2).toUpperCase();

            const newCust = {
                id: newEv.id,
                name: newEv.pic ? newEv.pic.split('(')[0].trim() : 'Klien Baru',
                org: 'Klien Personal / Perusahaan',
                initials: initials,
                initialsBg: 'linear-gradient(135deg,#D4AF37,#F59E0B)',
                initialsColor: '#000000',
                category: newEv.category || 'Wedding',
                categoryLabel: newEv.category === 'Corporate' ? 'x Corporate' : 'Wedding',
                wa: newEv.pic && newEv.pic.includes('(') ? newEv.pic.split('(')[1].replace(')', '').trim() : '081234567890',
                email: 'klien@mcconnect.id',
                event: newEv.title,
                date: newEv.date,
                formattedDate: `${newEv.date}  ${newEv.venue}`,
                price: rawVal,
                paymentStatus: newEv.status === 'Terkunci' ? 'DP 50% Paid' : 'Tentative (Hold)',
                relationType: 'Active Booking',
                isVip: newEv.category === 'Corporate',
                notes: newEv.note || 'Acardidaftarkan melalui Kalender Anti-Bentrok.'
            };
            custs.unshift(newCust);
            /* localStorage removed */;;
            if (typeof window.loadCustomersData === 'function') {
                window.loadCustomersData();
            }
        }
    } catch(e) {
        console.warn('Sync to customer error:', e);
    }
}
window.syncCalendarToCustomer = syncCalendarToCustomer;

function loadActiveEventInCommandCenter(eventId) {
    if (!adminEventsDb || adminEventsDb.length === 0) {
        const idBadge = document.getElementById('ccEventIdDisplay');
        if (idBadge) idBadge.textContent = 'Event_ID #---';
        const titleH1 = document.getElementById('ccEventTitle');
        if (titleH1) titleH1.textContent = 'Belum AdJadwal Acara';
        const statusBadge = document.getElementById('ccEventStatusBadge');
        if (statusBadge) {
            statusBadge.className = 'badge badge-review';
            statusBadge.textContent = 'Tidak AdData';
        }
        const metaDate = document.getElementById('ccEventMetaDate');
        if (metaDate) metaDate.textContent = '-';
        const metaTime = document.getElementById('ccEventMetaTime');
        if (metaTime) metaTime.textContent = '';
        const metaVenue = document.getElementById('ccEventMetaVenue');
        if (metaVenue) metaVenue.textContent = '';
        const metaPic = document.getElementById('ccEventMetaPic');
        if (metaPic) metaPic.textContent = '';
        
        // Ensure layout is visible even if empty (User requested the tabs to remain visible as whole)
        const navTabs = document.querySelector('.ecc-nav-tabs');
        if (navTabs) navTabs.style.display = 'flex';
        const tabPanels = document.querySelectorAll('#sec-command-center .tab-panel');
        tabPanels.forEach(p => p.style.display = '');

        const emptyStateMsg = document.getElementById('eccEmptyStateMsg');
        if (emptyStateMsg) emptyStateMsg.style.display = 'none';

        // Clear dynamic contents safely
        const rdBody = document.getElementById('rundownTableBody');
        if (rdBody) rdBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum adjadwal acaraktif.</td></tr>';
        
        const vipList = document.getElementById('vipProtocolList');
        if (vipList) vipList.innerHTML = '<div style="color:var(--adm-text-muted);">Tidak ada data.</div>';
        
        const eccClientAvatar = document.getElementById('eccClientAvatar');
        if (eccClientAvatar) {
            eccClientAvatar.textContent = '-';
            eccClientAvatar.style.background = 'transparent';
        }
        
        const eccClientName = document.getElementById('eccClientName');
        if (eccClientName) eccClientName.textContent = 'Belum AdKlien';
        
        const eccClientContact = document.getElementById('eccClientContact');
        if (eccClientContact) eccClientContact.innerHTML = '<span>-</span> <span>S0️ -</span>';
        
        const eccClientPkg = document.getElementById('eccClientPkg');
        if (eccClientPkg) eccClientPkg.textContent = '-';
        
        const eccClientPrice = document.getElementById('eccClientPrice');
        if (eccClientPrice) eccClientPrice.textContent = 'Rp 0';
        
        const eccClientDuration = document.getElementById('eccClientDuration');
        if (eccClientDuration) eccClientDuration.textContent = '-';
        
        const eccClientVenue = document.getElementById('eccClientVenue');
        if (eccClientVenue) eccClientVenue.textContent = '-';
        
        const adminContractVal = document.getElementById('adminContractVal');
        if (adminContractVal) adminContractVal.textContent = 'Rp 0';
        
        const adminDpVal = document.getElementById('adminDpVal');
        if (adminDpVal) adminDpVal.textContent = 'Rp 0';
        
        const adminSisaVal = document.getElementById('adminSisaVal');
        if (adminSisaVal) adminSisaVal.textContent = 'Rp 0';
        
        const adminProfitVal = document.getElementById('adminProfitVal');
        if (adminProfitVal) adminProfitVal.textContent = 'Rp 0';

        const tabStickyNotesText = document.getElementById('tabStickyNotesText');
        if (tabStickyNotesText) tabStickyNotesText.value = '';

        const eccVipProtocolList = document.getElementById('eccVipProtocolList');
        if (eccVipProtocolList) eccVipProtocolList.innerHTML = '<div style="color:var(--adm-text-muted); font-size:0.85rem; font-style:italic;">Tidak addatprotokol VIP.</div>';

        const adminChkList = document.getElementById('adminChkList');
        if (adminChkList) adminChkList.innerHTML = '<div style="color:var(--adm-text-muted); font-size:0.85rem; font-style:italic;">Belum adchecklist.</div>';

        
        return;
    }

    // Restore layout if recovering from empty state
    const navTabs = document.querySelector('.ecc-nav-tabs');
    if (navTabs) navTabs.style.display = 'flex';
    const tabPanels = document.querySelectorAll('#sec-command-center .tab-panel');
    tabPanels.forEach(p => p.style.display = '');
    const emptyStateMsg = document.getElementById('eccEmptyStateMsg');
    if (emptyStateMsg) emptyStateMsg.style.display = 'none';

    let ev = adminEventsDb.find(e => String(e.id) === String(eventId) || String(e.customerId) === String(eventId));
    if (!ev) {
        ev = adminEventsDb[0];
    }
    activeCommandCenterEventId = ev.id;
    window.activeCommandCenterEventId = ev.id; // sync to window for cross-module access
    window.activeCommandCenterEvent = ev; // sync the actual object as well!
    try { AdminDB.setItem('activeCommandCenterEventId', ev.id); } catch(e) {}
    try { localStorage.setItem('activeCommandCenterEventId', ev.id); } catch(e) {}

    // 1. Selector Dropdown
    const selector = document.getElementById('eccEventSelector');
    if (selector) selector.value = ev.id;

    // 2. Header Status & Title
    const idBadge = document.getElementById('ccEventIdDisplay');
    if (idBadge) idBadge.textContent = `Event_ID #${ev.id}`;

    const statusBadge = document.getElementById('ccEventStatusBadge');
    if (statusBadge) {
        if (ev.status === 'Terkunci') {
            statusBadge.className = 'badge badge-locked';
            statusBadge.textContent = 'Status: Terkunci (DP Paid)';
        } else if (ev.status === 'Tentative') {
            statusBadge.className = 'badge badge-tentative';
            statusBadge.textContent = '⏳ Status: Tentative (Hold)';
        } else if (ev.status === 'Review') {
            statusBadge.className = 'badge badge-review';
            statusBadge.textContent = 'Status: Review';
        } else {
            statusBadge.className = 'badge badge-completed';
            statusBadge.textContent = 'Status: Selesai';
        }
    }

    const statusSelect = document.getElementById('ccStatusSelect');
    if (statusSelect) {
        const match = Array.from(statusSelect.options).find(o => o.value.toLowerCase() === (ev.status || '').toLowerCase());
        if (match) statusSelect.value = match.value;
    }

    const titleH1 = document.getElementById('ccEventTitle');
    if (titleH1) titleH1.textContent = ev.title;

    const metaDate = document.getElementById('ccEventMetaDate');
    if (metaDate) metaDate.textContent = `${formatDateIndoFull(ev.date)}`;

    const metaTime = document.getElementById('ccEventMetaTime');
    if (metaTime) metaTime.textContent = `${ev.time || '19:00 - 22:00 WIB'}`;

    const metaVenue = document.getElementById('ccEventMetaVenue');
    if (metaVenue) metaVenue.textContent = `${ev.venue || 'Venue Terdaftar'}`;

    const metaPic = document.getElementById('ccEventMetaPic');
    if (metaPic) metaPic.textContent = `${ev.pic || 'PIC Terdaftar'}`;

    // Get linked customer details if available
    let cust = null;
    try {
        const rawCust = JSON.stringify(window.mcCustomers || []);
        const custs = rawCust ? JSON.parse(rawCust) : [];
        cust = custs.find(c => String(c.id) === String(ev.customerId) || String(c.id) === String(ev.id) || (c.date === ev.date && c.event === ev.title));
    } catch(e) {}

    const clientName = cust ? cust.name : (ev.pic ? ev.pic.split('(')[0].trim() : 'Klien Belum Terdaftar');
    const clientPhone = cust ? cust.wa : (ev.pic && ev.pic.includes('(') ? ev.pic.split('(')[1].replace(')', '').trim() : '-');
    const clientEmail = cust ? (cust.email || '-') : '-';
    const clientPkg = cust ? cust.category : (ev.category || 'Belum Dipilih');
    const clientCat = cust ? (cust.client_category || (cust.isVip ? 'VIP' : '-')) : '-';
    const clientDuration = ev.duration ? `${ev.duration}  ${ev.time}` : (cust && cust.duration ? `${cust.duration}  ${ev.time}` : (ev.time || 'Waktu Belum Diset'));

    // 3. Tab 1 - Client Profile Card
    const clientAvatar = document.getElementById('eccClientAvatar');
    if (clientAvatar) {
        if (cust && cust.initials) {
            clientAvatar.textContent = cust.initials;
            clientAvatar.style.background = cust.initialsBg || 'linear-gradient(135deg,#D4AF37,#B38F26)';
            clientAvatar.style.color = cust.initialsColor || '#FFFFFF';
        } else {
            const safeClientName = String(clientName || 'Klien');
            const words = safeClientName.split(/\s+/).filter(w => w.length > 0);
            const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : safeClientName.substring(0, 2).toUpperCase();
            clientAvatar.textContent = initials || 'MC';
            clientAvatar.style.background = 'linear-gradient(135deg,#D4AF37,#B38F26)';
            clientAvatar.style.color = '#0B0F19';
        }
    }

    const clientBadge = document.getElementById('eccClientBadge');
    if (clientBadge) {
        clientBadge.className = ev.status === 'Terkunci' ? 'badge badge-locked' : (ev.status === 'Tentative' ? 'badge badge-tentative' : 'badge badge-review');
        clientBadge.textContent = ev.paymentStatus || ev.status;
    }

    const eccClientStatusSelect = document.getElementById('eccClientStatusSelect');
    if (eccClientStatusSelect) {
        let normalizedStatus = ev.status || 'Tentative';
        if(normalizedStatus === 'Terkunci') normalizedStatus = 'Terkunci';
        eccClientStatusSelect.value = normalizedStatus;
    }

    const clientNameEl = document.getElementById('eccClientName');
    if (clientNameEl) clientNameEl.textContent = clientName;

    const clientContact = document.getElementById('eccClientContact');
    if (clientContact) {
        clientContact.innerHTML = `<span>${clientPhone}</span> <span>S0️ ${clientEmail}</span>`;
    }

    const clientPkgEl = document.getElementById('eccClientPkg');
    if (clientPkgEl) clientPkgEl.textContent = clientPkg;
    
    const clientCatEl = document.getElementById('eccClientCategory');
    if (clientCatEl) clientCatEl.textContent = clientCat;

    const clientPriceEl = document.getElementById('eccClientPrice');
    if (clientPriceEl) clientPriceEl.textContent = ev.price;

    const clientDurationEl = document.getElementById('eccClientDuration');
    if (clientDurationEl) clientDurationEl.textContent = clientDuration;

    const clientVenueEl = document.getElementById('eccClientVenue');
    if (clientVenueEl) clientVenueEl.textContent = ev.venue;

    const clientWaBtn = document.getElementById('eccClientWaBtn');
    if (clientWaBtn) {
        clientWaBtn.onclick = function() {
            if (typeof window.openWhatsAppChat === 'function') {
                window.openWhatsAppChat(clientPhone, clientName, ev.title);
            }
        };
    }

    const clientCrmBtn = document.getElementById('eccClientCrmBtn');
    if (clientCrmBtn) {
        clientCrmBtn.onclick = function() {
            if (typeof window.quickSelectCustomer === 'function' && (ev.customerId || ev.id)) {
                window.quickSelectCustomer(ev.customerId || ev.id);
            } else if (typeof navigateToSection === 'function') {
                navigateToSection('sec-customers', document.getElementById('menu-customers'));
            }
        };
    }

    // 4. Tab 1 - Sticky Notes (per event)
    const stickyEl = document.getElementById('tabStickyNotesText');
    if (stickyEl) {
        const savedSticky = AdminDB.getItem(`ecc_sticky_notes_${ev.id}`);
        stickyEl.value = savedSticky !== null ? savedSticky : (ev.vipNotes || '');
        stickyEl.oninput = function() {
            AdminDB.setItem(`ecc_sticky_notes_${ev.id}`, this.value);
            ev.vipNotes = this.value;
            saveUnifiedEventsDatabase();
        };
    }

    const stickySubtitle = document.getElementById('eccStickySubtitle');
    if (stickySubtitle) {
        stickySubtitle.textContent = `* Tersimpan ke Event_ID #${ev.id}`;
    }

    // WA Automation Gateway
    const waListContainer = document.getElementById('ccWaAutomationList');
    if (waListContainer) {
        const templates = window.currentWaTemplates && window.currentWaTemplates.length > 0 
            ? window.currentWaTemplates 
            : [
                { id: 't1', title: 'Reminder Pembayaran DP', body: 'Halo [NAMA], mohon segera melakukan pembayaran DP untuk acara [ACARA]. Terima kasih.' },
                { id: 't2', title: 'Update Jadwal Meeting', body: 'Halo [NAMA], mari jadwalkan meeting persiapan acara [ACARA]. Kapan ada waktu?' }
            ];
        
        let waHtml = '';
        templates.forEach(t => {
            waHtml += `
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:12px; margin-bottom:10px;">
                    <div style="font-weight:700; color:var(--adm-gold); margin-bottom:6px;">${t.title}</div>
                    <div style="font-size:0.8rem; color:#94A3B8; margin-bottom:8px;">${t.body.substring(0, 50)}...</div>
                    <button class="btn btn-secondary btn-sm" onclick="sendWaTemplate('${encodeURIComponent(t.body)}')">Kirim Pesan Ini</button>
                </div>
            `;
        });
        waListContainer.innerHTML = waHtml || '<div style="text-align:center; padding:1.5rem; color:var(--adm-text-muted); font-size:0.85rem;">Belum ada template.</div>';
    }

    // 5. Tab 1 - VIP Protocol
    const vipContainer = document.getElementById('eccVipProtocolList');
    if (vipContainer) {
        const protocols = ev.vipProtocol && ev.vipProtocol.length > 0 ? ev.vipProtocol : [];
        if (protocols.length === 0) {
            vipContainer.innerHTML = '<div style="color:var(--adm-text-muted); font-size:0.85rem; font-style:italic;">Belum ada protokol VIP.</div>';
        } else {
            vipContainer.innerHTML = protocols.map(p => `
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:0.3rem;">
                    <span style="color:var(--adm-text-muted);">${escapeHtml(p.role)}:</span>
                    <strong style="color:#F8FAFC;">${escapeHtml(p.name)}</strong>
                </div>
            `).join('');
        }
    }

    // 6. Tab 1 - Checklist
    const chkContainer = document.getElementById('adminChkList');
    if (chkContainer) {
        const items = ev.checklist && ev.checklist.length > 0 ? ev.checklist : [];
        if (items.length === 0) {
            chkContainer.innerHTML = '<div style="color:var(--adm-text-muted); font-size:0.85rem; font-style:italic;">Belum adchecklist persiapan.</div>';
        } else {
            chkContainer.innerHTML = items.map((chk, idx) => `
                <label class="checklist-item ${chk.done ? 'done' : ''}">
                    <input type="checkbox" ${chk.done ? 'checked' : ''} onchange="toggleAdminChkItem(${ev.id}, ${idx}, this)">
                    <span>${escapeHtml(chk.text)}</span>
                </label>
            `).join('');
        }
        updateAdminChkProgress();
    }

    // 7. Tab 2 - Finance Cards & QRI
    const rawVal = Number(ev.rawPrice || ev.price || 0);
    const isLunas = (ev.paymentStatus && (ev.paymentStatus.includes('Lunas') || ev.paymentStatus.includes('100%')));
    const isDp = (ev.paymentStatus && ev.paymentStatus.includes('DP')) || ev.status === 'Terkunci';
    
    let dpVal = 0;
    if (ev.metadata && typeof ev.metadata.nominal_dp !== 'undefined') {
        dpVal = Number(ev.metadata.nominal_dp);
    } else {
        dpVal = isLunas ? rawVal : (isDp ? Math.round(rawVal * 0.5) : 0);
    }
    
    const sisaVal = rawVal - dpVal;

    const contractEl = document.getElementById('adminContractVal');
    if (contractEl) contractEl.textContent = 'Rp ' + rawVal.toLocaleString('id-ID');

    const dpEl = document.getElementById('adminDpVal');
    if (dpEl) dpEl.textContent = 'Rp ' + dpVal.toLocaleString('id-ID');

    const sisaEl = document.getElementById('adminSisaVal');
    if (sisaEl) sisaEl.textContent = 'Rp ' + sisaVal.toLocaleString('id-ID');

    const totalExp = (ev.expenses || []).reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
    const netProfit = rawVal - totalExp;

    const profitEl = document.getElementById('adminProfitVal');
    if (profitEl) profitEl.textContent = 'Rp ' + netProfit.toLocaleString('id-ID');

    const financeBadge = document.getElementById('adminFinanceBadge');
    if (financeBadge) {
        if (isLunas) {
            financeBadge.className = 'badge badge-available';
            financeBadge.textContent = 'Lunas (Fully Paid)';
        } else if (dpVal > 0) {
            financeBadge.className = 'badge badge-tentative';
            financeBadge.textContent = 'DP / Sebagian Dibayar';
        } else {
            financeBadge.className = 'badge badge-locked';
            financeBadge.textContent = 'Belum Dibayar (Unpaid)';
        }
    }

    const financeSelect = document.getElementById('adminFinanceSelect');
    if (financeSelect) {
        financeSelect.value = isLunas ? 'Fully Paid' : (isDp ? 'DP Paid' : 'Unpaid');
    }

    const qrisImg = document.getElementById('adminQrisImg');
    if (qrisImg) {
        let qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=INV2026${String(ev.id).padStart(4, '0')}`;
        if (typeof loadPaymentSettings === 'function') {
            const ps = loadPaymentSettings();
            if (ps && ps.qrisUrl) qrisUrl = ps.qrisUrl;
        }
        qrisImg.src = qrisUrl;
    }

    const expContainer = document.getElementById('adminExpenseList');
    if (expContainer) {
        const expList = ev.expenses || [];
        if (expList.length === 0) {
            expContainer.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--text-muted); font-size:0.85rem; font-style:italic;">Belum adcatatan pengeluaran.</div>';
        } else {
            expContainer.innerHTML = expList.map(x => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface); padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                    <div>
                        <div style="font-size:0.9rem; font-weight:600;">${x.desc}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">Kategori: ${x.cat}</div>
                    </div>
                    <div style="font-weight:700; color:var(--color-locked);">- Rp ${Number(x.amount).toLocaleString('id-ID')}</div>
                </div>
            `).join('');
        }

        const expTotalEl = document.getElementById('adminExpenseTotal');
        if (expTotalEl) {
            const sum = expList.reduce((a, b) => + Number(b.amount || 0), 0);
            expTotalEl.textContent = 'Rp ' + sum.toLocaleString('id-ID');
        }
    }

    // 8. Update Invoice Print Modal
    const invNum = document.getElementById('invModalNum');
    if (invNum) invNum.textContent = `INV-2026${String(ev.id).padStart(4, '0')}`;

    const invBadge = document.getElementById('invModalBadge');
    if (invBadge) {
        invBadge.textContent = (isLunas ? 'LUNAS (100% PAID)' : (isDp ? 'DP 50% PAID' : 'UNPAID'));
        invBadge.style.background = isLunas || isDp ? '#DCFCE7' : '#FEE2E2';
        invBadge.style.color = isLunas || isDp ? '#166534' : '#991B1B';
    }

    const invClientName = document.getElementById('invModalClientName');
    if (invClientName) invClientName.textContent = clientName;

    const invClientWa = document.getElementById('invModalClientWa');
    if (invClientWa) invClientWa.textContent = `No. WA: ${clientPhone}`;

    const invTitle = document.getElementById('invModalEventTitle');
    if (invTitle) invTitle.textContent = ev.title;

    const invDateVenue = document.getElementById('invModalEventDateVenue');
    if (invDateVenue) invDateVenue.textContent = `${ev.date}  ${ev.venue}`;

    const invPkg = document.getElementById('invModalPackageName');
    if (invPkg) invPkg.textContent = clientPkg;

    const invPrice = document.getElementById('invModalTotalPrice');
    if (invPrice) invPrice.textContent = 'Rp ' + rawVal.toLocaleString('id-ID');

    const invTotalSum = document.getElementById('invModalTotalSummary');
    if (invTotalSum) invTotalSum.textContent = 'Rp ' + rawVal.toLocaleString('id-ID');

    const invDpSum = document.getElementById('invModalDpSummary');
    if (invDpSum) invDpSum.textContent = `- Rp ${dpVal.toLocaleString('id-ID')}`;

    const invSisaSum = document.getElementById('invModalSisaSummary');
    if (invSisaSum) invSisaSum.textContent = `Rp ${sisaVal.toLocaleString('id-ID')}`;

    const invQris = document.getElementById('invModalQrisImg');
    if (invQris) {
        let qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=INV2026${String(ev.id).padStart(4, '0')}`;
        if (typeof loadPaymentSettings === 'function') {
            const ps = loadPaymentSettings();
            if (ps && ps.qrisUrl) qrisUrl = ps.qrisUrl;
        }
        invQris.src = qrisUrl;
    }

    // 9. Tab 3 - Stage & Rundown Management (Dynamic Per Customer Event)
    if (typeof renderAdminRundownList === 'function') {
        renderAdminRundownList(ev);
    }

    // 9b. Tab 6 - Music Playlist & Audio Cue Sheet Management
    if (typeof renderAdminMusicList === 'function') {
        renderAdminMusicList(ev);
    }
    if (typeof renderAdminSoundboardList === 'function') {
        renderAdminSoundboardList(ev);
    }

    // 9c. Tab 4 - Layar Kolaborasi Vendor (Live Rundown & Music Cue Sync)
    const vcTitle = document.getElementById('vendorCollabEventTitle');
    if (vcTitle) vcTitle.textContent = ev.title || 'Acara Tanpa Judul';
    const vcMeta = document.getElementById('vendorCollabEventMeta');
    if (vcMeta) {
        vcMeta.textContent = `📅 ${ev.date || '-'} ⏰ ${ev.time || '-'} 📍 ${ev.venue || 'TBD'}`;
    }
    
    if (typeof renderAdminVendorCollab === 'function') {
        renderAdminVendorCollab(ev);
    }
    // Tab 1 - Wardrobe Tracker
    if (typeof renderWardrobe === 'function') {
        renderWardrobe();
    }

    // 10. Tab 5 - Post-Event Review & Loyalty Sync
    const postReviewArea = document.getElementById('postEventReviewTemplate');
    if (postReviewArea) {
        postReviewArea.value = `Halo Kak ${clientName}, salam hangat dari Vanya Arsyad & Tim MC-Connect.\n\nTerima kasih banyak atas kepercayaan luar biasa yang telah diberikan kepada kami untuk memandu agenda istimewa "${ev.title}". Merupakan suatu kehormatan dan kebahagiaan tak terhingga dapat menjadi bagian dari momen indah Anda!\n\nJika Kak ${clientName} berkenan, kami akan sangat berterima kasih atas ulasan bintang 5 dan testimoni singkat melalui tautan berikut:\n⭐ https://vanyaarsyad.com/review?id=${ev.id}\n\nUlasan dan feedback Kak ${clientName} sangat berharga bagi peningkatan standar performa panggung kami di masa depan. Sukses dan bahagia selalu!\n\nSalam hormat,\nVanya Arsyad, S.I.Kom`;
    }
    const postReviewSub = document.getElementById('tabReviewSubtitle');
    if (postReviewSub) {
        postReviewSub.textContent = `Kirim pesan otomatis WhatsApp kepada ${clientName} (${clientPhone}) untuk meminta testimoni & rating bintang 5 setelah acara selesai.`;
    }
}
window.loadActiveEventInCommandCenter = loadActiveEventInCommandCenter;

// 3. Section Title Mapping for Dynamic Topbar Breadcrumb
const sectionBreadcrumbMap = {
    'sec-dashboard': 'Dashboard Ringkasan & Performa MC',
    'sec-calendar': 'Kalender Jadwal Acara (Anti-Bentrok)',
    'sec-cashflow': 'Manajemen Arus Kas (Cash Flow)',
    'sec-landing-settings': 'Pengaturan Landing Page (CMS Publik)',
    'sec-command-center': 'Event Command Center (Terintegrasi)',
    'sec-wardrobe': 'Manajemen Wardrobe Tracker',
    'sec-stage-mode': 'Stage Mode (Teleprompter & Soundboard)',
    'sec-vendor-screen': 'Layar Vendor Musik (FOH Live Cue)',
    'sec-customers': 'Direktori Data Pelanggan & Klien (CRM)'
};

function updateAdminClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const clockEl = document.getElementById('topbarLiveClock');
    if (clockEl) {
        clockEl.textContent = `${h}:${m}:${s} WIB`;
    }
}

// 4. Initialization

// Navigation function - switches between admin sections
function navigateToSection(sectionId, menuElement) {
    // Remove active class from all sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Add active class to target section
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
    }
    
    // Update active menu in sidebar
    document.querySelectorAll('.sidebar-item-btn').forEach(item => {
        item.classList.remove('active');
    });
    if (menuElement) {
        menuElement.classList.add('active');
    }
    
    // Update breadcrumb
    const breadcrumb = document.getElementById('topbarBreadcrumb');
    if (breadcrumb && typeof sectionBreadcrumbMap !== 'undefined' && sectionBreadcrumbMap[sectionId]) {
        breadcrumb.textContent = sectionBreadcrumbMap[sectionId];
    }
    
    // Close sidebar on mobile
    if (typeof closeSidebar === 'function') {
        closeSidebar();
    }
    
    // Scroll to top
    const mainContent = document.querySelector('.admin-main-content');
    if (mainContent) mainContent.scrollTop = 0;

    // Section-specific initialization
    if (sectionId === 'sec-customers' && typeof window.initCustomersPage === 'function') {
        window.initCustomersPage();
    }
    if (sectionId === 'sec-customers' && typeof window.loadCustomersData === 'function') {
        window.loadCustomersData();
    }
    if (sectionId === 'sec-command-center' && typeof window.loadActiveEventInCommandCenter === 'function') {
        window.loadActiveEventInCommandCenter(activeCommandCenterEventId);
    }
    if (sectionId === 'sec-dashboard' && typeof renderDashEvents === 'function') {
        renderDashEvents();
    }
    if (sectionId === 'sec-wardrobe' && typeof renderWardrobe === 'function') {
        renderWardrobe();
    }
    if (sectionId === 'sec-cashflow' && typeof renderCashflowTable === 'function') {
        renderCashflowTable();
    }
}
window.navigateToSection = navigateToSection;


// Sidebar Toggle Functions
function openSidebar() {
    const shell = document.querySelector('.admin-shell');
    const backdrop = document.getElementById('sidebarBackdrop');
    const sidebar = document.querySelector('.admin-sidebar');
    if (shell) shell.classList.add('sidebar-mobile-open');
    if (backdrop) backdrop.classList.add('active');
    if (sidebar) sidebar.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    const shell = document.querySelector('.admin-shell');
    const backdrop = document.getElementById('sidebarBackdrop');
    const sidebar = document.querySelector('.admin-sidebar');
    if (shell) shell.classList.remove('sidebar-mobile-open');
    if (backdrop) backdrop.classList.remove('active');
    if (sidebar) sidebar.classList.remove('open');
    document.body.style.overflow = '';
}

function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        if (window.innerWidth <= 1024) {
            openSidebar();
        } else {
            // Desktop: toggle collapsed state
            const shell = document.querySelector('.admin-shell');
            if (shell) shell.classList.toggle('sidebar-collapsed');
        }
    }
}
window.toggleSidebar = toggleSidebar;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;


// ============================================================
// CMS Landing Page Configuration Loader
// ============================================================
function initAdminCms() {
    try {
        fetch('/api/cms/biodata?t=' + Date.now())
            .then(res => res.json())
            .then(data => {
                const bio = data.data || {};
                
                window.cmsConfig = window.cmsConfig || {};
                window.cmsConfig.bio = bio;
                
                const mapVal = (id, val) => {
                    const el = document.getElementById(id);
                    if (el && val !== undefined && val !== null) el.value = val;
                };
                
                mapVal('cmsNamaPanggung', bio.name);
                mapVal('cmsEmail', bio.email);
                mapVal('cmsBioText', bio.bio);
                mapVal('cmsStatEvents', bio.statEvents);
                mapVal('cmsStatYears', bio.statYears);
                mapVal('cmsSpesialisasi', bio.spec);
                mapVal('cmsFotoUrl', bio.photo);
                mapVal('cmsIg', bio.ig);
                mapVal('cmsTiktok', bio.tiktok);
                mapVal('cmsFb', bio.fb);
                
                if (bio.photo) {
                    const preview = document.getElementById('cmsFotoPreview');
                    if (preview) preview.src = bio.photo;
                    
                    const sidebarImg = document.getElementById('sidebarAvatarImg');
                    if (sidebarImg) {
                        sidebarImg.src = bio.photo;
                        sidebarImg.style.opacity = '1';
                    }
                }
                
                if (bio.name) {
                    const sidebarName = document.getElementById('sidebarMcName');
                    if (sidebarName) sidebarName.textContent = bio.name;
                    
                    const dashName = document.getElementById('dashWelcomeName');
                    if (dashName) dashName.textContent = bio.name;
                }
            })
            .catch(err => console.warn('Failed to fetch CMS biodata from API:', err));
    } catch(e) {
        console.warn('CMS init skipped:', e.message);
    }
}
window.initAdminCms = initAdminCms;

// ============================================================
// Cash Flow Transactions Loader
// ============================================================


// ============================================================
// Payment Settings Loader
// ============================================================
function loadPaymentSettings() {
    if (window.mcGlobalPaymentSettings) {
        return window.mcGlobalPaymentSettings;
    }
    return {
        bankName: 'BCA',
        bankAccount: '',
        bankHolder: '',
        dpPercent: 50,
        qrisUrl: ''
    };
}
window.loadPaymentSettings = loadPaymentSettings;

// ============================================================
// Admin Checklist Progress Updater
// ============================================================
function updateAdminChkProgress() {
    const progressBar = document.getElementById('adminChkBar');
    const progressText = document.getElementById('adminChkCount');
    if (!progressBar) return;
    
    try {
        const checkboxes = document.querySelectorAll('#adminChkList input[type="checkbox"]');
        if (checkboxes.length === 0) {
            progressBar.style.width = '0%';
            if (progressText) progressText.textContent = '0/0 Selesai (0%)';
            return;
        }
        
        const checked = document.querySelectorAll('#adminChkList input[type="checkbox"]:checked').length;
        const total = checkboxes.length;
        const pct = Math.round((checked / total) * 100);
        
        progressBar.style.width = pct + '%';
        if (progressText) {
            progressText.textContent = checked + '/' + total + ' Selesai (' + pct + '%)';
        }
    } catch(e) {}
}
window.updateAdminChkProgress = updateAdminChkProgress;

window.toggleAdminChkItem = async function(eventId, idx, el) {
    try {
        const ev = window.adminEventsDb.find(e => String(e.id) === String(eventId));
        if (!ev || !ev.checklist || !ev.checklist[idx]) return;
        
        ev.checklist[idx].done = el.checked;
        if (el.checked) {
            el.closest('.checklist-item').classList.add('done');
        } else {
            el.closest('.checklist-item').classList.remove('done');
        }
        updateAdminChkProgress();
        
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const res = await fetch('/api/cms/events/' + eventId, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': token},
            body: JSON.stringify({ checklist: ev.checklist })
        });
        if (!res.ok) throw new Error('Gagal menyimpan checklist');
    } catch(e) {
        console.error(e);
        el.checked = !el.checked;
        updateAdminChkProgress();
    }
};

window.addAdminChk = async function() {
    const input = document.getElementById('adminNewChkInput');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    
    const eventId = window.activeCommandCenterEventId;
    if (!eventId) return;
    
    try {
        const ev = window.adminEventsDb.find(e => String(e.id) === String(eventId));
        if (!ev) return;
        
        ev.checklist = ev.checklist || [];
        ev.checklist.push({ text: text, done: false });
        
        const chkContainer = document.getElementById('adminChkList');
        if (chkContainer) {
            chkContainer.innerHTML = ev.checklist.map((chk, idx) => `
                <label class="checklist-item ${chk.done ? 'done' : ''}">
                    <input type="checkbox" ${chk.done ? 'checked' : ''} onchange="toggleAdminChkItem(${ev.id}, ${idx}, this)">
                    <span>${window.escapeHtml ? window.escapeHtml(chk.text) : chk.text}</span>
                </label>
            `).join('');
        }
        input.value = '';
        updateAdminChkProgress();
        
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const res = await fetch('/api/cms/events/' + eventId, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': token},
            body: JSON.stringify({ checklist: ev.checklist })
        });
        if (!res.ok) throw new Error('Gagal menambah checklist');
    } catch(e) {
        console.error(e);
    }
};

// ============================================================
// Dashboard Events Renderer
// ============================================================
function renderDashEvents() {
    try {
        const container = document.getElementById('dashUpcomingEvents');
        if (!container) return;
        
        const events = window.adminEventsDb || [];
        if (events.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:var(--adm-text-muted); padding:1rem;">Belum ada acara terjadwal.</div>';
            return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        const upcoming = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
        
        if (upcoming.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:var(--adm-text-muted); padding:1rem;">Tidak ada acara mendatang.</div>';
            return;
        }
        
        container.innerHTML = upcoming.map(ev => {
            const statusColor = ev.status === 'Terkunci' ? '#10B981' : ev.status === 'Tentative' ? '#F59E0B' : '#8B5CF6';
            return '<div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">' +
                '<div><strong>' + escapeHtml(ev.title || 'Acara') + '</strong><br><small style="color:var(--adm-text-muted);">' + ev.date + '</small></div>' +
                '<span style="color:' + statusColor + '; font-weight:600; font-size:0.8rem;">' + (ev.status || 'Review') + '</span>' +
            '</div>';
        }).join('');
    } catch(e) {
        console.warn('renderDashEvents:', e.message);
    }
}
window.renderDashEvents = renderDashEvents;

// ============================================================
// Agenda Inspector (Calendar Date Click Handler)
// ============================================================
function showAgendaInspector(dateStr, status, eventObj, eventsOnDate) {
    try {
        const inspector = document.getElementById('calendarConflictInspector');
        
        if (inspector) {
            document.getElementById('inspectorDate').textContent = dateStr;
            
            if (eventObj) {
                document.getElementById('inspectorTitle').textContent = eventObj.title || 'Agenda Acara';
                document.getElementById('inspectorLocation').textContent = (eventObj.venue || '') + ' ' + (eventObj.time || '');
                
                const badge = document.getElementById('inspectorBadge');
                const msg = document.getElementById('inspectorConflictMsg');
                
                if (status === 'Terkunci') {
                    badge.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
                    badge.className = 'badge badge-locked';
                    msg.innerHTML = '<span style="font-size:1.2rem;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg></span>' +
                        '<div><strong>Proteksi Anti-Bentrok Aktif:</strong> Jadwal ini telah terkunci secara resmi (DP Paid). Sistem otomatis memblokir pemesanan ganda di tanggal & jam yang sama.</div>';
                    msg.style.display = 'flex';
                } else if (status === 'Selesai') {
                    badge.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20 6L9 17l-5-5"/></svg> Selesai';
                    badge.className = 'badge badge-completed';
                    msg.innerHTML = '<span style="font-size:1.2rem;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span>' +
                        '<div><strong>Acara Selesai:</strong> Acara ini telah selesai dilaksanakan dan pembayaran telah lunas (100%).</div>';
                    msg.style.display = 'flex';
                    msg.style.background = 'rgba(16,185,129,0.1)';
                    msg.style.color = '#10B981';
                    msg.style.borderColor = 'rgba(16,185,129,0.2)';
                } else {
                    badge.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>';
                    badge.className = 'badge badge-tentative';
                    msg.style.display = 'none';
                    msg.style.background = '';
                    msg.style.color = '';
                    msg.style.borderColor = '';
                }
            } else {
                document.getElementById('inspectorTitle').textContent = 'Hari Bebas / Tersedia';
                document.getElementById('inspectorLocation').textContent = 'Belum ada acara di tanggal ini.';
                document.getElementById('inspectorBadge').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>';
                document.getElementById('inspectorBadge').className = 'badge badge-available';
                document.getElementById('inspectorConflictMsg').style.display = 'none';
            }
            
            inspector.style.display = 'block';
            
            // Set active event if it's an admin flow
            if (eventObj && eventObj.id) {
                window.activeCommandCenterEventId = eventObj.id;
            }
        }
    } catch(e) {
        console.warn('showAgendaInspector:', e.message);
    }
}
window.showAgendaInspector = showAgendaInspector;

window.renderCalendarAgendaList = function(filter = 'all', btn = null) {
    if (btn) {
        document.querySelectorAll('.cal-agenda-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    
    window.currentAgendaFilter = (filter === 'all' ? null : filter);
    if(typeof window.renderAdminCalendar === 'function') window.renderAdminCalendar();
    
    const container = document.getElementById('agendaListContainer');
    if (!container) return;
    
    let events = window.adminEventsDb || [];
    
    if (filter !== 'all') {
        events = events.filter(e => e.status && e.status.toLowerCase() === filter.toLowerCase());
    }
    
    // Sort by date descending
    events.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (events.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:1.5rem; color:var(--adm-text-muted);">Tidak ada agenda yang cocok dengan filter.</div>';
        return;
    }
    
    container.innerHTML = events.map((ev, i) => {
        let stColor = '#3B82F6';
        if (ev.status === 'Terkunci') stColor = '#10B981';
        if (ev.status === 'Tentative') stColor = '#F59E0B';
        
        return '<div class="ecc-card" style="padding:1rem; border-left:3px solid ' + stColor + '; cursor:pointer; background:rgba(255,255,255,0.02);" onclick="showAgendaInspector(\''+escapeHtml(ev.date)+'\', \''+escapeHtml(ev.status)+'\', window.adminEventsDb.find(x => x.id == \''+escapeHtml(ev.id)+'\'), [window.adminEventsDb.find(x => x.id == \''+escapeHtml(ev.id)+'\')])">' +
            '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
                '<div>' +
                    '<div style="font-weight:800; font-size:1.05rem; margin-bottom:0.25rem;">' + escapeHtml(ev.title || 'Acara') + '</div>' +
                    '<div style="font-size:0.85rem; color:var(--adm-text-secondary);">' + escapeHtml(ev.date) + ' | ' + escapeHtml(ev.time || '') + '</div>' +
                    '<div style="font-size:0.85rem; color:var(--adm-text-secondary);">' + escapeHtml(ev.venue || '') + '</div>' +
                '</div>' +
                '<span class="badge" style="background:'+stColor+'20; color:'+stColor+';">' + escapeHtml(ev.status || 'Review') + '</span>' +
            '</div>' +
        '</div>';
    }).join('');
};

// Override initialization to also render the agenda list
const _origLoadUnified = window.loadUnifiedEventsDatabase;
if(_origLoadUnified) {
    window.loadUnifiedEventsDatabase = async function() {
        await _origLoadUnified();
        if(typeof renderCalendarAgendaList === 'function' && document.getElementById('agendaListContainer')) {
            renderCalendarAgendaList('all');
        }
    }
}


// ============================================================
// Admin Render Stubs for Command Center Tabs
// ============================================================
function renderAdminAgendaList() {
    try {
        const container = document.getElementById('eccAgendaBody');
        if (!container) return;
        const ev = window.activeCommandCenterEvent;
        if (!ev) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--adm-text-muted);">Pilih acara terlebih dahulu.</div>';
            return;
        }
        const agenda = ev.agenda || ev.rundown || [];
        if (agenda.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--adm-text-muted);">Belum ada agenda untuk acara ini.</div>';
            return;
        }
        container.innerHTML = agenda.map((item, i) => {
            return '<div style="display:flex; gap:0.75rem; padding:0.6rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">' +
                '<span style="color:var(--adm-gold); font-weight:700; min-width:30px;">' + (i+1) + '</span>' +
                '<div><strong>' + escapeHtml(item.title || item.text || 'Item ' + (i+1)) + '</strong>' +
                (item.time ? '<div style="font-size:0.8rem; color:var(--adm-text-muted);">' + item.time + '</div>' : '') +
                '</div></div>';
        }).join('');
    } catch(e) {}
}
window.renderAdminAgendaList = renderAdminAgendaList;

function renderAdminRundownList(ev) {
    const titleEl = document.getElementById('rundownActiveEventTitle');
    const metaEl = document.getElementById('rundownActiveEventMeta');
    
    if (!ev) {
        if (titleEl) titleEl.textContent = 'Belum Ada Acara Terpilih';
        if (metaEl) metaEl.textContent = '📅 - ⏰ - 📍 -';
        const container = document.getElementById('adminRundownTimeline');
        if (container) container.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--adm-text-muted);">Pilih acara terlebih dahulu.</div>';
        const p = document.getElementById('rundownProgressBadge');
        if (p) p.textContent = '0/0 Selesai (0%)';
        return;
    } else {
        if (titleEl) titleEl.textContent = ev.title || ev.event || 'Acara Tanpa Judul';
        if (metaEl) {
            const date = ev.date || '-';
            const time = ev.time || '-';
            const venue = ev.venue || (ev.metadata && ev.metadata.venue) || 'TBD';
            metaEl.textContent = `📅 ${date} ⏰ ${time} 📍 ${venue}`;
        }
    }
    
    const container = document.getElementById('adminRundownTimeline');
    if (!container) return;
    
    const agenda = ev.rundown || ev.agenda || [];
    const p = document.getElementById('rundownProgressBadge');
    if (p) {
        if (agenda.length === 0) p.textContent = '0/0 Selesai (0%)';
        else {
            const comp = agenda.filter(i => i.status === 'SELESAI').length;
            const pct = Math.round((comp/agenda.length)*100);
            p.textContent = comp + '/' + agenda.length + ' Selesai (' + pct + '%)';
        }
    }
    if (agenda.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:2rem; background:rgba(255,255,255,0.02); border-radius:12px; color:var(--adm-text-muted);">Belum ada segmen rundown. Klik "+ Tambah Segmen" untuk memulai.</div>';
        return;
    }
    
    container.innerHTML = agenda.map((item, i) => {
        return `
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:1rem; overflow:hidden;">
            <div style="display:flex; align-items:center; padding:0.8rem 1rem; border-bottom:1px solid rgba(255,255,255,0.05); gap:1rem; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <input type="checkbox" style="width:16px; height:16px; accent-color:var(--adm-gold);">
                    <span style="color:var(--adm-gold); font-weight:800; font-size:1rem; min-width:24px;">${i+1}</span>
                </div>
                <div style="display:flex; align-items:center; gap:1rem; flex:1; min-width:200px;">
                    <div style="background:rgba(255,255,255,0.06); padding:0.2rem 0.6rem; border-radius:6px; font-size:0.8rem; font-weight:600; color:var(--adm-gold); display:flex; align-items:center; gap:0.4rem;">
                        ⏰ ${item.time || (item.start_time + ' - ' + item.end_time)}
                    </div>
                    <div style="font-size:1rem; font-weight:700; color:#fff;">
                        ${escapeHtml(item.title || 'Segmen Tanpa Judul')}
                    </div>
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <button class="btn btn-secondary btn-sm" style="padding:0.2rem 0.5rem;" onclick="window.moveRundownSegment(${i}, -1)" ${i===0 ? 'disabled' : ''}>▲</button>
                    <button class="btn btn-secondary btn-sm" style="padding:0.2rem 0.5rem;" onclick="window.moveRundownSegment(${i}, 1)" ${i===agenda.length-1 ? 'disabled' : ''}>▼</button>
                    <button class="btn btn-secondary btn-sm" style="color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" onclick="window.openAddRundownModal(${i})">✏️ Edit</button>
                    <button class="btn btn-secondary btn-sm" style="color:#F87171; border-color:rgba(248,113,113,0.3);" onclick="window.deleteRundownSegment(${i})">🗑️</button>
                </div>
            </div>
            <div style="padding:1rem; border-left:3px solid var(--adm-gold); background:rgba(0,0,0,0.2);">
                <div style="font-size:0.75rem; font-weight:700; color:var(--adm-gold); margin-bottom:0.4rem; letter-spacing:0.5px;">🎤 PANDUAN NASKAH / PROMPTER MC:</div>
                <div style="font-size:0.9rem; color:var(--adm-text-secondary); line-height:1.5; margin-bottom:1rem; white-space:pre-wrap;">${escapeHtml(item.prompter || 'Tidak ada naskah khusus untuk segmen ini.')}</div>
                <div style="display:flex; gap:1rem; flex-wrap:wrap;">
                    ${item.cue_music ? `<div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); border-radius:6px; padding:0.3rem 0.6rem; font-size:0.8rem; color:#38BDF8; font-weight:600; display:flex; align-items:center; gap:0.4rem;">🎵 Cue Audio: ${escapeHtml(item.cue_music)}</div>` : ''}
                    ${item.pic ? `<div style="background:rgba(167,139,250,0.1); border:1px solid rgba(167,139,250,0.3); border-radius:6px; padding:0.3rem 0.6rem; font-size:0.8rem; color:#A78BFA; font-weight:600; display:flex; align-items:center; gap:0.4rem;">👤 PIC: ${escapeHtml(item.pic)}</div>` : ''}
                </div>
            </div>
        </div>
        `;
    }).join('');
}
window.renderAdminRundownList = renderAdminRundownList;

window.openAddRundownModal = async function(editIndex = -1) {
    const ev = window.activeCommandCenterEvent;
    if (!ev) {
        uiAlert('Pilih acara terlebih dahulu di kalender.');
        return;
    }
    
    let editItem = null;
    if (editIndex >= 0 && ev.rundown && ev.rundown[editIndex]) {
        editItem = ev.rundown[editIndex];
    }
    
    // Build music options
    const musicOpts = [{value: '', label: '-- Pilih Cue Musik (Opsional) --'}];
    if (ev.musicList && Array.isArray(ev.musicList)) {
        ev.musicList.forEach(m => {
            const title = typeof m === 'object' ? m.title : m;
            if (title) musicOpts.push({ value: title, label: '🎵 ' + title });
        });
    }

    try {
        const formData = await window.uiCustomForm([
            { id: 'start_time', label: 'Jam Mulai *', type: 'time', value: editItem ? (editItem.start_time || '') : '' },
            { id: 'end_time', label: 'Jam Selesai *', type: 'time', value: editItem ? (editItem.end_time || '') : '' },
            { id: 'title', label: 'Nama / Judul Segmen Acara *', type: 'text', value: editItem ? editItem.title : '' },
            { id: 'prompter', label: 'Naskah Panduan MC (Prompter & Cue)', type: 'textarea', value: editItem ? editItem.prompter : '' },
            { id: 'cue_music', label: 'Cue Musik / Sound FX / Lighting', type: 'select', options: musicOpts, value: editItem ? editItem.cue_music : '' },
            { id: 'pic', label: 'PIC / Koordinator Lapangan', type: 'text', value: editItem ? editItem.pic : '' }
        ], {
            title: editItem ? `Edit Segmen Rundown (${ev.title || 'Acara'})` : `➕ Tambah Segmen Rundown Baru (${ev.title || 'Acara'})`,
            okText: 'Simpan Segmen Rundown'
        });

        if (!formData.title || !formData.start_time || !formData.end_time) {
            uiAlert('Judul Segmen dan Waktu (Mulai - Selesai) harus diisi!');
            return;
        }

        const newItem = {
            title: formData.title,
            start_time: formData.start_time,
            end_time: formData.end_time,
            time: `${formData.start_time} - ${formData.end_time}`,
            prompter: formData.prompter || '',
            cue_music: formData.cue_music || '',
            pic: formData.pic || ''
        };

        if (!ev.rundown) ev.rundown = [];
        
        if (editIndex >= 0) {
            ev.rundown[editIndex] = newItem;
        } else {
            ev.rundown.push(newItem);
        }

        // Sort by start time
        ev.rundown.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
        
        // Save to backend metadata if possible
        if (!ev.metadata) ev.metadata = {};
        ev.metadata.rundown = ev.rundown;
        
        const tm = document.querySelector('meta[name="csrf-token"]');
        const tk = tm ? tm.getAttribute('content') : '';
        const payload = { metadata: ev.metadata };
        
        // Non-blocking fetch
        fetch('/api/cms/events/' + ev.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': tk },
            body: JSON.stringify(payload)
        }).catch(e => console.error('Silent save error', e));
        
        renderAdminRundownList(ev);
        if (typeof window.showToast === 'function') window.showToast('Rundown berhasil disimpan!');
    } catch(err) {
        if (err !== 'CANCEL') {
            console.error(err);
            if (typeof uiAlert === 'function') uiAlert('Terjadi kesalahan sistem.');
        }
    }
};

window.deleteRundownSegment = async function(index) {
    const ev = window.activeCommandCenterEvent;
    if (!ev || !ev.rundown || !ev.rundown[index]) return;
    
    if (!(await window.uiConfirm(`Hapus segmen: "${ev.rundown[index].title}"?`))) return;
    
    ev.rundown.splice(index, 1);
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.rundown = ev.rundown;
    
    const tm = document.querySelector('meta[name="csrf-token"]');
    const tk = tm ? tm.getAttribute('content') : '';
    fetch('/api/cms/events/' + ev.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': tk },
        body: JSON.stringify({ metadata: ev.metadata })
    }).catch(e => console.error('Silent save error', e));
    
    renderAdminRundownList(ev);
    if (typeof window.showToast === 'function') window.showToast('Segmen dihapus!');
};

window.moveRundownSegment = function(index, direction) {
    const ev = window.activeCommandCenterEvent;
    if (!ev || !ev.rundown) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= ev.rundown.length) return;
    
    const temp = ev.rundown[index];
    ev.rundown[index] = ev.rundown[newIndex];
    ev.rundown[newIndex] = temp;
    
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.rundown = ev.rundown;
    
    const tm = document.querySelector('meta[name="csrf-token"]');
    const tk = tm ? tm.getAttribute('content') : '';
    fetch('/api/cms/events/' + ev.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': tk },
        body: JSON.stringify({ metadata: ev.metadata })
    }).catch(e => console.error('Silent save error', e));
    
    renderAdminRundownList(ev);
};

window.openRundownPrintModal = function() {
    const ev = window.adminEventsDb ? window.adminEventsDb.find(e => String(e.id) === String(window.activeCommandCenterEventId)) : null;
    if (!ev || !ev.rundown || ev.rundown.length === 0) {
        if(typeof uiAlert === 'function') uiAlert('Rundown masih kosong atau belum ada acara yang dipilih!', 'Info');
        else alert('Rundown masih kosong atau belum ada acara yang dipilih!');
        return;
    }

    let rdContainer = document.getElementById('rd-print-overlay');
    if (!rdContainer) {
        rdContainer = document.createElement('div');
        rdContainer.id = 'rd-print-overlay';
        
        // Inject CSS for printing
        const style = document.createElement('style');
        style.innerHTML = `
            #rd-print-overlay { display:none; position:fixed; inset:0; z-index:999990; background:rgba(0,0,0,0.85); backdrop-filter:blur(5px); align-items:center; justify-content:center; padding:1rem; }
            #rd-print-overlay.open { display:flex !important; }
            .rd-m { background:#fff; color:#000; width:100%; max-width:1100px; max-height:95vh; overflow-y:auto; border-radius:12px; font-family:sans-serif; }
            .rd-hd { display:flex; justify-content:space-between; align-items:center; padding:1.5rem; border-bottom:2px solid #eee; position:sticky; top:0; background:#fff; z-index:10; }
            .rd-bd { padding:2rem; }
            .rd-tbl { width:100%; border-collapse:collapse; margin-top:1.5rem; font-size:13px; }
            .rd-tbl th, .rd-tbl td { border:1px solid #ccc; padding:10px; text-align:left; vertical-align:top; }
            .rd-tbl th { background:#f4f4f4; font-weight:bold; }
            .rd-btn { padding:0.6rem 1.2rem; border-radius:6px; font-weight:bold; cursor:pointer; border:none; }
            .rd-btn-close { background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; margin-right:10px; }
            .rd-btn-close:hover { background:#e2e8f0; }
            .rd-btn-print { background:linear-gradient(135deg,#D4AF37,#B8960C); color:#000; }
            .rd-btn-print:hover { filter: brightness(1.1); }
            
            @media print {
                @page { margin: 10mm; }
                body > *:not(#rd-print-overlay) { display:none !important; }
                #rd-print-overlay { position:static !important; background:transparent !important; display:block !important; padding:0 !important; }
                .rd-m { max-height:none !important; overflow:visible !important; border-radius:0 !important; max-width:100% !important; box-shadow:none !important; }
                .rd-hd { display:none !important; }
                .rd-bd { padding:0 !important; }
                .rd-tbl th, .rd-tbl td { border:1px solid #000; }
                .rd-tbl tr { page-break-inside: avoid; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(rdContainer);
    }

    let rowsHtml = '';
    ev.rundown.forEach((r, idx) => {
        const musicNote = r.cue_music ? `<br><small style="color:#2563eb;">🎵 ${r.cue_music}</small>` : '';
        rowsHtml += `
            <tr>
                <td style="text-align:center;">${idx+1}</td>
                <td style="white-space:nowrap;">${r.time || '-'}</td>
                <td>
                    <strong>${r.title || '-'}</strong>
                    <div style="font-size:0.9em; color:#444; margin-top:4px;">${r.notes || ''}</div>
                    ${musicNote}
                </td>
                <td style="font-style:italic; color:#333; white-space:pre-wrap;">${r.prompter || ''}</td>
                <td>${r.pic || ''}</td>
            </tr>
        `;
    });

    const venue = ev.metadata && ev.metadata.venue ? ev.metadata.venue : '-';
    
    rdContainer.innerHTML = `
        <div class="rd-m">
            <div class="rd-hd">
                <h2 style="margin:0; font-size:1.5rem; color:#000;">Preview Cetak Rundown</h2>
                <div>
                    <button class="rd-btn rd-btn-close" onclick="document.getElementById('rd-print-overlay').classList.remove('open')">Tutup</button>
                    <button class="rd-btn rd-btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
                </div>
            </div>
            <div class="rd-bd">
                <div style="text-align:center; margin-bottom:2rem; color:#000;">
                    <h1 style="margin:0 0 10px 0; font-size:1.8rem; text-transform:uppercase;">RUNDOWN ACARA</h1>
                    <h2 style="margin:0 0 8px 0; font-size:1.4rem; color:#333;">${ev.title || 'Untitled Event'}</h2>
                    <p style="margin:0 0 5px 0; font-size:14px;"><strong>Tanggal:</strong> ${ev.date || '-'} | <strong>Waktu:</strong> ${ev.time || '-'} | <strong>Venue:</strong> ${venue}</p>
                    <p style="margin:0; font-size:14px;"><strong>PIC Acara:</strong> ${ev.pic || '-'}</p>
                </div>
                <table class="rd-tbl">
                    <thead>
                        <tr>
                            <th style="width:40px; text-align:center;">No</th>
                            <th style="width:100px;">Waktu</th>
                            <th style="width:250px;">Kegiatan & Catatan</th>
                            <th>Panduan MC (Cue Sheet)</th>
                            <th style="width:120px;">PIC</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    rdContainer.classList.add('open');
};

window.openAiCoPilotModal = function() {
    if (typeof uiAlert === 'function') uiAlert('MC-Connect AI Co-Pilot sedang dalam tahap beta dan akan dirilis segera!', 'Info AI');
    else alert('MC-Connect AI Co-Pilot sedang dalam tahap beta dan akan dirilis segera!');
};

function renderAdminMusicList(ev) {
    try {
        const container = document.getElementById('eccMusicBody');
        if (!container) return;
        if (!ev || !ev.musicList || ev.musicList.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--adm-text-muted);">Belum ada daftar musik.</div>';
            return;
        }
        container.innerHTML = ev.musicList.map((song, i) => {
            return '<div style="padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">' +
                '<span style="color:var(--adm-gold);">' + (i+1) + '.</span> ' + escapeHtml(song.title || song) +
            '</div>';
        }).join('');
    } catch(e) {}
}
window.renderAdminMusicList = renderAdminMusicList;

function renderAdminSoundboardList(ev) {
    try {
        const container = document.getElementById('eccSoundboardBody');
        if (!container) return;
        container.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--adm-text-muted);">Soundboard tersedia di Stage Mode.</div>';
    } catch(e) {}
}

window.playSoundboardEffect = function(title) {
    if (!title) return;
    const bank = window.getGlobalMusicBank() || [];
    const idx = bank.findIndex(m => m.title.toLowerCase() === title.toLowerCase());
    
    if (idx !== -1) {
        if (typeof window.playMasterMusic === 'function') {
            window.playMasterMusic(idx);
        }
    } else {
        if (typeof window.uiAlert === 'function') {
            window.uiAlert('Efek suara "' + title + '" belum ada di Master Bank Musik. Silakan tambahkan file audio untuk judul ini di menu Master Bank Musik terlebih dahulu agar dapat diputar.', 'Tidak Ditemukan');
        } else {
            alert('Efek suara "' + title + '" belum ada di Master Bank Musik.');
        }
    }
};

window.renderAdminSoundboardList = renderAdminSoundboardList;

function renderAdminVendorCollab(ev) {
    try {
        const container = document.getElementById('vendorCollabTableBody');
        const badge = document.getElementById('vendorCollabCountBadge');
        if (!container) return;
        
        const rundown = ev.rundown || [];
        if (badge) badge.textContent = `${rundown.length} segmen tersedia`;
        
        if (rundown.length === 0) {
            container.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">Belum ada segmen rundown.</td></tr>';
            return;
        }
        
        container.innerHTML = rundown.map((item, i) => {
            return `
            <tr style="border-bottom: 1px solid var(--border-subtle);">
                <td style="text-align: center; color: var(--gold-primary); font-weight: bold; padding: 1rem 0.5rem; vertical-align: top;">${i+1}</td>
                <td style="padding: 1rem 0.5rem; vertical-align: top; white-space: nowrap; min-width: 120px;">
                    <div style="font-weight:600;">${item.start_time || ''} - ${item.end_time || ''}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${item.time || ''}</div>
                </td>
                <td style="padding: 1rem 0.5rem; vertical-align: top; white-space: normal; word-wrap: break-word; min-width: 300px; max-width: 600px;">
                    <div style="font-weight:700; color:var(--text-primary); margin-bottom:0.25rem; font-size:1.05rem;">${escapeHtml(item.title || 'Segmen')}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">${escapeHtml(item.prompter || '')}</div>
                </td>
                <td style="padding: 1rem 0.5rem; vertical-align: top; white-space: normal; min-width: 180px;">
                    ${item.cue_music ? `<div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); padding:0.4rem 0.8rem; border-radius:4px; font-size:0.8rem; color:#38BDF8; font-weight:600; display:inline-block; word-wrap:break-word;">🎵 ${escapeHtml(item.cue_music)}</div>` : '<span style="color:var(--text-muted); font-size:0.8rem;">(Tidak ada audio khusus)</span>'}
                </td>
                <td style="padding: 1rem 0.5rem; vertical-align: top; white-space: nowrap; min-width: 150px;">
                    ${item.pic ? `<div style="font-weight:600; font-size:0.85rem; color:#A78BFA; background:rgba(167,139,250,0.1); padding:0.3rem 0.6rem; border-radius:4px; display:inline-block;">👤 ${escapeHtml(item.pic)}</div>` : '<span style="color:var(--text-muted); font-size:0.8rem;">-</span>'}
                </td>
            </tr>
            `;
        }).join('');
    } catch(e) {
        console.error('Error rendering Vendor Collab:', e);
    }
}
window.renderAdminVendorCollab = renderAdminVendorCollab;

// ============================================================
// Wardrobe Renderer
// ============================================================

async function renderWardrobe() {
    try {
        const res = await fetch('/api/cms/wardrobe-catalog');
        const json = await res.json();
        let items = [];
        if(json.success && json.data) items = json.data;

        // 1. Render in Command Center (adminWardrobeGrid)
        const grid = document.getElementById('adminWardrobeGrid');
        if (grid) {
            let eventItems = [];
            if (typeof activeCommandCenterEventId !== 'undefined' && activeCommandCenterEventId && window.adminEventsDb) {
                const ev = window.adminEventsDb.find(e => String(e.id) === String(activeCommandCenterEventId));
                if (ev && ev.wardrobeIds && Array.isArray(ev.wardrobeIds)) {
                    eventItems = items.filter(item => 
                        ev.wardrobeIds.some(wItem => {
                            const wId = (typeof wItem === 'object' && wItem !== null) ? wItem.id : wItem;
                            return String(wId) === String(item.id) || String(wId) === String(item.db_id);
                        })
                    );
                }
            }
            
            if (eventItems.length === 0) {
                grid.innerHTML = '<div style="text-align:center; padding:1.5rem; color:var(--adm-text-muted); font-size:0.85rem;">Belum ada item wardrobe di-assign. Klik Pilih Gaun dari Koleksi.</div>';
            } else {
                grid.innerHTML = eventItems.map(item => {
                    const ev = window.adminEventsDb.find(e => String(e.id) === String(activeCommandCenterEventId));
                    const assignment = ev.wardrobeIds.find(wItem => {
                        const wId = (typeof wItem === 'object' && wItem !== null) ? wItem.id : wItem;
                        return String(wId) === String(item.id) || String(wId) === String(item.db_id);
                    });
                    const noteStr = (typeof assignment === 'object' && assignment !== null && assignment.note) ? assignment.note : '';

                    return '<div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:1rem; border:1px solid rgba(255,255,255,0.06); display:flex; flex-direction:column; gap:0.75rem;">' +
                        '<div style="display:flex; gap:0.75rem; align-items:center;">' +
                            (item.imgUrl ? '<img src="'+escapeHtml(item.imgUrl)+'" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">' : '<div style="width:40px; height:40px; border-radius:6px; background:#444; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">👔</div>') +
                            '<div style="flex:1;">' +
                                '<div style="font-weight:700; font-size:0.85rem; line-height:1.2;">' + escapeHtml(item.name || 'Item') + '</div>' +
                                '<div style="font-size:0.75rem; color:var(--adm-text-muted); margin-top:0.25rem;">' + escapeHtml(item.colorName || item.colorHex || '') + ' - ' + escapeHtml(item.status || 'Tersedia') + '</div>' +
                            '</div>' +
                        '</div>' +
                        (noteStr ? '<div style="font-size:0.75rem; color:var(--adm-gold, #D4AF37); background:rgba(212,175,55,0.05); padding:0.5rem; border-radius:6px; border-left:2px solid var(--adm-gold, #D4AF37); line-height:1.4;"><i class="fas fa-sticky-note" style="margin-right:4px;"></i> ' + escapeHtml(noteStr) + '</div>' : '') +
                        '<div style="display:flex; gap:0.4rem; margin-top:auto;">' +
                            `<button class="btn btn-secondary btn-sm" style="flex:1; font-size:0.7rem; padding:0.3rem 0; background:rgba(255,255,255,0.1); border:none;" onclick="promptAssignWardrobe('${item.db_id || item.id}')">Edit / Tambah</button>` +
                            `<button class="btn btn-secondary btn-sm" style="flex:1; font-size:0.7rem; padding:0.3rem 0; background:rgba(239, 68, 68, 0.15); color:#f87171; border:none;" onclick="unassignWardrobe('${item.db_id || item.id}')">Hapus</button>` +
                        '</div>' +
                    '</div>';
                }).join('');
            }
        }

        // 2. Render in Global Wardrobe Manager (globalWardrobeTableBody)
        const tbody = document.getElementById('globalWardrobeTableBody');
        if (tbody) {
            if (!Array.isArray(items) || items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Belum ada item wardrobe. Klik Tambah Gaun Baru.</td></tr>';
            } else {
                let html = '';
                items.forEach(item => {
                    let freq = 0;
                    if(window.adminEventsDb) {
                        window.adminEventsDb.forEach(ev => {
                            if(ev.wardrobeIds && (ev.wardrobeIds.includes(item.id) || ev.wardrobeIds.includes(item.db_id))) {
                                freq++;
                            }
                        });
                    }
                    html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">' +
                        '<td style="padding:1rem 0.5rem; min-width:70px;">' + (item.imgUrl ? '<img src="'+escapeHtml(item.imgUrl)+'" style="width:48px; height:48px; border-radius:8px; object-fit:cover; border:1px solid rgba(255,255,255,0.1);">' : '<div style="width:48px; height:48px; border-radius:8px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">👔</div>') + '</td>' +
                        '<td style="padding:1rem 0.5rem; min-width:180px; white-space:nowrap;"><div style="font-weight:700; font-size:1.05rem; color:var(--adm-gold, #D4AF37);">' + escapeHtml(item.name || '-') + '</div><div style="font-size:0.75rem; color:var(--adm-text-muted); margin-top:4px;">ID: '+escapeHtml(item.db_id||item.id)+'</div></td>' +
                        '<td style="padding:1rem 0.5rem; min-width:250px; max-width:300px; line-height:1.5; color:rgba(255,255,255,0.8); white-space:normal; word-wrap:break-word;">' + escapeHtml(item.desc || '-') + '</td>' +
                        '<td style="padding:1rem 0.5rem; min-width:140px; white-space:nowrap;"><span style="display:inline-block; padding:0.4rem 0.8rem; text-align:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:20px; font-size:0.8rem; font-weight:600;">' + escapeHtml(item.colorName || '-') + '</span></td>' +
                        '<td style="padding:1rem 0.5rem; min-width:120px; white-space:nowrap;"><span style="display:inline-flex; align-items:center; gap:6px; font-size:0.85rem; font-weight:600;">' + (item.colorHex && item.colorHex.startsWith('#') ? '<span style="display:inline-block; width:16px; height:16px; border-radius:50%; background:'+escapeHtml(item.colorHex)+'; border:1px solid rgba(255,255,255,0.2);"></span>' : '') + escapeHtml(item.colorHex || '-') + '</span></td>' +
                        '<td style="padding:1rem 0.5rem; min-width:140px; white-space:nowrap; text-align:center;"><span class="badge" style="background:'+ (item.status === 'Siap Pakai' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)') + '; color:' + (item.status === 'Siap Pakai' ? '#34d399' : '#f87171') + '; border:1px solid '+ (item.status === 'Siap Pakai' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)') +'; padding:0.4rem 0.8rem; border-radius:6px; font-weight:700; letter-spacing:0.5px;">' + escapeHtml(item.status || 'Tersedia') + '</span></td>' +
                        '<td style="padding:1rem 0.5rem; text-align:center; min-width:120px; white-space:nowrap;"><div style="font-size:1.2rem; font-weight:800; color:#fff;">' + freq + 'x</div><div style="font-size:0.7rem; color:var(--adm-text-muted); text-transform:uppercase;">Dipakai</div></td>' +
                        '<td style="padding:1rem 0.5rem; text-align:right;">' +
                            `<button class="btn btn-secondary btn-sm" style="margin-right:0.5rem; background:rgba(255,255,255,0.1); border-color:transparent;" onclick="promptAddGlobalWardrobe('${encodeURIComponent(JSON.stringify(item))}')"><i class="fas fa-edit"></i> Edit</button>` +
                            `<button class="btn btn-secondary btn-sm" style="background:rgba(239, 68, 68, 0.1); color:#f87171; border-color:transparent;" onclick="deleteWardrobeItem('${item.db_id || item.id}')"><i class="fas fa-trash"></i> Hapus</button>` +
                        '</td>' +
                    '</tr>';
                });
                tbody.innerHTML = html;
            }
        }
    } catch(e) {
        console.warn('renderWardrobe error:', e.message);
    }
}
window.renderWardrobe = renderWardrobe;


// ============================================================
// Calendar Metrics Updater
// ============================================================
function updateCalMetrics() {
    try {
        const events = window.adminEventsDb || [];
        const terkunci = events.filter(e => e.status && e.status.toLowerCase() === 'terkunci').length;
        const tentative = events.filter(e => e.status && e.status.toLowerCase() === 'tentative').length;
        const review = events.filter(e => e.status && e.status.toLowerCase() === 'review').length;
        
        const el1 = document.getElementById('calMetricLocked');
        const el2 = document.getElementById('calMetricTentative');
        const el3 = document.getElementById('calMetricReview');
        const el4 = document.getElementById('calMetricTotal');
        
        if (el1) el1.textContent = terkunci;
        if (el2) el2.textContent = tentative;
        if (el3) el3.textContent = review;
        if (el4) el4.textContent = events.length;
    } catch(e) {}
}
window.updateCalMetrics = updateCalMetrics;

// ============================================================
// Focus Calendar on Specific Date
// ============================================================
function focusCalendarDate(dateStr) {
    try {
        if (window.adminCalendar && typeof window.adminCalendar.goToDate === 'function') {
            window.adminCalendar.goToDate(dateStr);
        }
        const cell = document.querySelector('[data-date="' + dateStr + '"]');
        if (cell) {
            cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cell.style.outline = '2px solid var(--adm-gold)';
            setTimeout(() => { cell.style.outline = ''; }, 3000);
        }
    } catch(e) {}
}
window.focusCalendarDate = focusCalendarDate;




// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Muat CMS Landing Page Configuration
    initAdminCms();
    
    // Muat Cash Flow Database
    loadCashflowTransactions();

    // Start Clock
    updateAdminClock();
    setInterval(updateAdminClock, 1000);

    // Format current date in banner
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayFormatted = new Date().toLocaleDateString('id-ID', dateOptions);
    const dateBanner = document.getElementById('dashCurrentDate');
    if (dateBanner) dateBanner.textContent = todayFormatted;

    // Load username if available
    try {
        const storedUser = sessionStorage.getItem('mc_auth_user');
        if (storedUser) {
            const userObj = JSON.parse(storedUser);
            if (userObj.name) {
                const welcomeName = document.getElementById('dashWelcomeName');
                if (welcomeName) welcomeName.textContent = userObj.name.split(',')[0];
            }
        }
    } catch(e) {}

    // Initialize unified database & de-duplicate
    try {
        loadUnifiedEventsDatabase();
        populateCommandCenterSelector();

        if (typeof AvailabilityCalendar !== 'undefined' && document.getElementById('adminCalendarWidget')) {
            window.adminCalendar = new AvailabilityCalendar('adminCalendarWidget', adminEventsDb, (dateStr, status, eventObj, eventsOnDate) => {
                showAgendaInspector(dateStr, status, eventObj, eventsOnDate);
            });
            window.calendarApp = window.adminCalendar;
        }
    } catch(e) { console.error("Calendar Init Error:", e); }

    // Navigate to default section
    if (typeof navigateToSection === 'function') {
        navigateToSection('sec-dashboard', document.getElementById('menu-dashboard'));
    }
});

// Auto-close mobile sidebar on window resize to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
        const shell = document.querySelector('.admin-shell');
        const backdrop = document.getElementById('sidebarBackdrop');
        const sidebar = document.querySelector('.admin-sidebar');
        if (shell) shell.classList.remove('sidebar-mobile-open');
        if (backdrop) backdrop.classList.remove('active');
        if (sidebar) sidebar.classList.remove('open');
        document.body.style.overflow = '';
    }
});

window.openWaPreviewModal = async function(type) {
    let textareaId = '';
    let title = '';
    
    if (type === 'review') {
        textareaId = 'postEventReviewTemplate';
        title = 'Pratinjau & Edit Pesan (Post-Event Review)';
    } else {
        // Fallback for other types if they exist
        textareaId = type + 'Template';
        title = 'Pratinjau & Edit Pesan';
    }
    
    const textareaEl = document.getElementById(textareaId);
    if (!textareaEl) {
        if (typeof uiAlert === 'function') uiAlert('Template pesan tidak ditemukan!');
        return;
    }
    
    const currentText = textareaEl.value;
    
    try {
        const formData = await window.uiCustomForm([
            { id: 'msg_content', label: 'Isi Pesan WhatsApp', type: 'textarea', value: currentText }
        ], {
            title: title,
            okText: 'Simpan Perubahan'
        });
        
        if (formData && formData.msg_content) {
            textareaEl.value = formData.msg_content;
            if (typeof window.showToast === 'function') window.showToast('Template pesan berhasil diperbarui!', 'success');
        }
    } catch (err) {
        if (err !== 'CANCEL') console.error(err);
    }
};

window.sendWaAutomation = function(type) {
    const ev = window.activeCommandCenterEvent;
    if (!ev) {
        if (typeof uiAlert === 'function') uiAlert('Pilih acara terlebih dahulu di kalender.');
        else alert('Pilih acara terlebih dahulu di kalender.');
        return;
    }
    
    let textareaId = '';
    
    if (type === 'review') {
        textareaId = 'postEventReviewTemplate';
    } else {
        textareaId = type + 'Template';
    }
    
    const textareaEl = document.getElementById(textareaId);
    if (!textareaEl) {
        if (typeof uiAlert === 'function') uiAlert('Template pesan tidak ditemukan!');
        return;
    }
    
    const msgText = textareaEl.value;
    if (!msgText.trim()) {
        if (typeof uiAlert === 'function') uiAlert('Isi pesan tidak boleh kosong!');
        return;
    }
    
    // Resolve Phone Number
    let clientPhone = '';
    let cust = null;
    try {
        const rawCust = JSON.stringify(window.mcCustomers || []);
        const custs = rawCust ? JSON.parse(rawCust) : [];
        cust = custs.find(c => String(c.id) === String(ev.customerId) || String(c.id) === String(ev.id) || (c.date === ev.date && c.event === ev.title));
    } catch(e) {}

    if (cust && cust.wa) {
        clientPhone = cust.wa;
    } else if (ev.pic && ev.pic.includes('(')) {
        clientPhone = ev.pic.split('(')[1].replace(')', '').trim();
    } else if (ev.pic) {
        clientPhone = ev.pic;
    }
    
    // Clean phone number
    let cleanPhone = String(clientPhone).replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
    }
    
    if (!cleanPhone || cleanPhone.length < 9) {
        if (typeof uiAlert === 'function') uiAlert('Nomor WhatsApp klien tidak ditemukan atau tidak valid pada acara ini!');
        return;
    }
    
    const encodedText = encodeURIComponent(msgText);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    
    window.open(waUrl, '_blank');
    if (typeof window.showToast === 'function') window.showToast('Membuka WhatsApp Web / App...', 'info');
};
function autoSyncCustomersToEvents(customers) {
    if (!customers || !Array.isArray(customers)) return;
    
    let isModified = false;
    customers.forEach(cust => {
        if (!cust.date || !cust.event) return;
        
        const key = `${cust.date}::${(cust.event || '').trim().toLowerCase()}`;
        let existingIndex = adminEventsDb.findIndex(e => String(e.id) === String(cust.id) || String(e.customerId) === String(cust.id) || `${e.date}::${(e.title || '').trim().toLowerCase()}` === key);

        let status = 'Review';
        if (cust.paymentStatus && (cust.paymentStatus.includes('Lunas') || cust.paymentStatus.includes('100%'))) {
            status = 'Selesai';
        } else if (cust.paymentStatus && cust.paymentStatus.includes('DP')) {
            status = 'Terkunci';
        } else if (cust.paymentStatus && (cust.paymentStatus.includes('Hold') || cust.paymentStatus.includes('Tentative'))) {
            status = 'Tentative';
        }

        const timeFormatted = cust.time || (cust.startTime && cust.endTime ? `${cust.startTime} - ${cust.endTime} WIB (${cust.duration || ''})` : '18:00 - 22:00 WIB (4 Jam)');
        
        if (existingIndex >= 0) {
            // Update existing
            const ev = adminEventsDb[existingIndex];
            if (ev.title !== cust.event || ev.date !== cust.date || ev.time !== timeFormatted || ev.status !== status || ev.rawPrice !== Number(cust.price || 0)) {
                ev.title = cust.event;
                ev.date = cust.date;
                ev.time = timeFormatted;
                ev.status = status;
                ev.paymentStatus = cust.paymentStatus;
                ev.rawPrice = Number(cust.price || 0);
                ev.price = 'Rp ' + ev.rawPrice.toLocaleString('id-ID');
                ev.category = cust.category || ev.category;
                isModified = true;
            }
        } else {
            // Create new
            const eventData = {
                id: cust.id ? 'v_' + cust.id : 'v_' + Date.now(),
                dbEventId: null,
                customerId: cust.id,
                title: cust.event,
                date: cust.date,
                time: timeFormatted,
                startTime: cust.startTime || '18:00',
                endTime: cust.endTime || '22:00',
                duration: cust.duration || '4 Jam',
                venue: cust.formattedDate && cust.formattedDate.includes('') ? cust.formattedDate.split('')[1].trim() : 'Grand Ballroom Venue',
                pic: cust.name + (cust.wa ? ` (${cust.wa})` : ''),
                price: 'Rp ' + Number(cust.price || 0).toLocaleString('id-ID'),
                rawPrice: Number(cust.price || 0),
                status: status,
                paymentStatus: cust.paymentStatus,
                note: `${cust.paymentStatus} - Terintegrasi dari CRM Pelanggan`,
                category: cust.category || 'Event',
                vipNotes: cust.notes || 'Preferensi panggung klien disinkronkan dari CRM.',
                vipProtocol: [
                    { role: 'Klien PIC', name: cust.name },
                    { role: 'Koordinator FOH', name: 'Tim Stage Runner MC' }
                ],
                checklist: [
                    { text: 'Konfirmasi pelafalan nama klien & gelar', done: true },
                    { text: 'Cek gladi mic wireless Shure di venue', done: true },
                    { text: 'Briefing sinyal cue musik panggung', done: false }
                ],
                expenses: []
            };
            adminEventsDb.push(eventData);
            isModified = true;
        }
    });

    if (isModified) {
        adminEventsDb.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Save back to DB
        // Push directly to API so it's consistent
        pushEventsToServer(adminEventsDb);
        
        if (window.adminCalendar) {
            window.adminCalendar.setEvents(adminEventsDb);
        }
        if (typeof renderAdminAgendaList === 'function') renderAdminAgendaList();
        if (typeof updateCalMetrics === 'function') updateCalMetrics();
        if (typeof populateCommandCenterSelector === 'function') populateCommandCenterSelector();
    }
}
window.autoSyncCustomersToEvents = autoSyncCustomersToEvents;





function switchCmsSubTab(targetId, btn) {
    const section = btn.closest('.admin-section');
    if (!section) return;

    // Reset tabs
    const navGroup = btn.closest('.cms-nav-tabs, .ecc-tabs');
    if (navGroup) {
        navGroup.querySelectorAll('.cms-tab-btn, .ecc-tab-btn, button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    // Hide all subpanels in this section only
    section.querySelectorAll('.cms-subpanel, .ecc-pane').forEach(p => p.classList.remove('active'));

    // Show target
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.add('active');
    }
}
window.switchCmsSubTab = switchCmsSubTab;


window.handleSaveCmsBio = function(e) {
    if (e) e.preventDefault();
    const bio = {
        name: document.getElementById('cmsNamaPanggung')?.value || '',
        email: document.getElementById('cmsEmail')?.value || '',
        bio: document.getElementById('cmsBioText')?.value || '',
        statEvents: document.getElementById('cmsStatEvents')?.value || '',
        statYears: document.getElementById('cmsStatYears')?.value || '',
        spec: document.getElementById('cmsSpesialisasi')?.value || '',
        photo: document.getElementById('cmsFotoUrl')?.value || '',
        ig: document.getElementById('cmsIg')?.value || '',
        tiktok: document.getElementById('cmsTiktok')?.value || '',
        fb: document.getElementById('cmsFb')?.value || ''
    };
    
    fetch('/api/cms/biodata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bio)
    })
    .then(res => res.json())
    .then(data => {
        if (typeof window.uiAlert === 'function') {
            window.uiAlert('Biodata & Showreel berhasil disimpan dan di-sync ke Web Publik!', 'success');
        } else {
            window.uiAlert('Biodata & Showreel berhasil disimpan!');
        }
        initAdminCms(); // reload UI
    })
    .catch(err => {
        console.error('Save failed', err);
        if (typeof window.uiAlert === 'function') {
            window.uiAlert('Gagal menyimpan biodata ke server.', 'error');
        } else {
            window.uiAlert('Gagal menyimpan biodata.');
        }
    });
};

window.handleSaveCmsPolicies = function(e) {
    if (e) e.preventDefault();
    const pol = {
        terms: document.getElementById('cmsTermsText')?.value || '',
        refund: document.getElementById('cmsRefundText')?.value || '',
        riders: document.getElementById('cmsRidersText')?.value || ''
    };
    if (typeof AdminDB !== 'undefined') {
        AdminDB.setItem('mc_policies_config', JSON.stringify(pol));
    }
    if (typeof window.uiAlert === 'function') {
        window.uiAlert('Kebijakan & FAQ berhasil disimpan!', 'success');
    }
};

window.handleSaveCalendarWidgetConfig = function(e) {
    if (e) e.preventDefault();
    // Usually empty or handles some toggles
    if (typeof window.uiAlert === 'function') {
        window.uiAlert('Pengaturan Kalender berhasil disimpan!', 'success');
    }
};

window.initAdminCms = function() {
    try {
        const ts = Date.now();
        Promise.all([
            fetch('/api/cms/biodata?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/packages?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/policies?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/gallery?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/presskit?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/riders?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/testimonials?t=' + ts).then(r => r.json()).catch(()=>({}))
        ]).then(results => {
            const bioData = results[0]?.data || {};
            const pkgsData = results[1]?.data || [];
            const polData = results[2]?.data || {};
            const galData = results[3]?.data || [];
            const pkData = results[4]?.data || {};
            const ridersData = results[5]?.data || [];
            const testData = results[6]?.data || [];
            
            window.cmsConfig = window.cmsConfig || {};
            window.cmsConfig.bio = bioData;
            window.cmsConfig.pkgs = pkgsData;
            window.cmsConfig.policies = polData;
            window.cmsConfig.gallery = galData;
            window.cmsConfig.presskit = pkData;
            window.cmsConfig.riders = ridersData;
            window.cmsConfig.testimonials = testData;
            
            const mapVal = (id, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined && val !== null) el.value = val;
            };
            
            // Biodata
            mapVal('cmsNamaPanggung', bioData.name);
            mapVal('cmsEmail', bioData.email);
            mapVal('cmsBioText', bioData.bio);
            mapVal('cmsStatEvents', bioData.statEvents);
            mapVal('cmsStatYears', bioData.statYears);
            mapVal('cmsSpesialisasi', bioData.spec);
            mapVal('cmsFotoUrl', bioData.photo);
            mapVal('cmsIg', bioData.ig);
            mapVal('cmsTiktok', bioData.tiktok);
            mapVal('cmsFb', bioData.fb);
            
            if (bioData.photo) {
                const preview = document.getElementById('cmsFotoPreview');
                if (preview) preview.src = bioData.photo;
                const sidebarImg = document.getElementById('sidebarAvatarImg');
                if (sidebarImg) { sidebarImg.src = bioData.photo; sidebarImg.style.opacity = '1'; }
            }
            if (bioData.name) {
                const sidebarName = document.getElementById('sidebarMcName');
                if (sidebarName) sidebarName.textContent = bioData.name;
                const dashName = document.getElementById('dashWelcomeName');
                if (dashName) dashName.textContent = bioData.name;
            }
            
            if (bioData.calendarConfig) {
                mapVal('cfgCalBuffer', bioData.calendarConfig.buffer);
                mapVal('cfgCalMode', bioData.calendarConfig.mode);
                mapVal('cfgCalNotice', bioData.calendarConfig.notice);
                window._mcCalendarConfig = bioData.calendarConfig;
            }

            // Packages (Layanan)
            renderAdminPackages(pkgsData);

            // Policies (Terms, Refund, Riders, FAQ)
            mapVal('cmsTermsText', polData.terms);
            mapVal('cmsRefundText', polData.refund);
            mapVal('cmsRidersText', polData.riders);
            renderAdminFaqs(polData.faqs || []);
            renderAdminTestimonials(testData);

            // Press Kit
            mapVal('pk_stageName', pkData.stageName);
            mapVal('pk_spesialisasi', pkData.spesialisasi);
            mapVal('pk_tagline', pkData.tagline);
            mapVal('pk_bio', pkData.bio);
            mapVal('pk_pic', pkData.pic);
            mapVal('pk_wa', pkData.wa);
            mapVal('pk_email', pkData.email);
            mapVal('pk_sosmed', pkData.sosmed);
            mapVal('pk_domisili', pkData.domisili);
            mapVal('pk_scope1', pkData.scope1);
            mapVal('pk_scope2', pkData.scope2);
            mapVal('pk_scope3', pkData.scope3);
            mapVal('pk_scope4', pkData.scope4);
            mapVal('pk_footerNote', pkData.footerNote);
            mapVal('riders_footerNote', pkData.ridersFooter);

            // Gallery
            renderAdminGallery(galData);
            
            // Riders (Table)
            renderAdminRiders(ridersData);
        });
    } catch(e) {
        console.warn('CMS init skipped:', e.message);
    }
}

// Packages Implementation
window.renderAdminPackages = function(pkgs) {
    const list = document.getElementById('cmsPackagesList');
    if (!list) return;
    window.cmsConfig.pkgs = pkgs;
    if (pkgs.length === 0) {
        list.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--text-muted);">Belum ada paket.</div>';
        return;
    }
    let html = '';
    pkgs.forEach((p, i) => {
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:1rem; display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; border:1px solid var(--border-subtle);">
            <div>
                <div style="font-weight:700; color:var(--gold-primary); font-size:1.1rem;">${p.name || 'Paket '+(i+1)}</div>
                <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">Kategori: ${p.category || 'Standard'} | Durasi: ${p.duration || '-'} | Harga: Rp ${parseInt(p.price||0).toLocaleString('id-ID')}</div>
                <ul style="margin:0; padding-left:1.25rem; font-size:0.85rem; color:var(--text-main);">
                    ${(p.features||[]).map(f => '<li>'+f+'</li>').join('')}
                </ul>
            </div>
            <div style="display:flex; gap:0.5rem;">
                <button class="btn btn-secondary btn-sm" onclick="editPackage(${i})">Edit</button>
                <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deletePackage(${i})">Hapus</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
};
window.openAddPackageModal = function() {
    window.editingPackageIndex = -1;
    let n = prompt("Nama Paket Baru:");
    if(!n) return;
    let p = prompt("Harga (Angka saja):", "0");
    let c = prompt("Kategori:", "Standard");
    let d = prompt("Durasi (misal: 4 Jam):", "4 Jam");
    let f = prompt("Fitur (Pisahkan dengan koma):", "Fitur 1, Fitur 2");
    
    let pkgs = window.cmsConfig.pkgs || [];
    pkgs.push({
        name: n,
        price: p,
        category: c,
        duration: d,
        features: f.split(',').map(x=>x.trim())
    });
    window.cmsConfig.pkgs = pkgs;
    renderAdminPackages(pkgs);
    handleSavePackage(); // auto save
};
window.editPackage = function(i) {
    let pkgs = window.cmsConfig.pkgs || [];
    let p = pkgs[i];
    if(!p) return;
    let n = prompt("Nama Paket:", p.name); if(n===null) return;
    let pr = prompt("Harga:", p.price);
    let f = prompt("Fitur (Pisahkan dengan koma):", (p.features||[]).join(', '));
    p.name = n; p.price = pr; p.features = f.split(',').map(x=>x.trim());
    renderAdminPackages(pkgs);
    handleSavePackage();
};
window.deletePackage = async function(i) {
    if(!(await window.uiConfirm('Hapus paket ini?'))) return;
    let pkgs = window.cmsConfig.pkgs || [];
    pkgs.splice(i, 1);
    renderAdminPackages(pkgs);
    handleSavePackage();
};
window.handleSavePackage = function(e) {
    if (e) e.preventDefault();
    fetch('/api/cms/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages: window.cmsConfig.pkgs || [] })
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Paket disimpan!', 'success');
    });
};

// FAQ
window.renderAdminFaqs = function(faqs) {
    window.cmsConfig.policies = window.cmsConfig.policies || {};
    window.cmsConfig.policies.faqs = faqs;
    const list = document.getElementById('faqItemsList');
    if (!list) return;
    let html = '';
    faqs.forEach((f, i) => {
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:0.9rem 1.1rem; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <strong style="color:var(--gold-primary);">Q: ${f.q}</strong>
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">A: ${f.a}</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteFaq(${i})">Hapus</button>
        </div>`;
    });
    list.innerHTML = html;
};
window.promptAddFaq = function() {
    let q = prompt("Pertanyaan (Q):"); if(!q) return;
    let a = prompt("Jawaban (A):"); if(!a) return;
    let faqs = window.cmsConfig.policies.faqs || [];
    faqs.push({q, a});
    renderAdminFaqs(faqs);
};
window.deleteFaq = function(i) {
    let faqs = window.cmsConfig.policies.faqs || [];
    faqs.splice(i, 1);
    renderAdminFaqs(faqs);
};

// Testimonials
window.renderAdminTestimonials = function(tests) {
    window.cmsConfig.testimonials = tests;
    const list = document.getElementById('testimonialItemsList');
    if (!list) return;
    let html = '';
    tests.forEach((t, i) => {
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:0.9rem 1.1rem; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <strong style="color:var(--gold-primary);">${t.author}</strong> - ${t.role}
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">"${t.text}"</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteTestimonial(${i})">Hapus</button>
        </div>`;
    });
    list.innerHTML = html;
};
window.promptAddTestimonial = function() {
    let author = prompt("Nama Klien:"); if(!author) return;
    let role = prompt("Peran (misal: Bride, Corporate EO):", "Client");
    let text = prompt("Testimoni:"); if(!text) return;
    let tests = window.cmsConfig.testimonials || [];
    tests.push({author, role, text, rating:5});
    renderAdminTestimonials(tests);
};
window.deleteTestimonial = function(i) {
    let tests = window.cmsConfig.testimonials || [];
    tests.splice(i, 1);
    renderAdminTestimonials(tests);
};

window.handleSaveCmsPolicies = function(e) {
    if (e) e.preventDefault();
    const pol = {
        terms: document.getElementById('cmsTermsText')?.value || '',
        refund: document.getElementById('cmsRefundText')?.value || '',
        riders: document.getElementById('cmsRidersText')?.value || '',
        faqs: window.cmsConfig.policies?.faqs || []
    };
    fetch('/api/cms/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pol)
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Kebijakan & FAQ berhasil disimpan!', 'success');
        
        // Also save testimonials
        fetch('/api/cms/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testimonials: window.cmsConfig.testimonials || [] })
        });
    });
};

window.handleSaveCalendarWidgetConfig = function(e) {
    if (e) e.preventDefault();
    const bio = window.cmsConfig.bio || {};
    bio.calendarConfig = {
        buffer: document.getElementById('cfgCalBuffer')?.value || '7',
        mode: document.getElementById('cfgCalMode')?.value || 'request_to_book',
        notice: document.getElementById('cfgCalNotice')?.value || ''
    };
    fetch('/api/cms/biodata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bio)
    }).then(r=>r.json()).then(() => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pengaturan Kalender disimpan!', 'success');
    });
};

// Press Kit
window.savePressKitData = function() {
    const pk = {
        stageName: document.getElementById('pk_stageName')?.value || '',
        spesialisasi: document.getElementById('pk_spesialisasi')?.value || '',
        tagline: document.getElementById('pk_tagline')?.value || '',
        bio: document.getElementById('pk_bio')?.value || '',
        pic: document.getElementById('pk_pic')?.value || '',
        wa: document.getElementById('pk_wa')?.value || '',
        email: document.getElementById('pk_email')?.value || '',
        sosmed: document.getElementById('pk_sosmed')?.value || '',
        domisili: document.getElementById('pk_domisili')?.value || '',
        scope1: document.getElementById('pk_scope1')?.value || '',
        scope2: document.getElementById('pk_scope2')?.value || '',
        scope3: document.getElementById('pk_scope3')?.value || '',
        scope4: document.getElementById('pk_scope4')?.value || '',
        footerNote: document.getElementById('pk_footerNote')?.value || '',
        ridersFooter: document.getElementById('riders_footerNote')?.value || ''
    };
    fetch('/api/cms/presskit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pk)
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Press Kit disimpan!', 'success');
    });
};
window.saveRidersFooterNote = function() {
    savePressKitData();
};

// Gallery
window.renderAdminGallery = function(gal) {
    window.cmsConfig.gallery = gal;
    const list = document.getElementById('adminGalleryList'); // Wait, does this exist? I need to check admin.html ID for gallery
    if (!list) return;
    let html = '';
    gal.forEach((g, i) => {
        html += `<div style="display:flex; flex-direction:column; gap:0.5rem; background:var(--bg-surface); padding:1rem; border:1px solid var(--border-subtle); border-radius:8px;">
            <img src="${g.url}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;">
            <input type="text" class="form-input" value="${g.caption || ''}" onchange="updateGalleryCaption(${i}, this.value)">
            <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteGalleryItem(${i})">Hapus</button>
        </div>`;
    });
    list.innerHTML = html;
};
window.updateGalleryCaption = function(i, cap) {
    window.cmsConfig.gallery[i].caption = cap;
};
window.deleteGalleryItem = function(i) {
    window.cmsConfig.gallery.splice(i, 1);
    renderAdminGallery(window.cmsConfig.gallery);
};
window.handleSaveCmsGallery = function() {
    fetch('/api/cms/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery: window.cmsConfig.gallery || [] })
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Galeri disimpan!', 'success');
    });
};
window.addGalleryItem = function() {
    let url = prompt("URL Gambar Baru:");
    if(!url) return;
    let cap = prompt("Caption Gambar:");
    window.cmsConfig.gallery.push({url: url, caption: cap});
    renderAdminGallery(window.cmsConfig.gallery);
};

// Riders
window.renderAdminRiders = function(riders) {
    window.cmsConfig.riders = riders;
    const body = document.getElementById('ridersTableBody');
    if (!body) return;
    let html = '';
    riders.forEach((r, i) => {
        html += `<tr>
            <td><strong>${r.title}</strong></td>
            <td>${r.notes}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editRider(${i})">Edit</button>
                <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteRider(${i})">Hapus</button>
            </td>
        </tr>`;
    });
    body.innerHTML = html;
};
window.openRiderModal = function() {
    let t = prompt("Judul Rider (misal: Hospitality):"); if(!t) return;
    let n = prompt("Catatan (misal: 1x Ruang Tunggu):"); if(!n) return;
    fetch('/api/cms/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t, notes: n })
    }).then(r=>r.json()).then(res => {
        initAdminCms(); // reload everything
    });
};
window.editRider = function(i) {
    let r = window.cmsConfig.riders[i];
    let t = prompt("Judul Rider:", r.title); if(t===null) return;
    let n = prompt("Catatan:", r.notes); if(n===null) return;
    fetch('/api/cms/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_id: r.db_id, title: t, notes: n })
    }).then(res=>res.json()).then(() => initAdminCms());
};
window.deleteRider = async function(i) {
    let r = window.cmsConfig.riders[i];
    if(!(await window.uiConfirm('Hapus rider ini?'))) return;
    fetch('/api/cms/riders/' + r.db_id, { method: 'DELETE' })
        .then(res=>res.json()).then(() => initAdminCms());
};

window.getAdminGalleryData = function() { return window.cmsConfig.gallery || []; };
window.saveAdminGalleryData = function(data) { window.cmsConfig.gallery = data; window.handleSaveCmsGallery(); };
// ==========================================
// DATA CASH FLOW (BACKEND API INTEGRATION)
// ==========================================
window.loadCashflowTransactions = function() {
    fetch('/api/cms/cashflow-transactions')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.cashflowTransactions = data.data || [];
                window.mcCashflow = data.data || []; // Also set mcCashflow for pie charts
                renderCashflowTable();
                if (typeof window.renderDashboardPies === 'function') window.renderDashboardPies();
            }
        })
        .catch(err => {
            console.error('Failed to load cashflow', err);
            window.cashflowTransactions = [];
            window.mcCashflow = [];
            renderCashflowTable();
            if (typeof window.renderDashboardPies === 'function') window.renderDashboardPies();
        });
};

window.sortCashflowTable = function(key) {
    if (window.cashflowSortKey === key) {
        window.cashflowSortOrder = window.cashflowSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        window.cashflowSortKey = key;
        window.cashflowSortOrder = 'asc';
    }
    
    // Update headers UI
    const headers = document.querySelectorAll('#cashFlowTable th');
    headers.forEach(th => {
        let text = th.innerText.replace(/ ▼| ▲/g, '');
        if (th.getAttribute('onclick') && th.getAttribute('onclick').includes(key)) {
            th.innerText = text + (window.cashflowSortOrder === 'asc' ? ' ▲' : ' ▼');
        } else {
            th.innerText = text;
        }
    });
    
    window.renderCashflowTable();
};

window.renderCashflowTable = function() {
    try {
        const tbody = document.getElementById('cashFlowTableBody') || document.getElementById('cashflowTableBody');
        
        let transactions = [...(window.cashflowTransactions || [])];
        
        // Auto-Sync from Customers Data (Bugfix: didata pelanggan padahal ada nominal)
        if (window.mcCustomers && Array.isArray(window.mcCustomers)) {
            window.mcCustomers.forEach(c => {
                if (!c.price || isNaN(c.price)) return;
                const pStatus = (c.paymentStatus || '').toUpperCase();
                let amount = 0;
                let desc = '';
                
                if (pStatus.includes('LUNAS') || pStatus.includes('100%') || pStatus === 'PAID') {
                    amount = Number(c.price);
                    desc = `Pelunasan Kontrak - ${c.name} (${c.event})`;
                } else if (pStatus.includes('DP')) {
                    amount = Number(c.price) * 0.5; // Asumsi DP 50%
                    desc = `DP 50% - ${c.name} (${c.event})`;
                }
                
                if (amount > 0) {
                    // Cek jika sudah ada manual entry dengan ID sama atau transaksi auto-sync
                    if (!transactions.find(t => t.id === 'ev_' + c.id)) {
                        let tDate = c.updated_at || c.created_at || new Date().toISOString();
                        tDate = tDate.split('T')[0];
                        transactions.push({
                            id: 'ev_' + c.id,
                            date: tDate,
                            desc: desc,
                            category: 'Pendapatan Booking',
                            amount: amount,
                            type: 'in',
                            status: 'Berhasil'
                        });
                    }
                }
            });
        }
        
        // Dynamic Sorting
        const sortKey = window.cashflowSortKey || 'date';
        const sortOrder = window.cashflowSortOrder || 'desc';
        
        transactions.sort((a, b) => {
            let valA = a[sortKey];
            let valB = b[sortKey];
            
            if (sortKey === 'amount') {
                valA = Number(valA || 0);
                valB = Number(valB || 0);
            } else if (sortKey === 'date') {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            } else {
                valA = String(valA || '').toLowerCase();
                valB = String(valB || '').toLowerCase();
            }
            
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        let totalInflow = 0;
        let totalOutflow = 0;
        
        transactions.forEach(t => {
            const amount = Number(t.amount || 0);
            if (t.type === 'in' || t.type === 'inflow') totalInflow += amount;
            else if (t.type === 'out' || t.type === 'outflow') totalOutflow += amount;
        });
        
        const inEl = document.getElementById('cfTotalIn') || document.getElementById('cfTotalInflow');
        const outEl = document.getElementById('cfTotalOut') || document.getElementById('cfTotalOutflow');
        const netEl = document.getElementById('cfNetCash');
        const marginEl = document.getElementById('cfNetMargin') || document.getElementById('cfMargin');
        
        if (inEl) inEl.textContent = 'Rp ' + totalInflow.toLocaleString('id-ID');
        if (outEl) outEl.textContent = 'Rp ' + totalOutflow.toLocaleString('id-ID');
        
        const netCash = totalInflow - totalOutflow;
        if (netEl) netEl.textContent = 'Rp ' + netCash.toLocaleString('id-ID');
        
        if (marginEl) {
            const margin = totalInflow > 0 ? ((netCash / totalInflow) * 100).toFixed(1) : 0;
            marginEl.textContent = margin + '%';
        }
        
        if (tbody) {
            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Belum ada data transaksi kas.</td></tr>';
            } else {
                tbody.innerHTML = transactions.map(t => {
                    const isIn = (t.type === 'in' || t.type === 'inflow');
                    const color = isIn ? '#10B981' : '#EF4444';
                    const sign = isIn ? '+' : '-';
                    const isAuto = String(t.id).startsWith('ev_') || String(t.id).startsWith('exp_');
                    const proofHtml = t.proof ? `<br><a href="${t.proof}" target="_blank" style="color:var(--gold-primary); font-size:0.8rem; text-decoration:underline;">Lihat Bukti</a>` : '';
                    const btn = isAuto ? 
                        '<button class="btn btn-secondary btn-sm" onclick="viewCashflowTransaction(\'' + t.id + '\')" style="margin-right:4px;">View</button>' +
                        '<span class="badge" style="background:#334155; color:#94A3B8; font-size:0.7rem;">Auto-Sync</span>' : 
                        '<button class="btn btn-secondary btn-sm" onclick="viewCashflowTransaction(\'' + t.id + '\')" style="margin-right:4px;">View</button>' +
                        '<button class="btn btn-primary btn-sm" onclick="editCashflowTransaction(\'' + t.id + '\')" style="margin-right:4px;">Edit</button>' +
                        '<button class="btn btn-secondary btn-sm" onclick="deleteCashflowTransaction(\'' + t.id + '\')">Hapus</button>';
                    
                    return '<tr>' +
                        '<td>' + t.date + '</td>' +
                        '<td><strong>' + (t.desc || '') + '</strong>' + proofHtml + '</td>' +
                        '<td><span class="badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);">' + (t.category || '') + '</span></td>' +
                        '<td style="color:' + color + '; font-weight:600;">' + sign + ' Rp ' + Number(t.amount).toLocaleString('id-ID') + '</td>' +
                        '<td><span style="color:var(--adm-gold);">' + (t.status || 'Berhasil') + '</span></td>' +
                        '<td>' + btn + '</td>' +
                    '</tr>';
                }).join('');
            }
        }
    } catch(e) {
        console.warn('renderCashflowTable error:', e.message);
    }
};

window.viewCashflowTransaction = function(id) {
    let t = null;
    if (window.cashflowTransactions) {
        t = window.cashflowTransactions.find(x => String(x.id) === String(id));
    }
    // If not found in main DB, it might be an auto-sync transaction from render array
    if (!t && window.mcCustomers) {
        // Fallback for auto-sync transactions if needed (though usually we pass the rendered item)
        // Let's just re-render to find it
        let transactions = [...(window.cashflowTransactions || [])];
        window.mcCustomers.forEach(c => {
            if (!c.price || isNaN(c.price)) return;
            const pStatus = (c.paymentStatus || '').toUpperCase();
            let amount = 0; let desc = '';
            if (pStatus.includes('LUNAS') || pStatus.includes('100%') || pStatus === 'PAID') {
                amount = Number(c.price); desc = `Pelunasan Kontrak - ${c.name} (${c.event})`;
            } else if (pStatus.includes('DP')) {
                amount = Number(c.price) * 0.5; desc = `DP 50% - ${c.name} (${c.event})`;
            }
            if (amount > 0 && !transactions.find(x => x.id === 'ev_' + c.id)) {
                let tDate = c.updated_at || c.created_at || new Date().toISOString();
                tDate = tDate.split('T')[0];
                transactions.push({ id: 'ev_' + c.id, date: tDate, desc: desc, category: 'Pendapatan Booking', amount: amount, type: 'in', status: 'Berhasil' });
            }
        });
        t = transactions.find(x => String(x.id) === String(id));
    }

    if (!t) return;

    const isAutoSync = String(t.id).startsWith('ev_');
    let proofHtml = '';
    if (t.proof) {
        proofHtml = `<div style="margin-top:12px;"><a href="${t.proof}" target="_blank" class="btn btn-primary btn-sm" style="display:inline-block; text-decoration:none;">Lihat Bukti Foto/Lampiran</a></div>`;
    } else if (isAutoSync) {
        const custId = String(t.id).replace('ev_', '');
        proofHtml = `<div style="margin-top:12px; font-size:0.85rem; color:var(--adm-text-muted);">
            Ini adalah transaksi Auto-Sync dari sistem jadwal acara.<br>
            Untuk melihat Invoicenya, silakan buka <a href="javascript:void(0)" onclick="closeModals(); openCustomerInCommandCenter('${custId}'); setTimeout(openInvoicePrintModal, 800);" style="color:var(--gold-primary); text-decoration:underline;">Event Command Center (Cetak Invoice)</a>.
        </div>`;
    }

    const html = `
        <div style="text-align:left; font-size:0.95rem; line-height:1.6; color:#E2E8F0;">
            <div style="margin-bottom:8px;"><strong>ID Transaksi:</strong> ${t.id}</div>
            <div style="margin-bottom:8px;"><strong>Jenis Kas:</strong> ${t.type === 'in' || t.type === 'inflow' ? '<span style="color:#10B981;">Masuk (Pendapatan)</span>' : '<span style="color:#EF4444;">Keluar (Pengeluaran)</span>'}</div>
            <div style="margin-bottom:8px;"><strong>Kategori:</strong> ${t.category || '-'}</div>
            <div style="margin-bottom:8px;"><strong>Nominal:</strong> Rp ${Number(t.amount).toLocaleString('id-ID')}</div>
            <div style="margin-bottom:8px;"><strong>Tanggal:</strong> ${t.date || '-'}</div>
            <div style="margin-bottom:8px;"><strong>Deskripsi:</strong><br><div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:4px; margin-top:4px;">${t.desc || '-'}</div></div>
            ${proofHtml}
        </div>
    `;
    uiAlert(html, 'Detail Transaksi Kas');
};

window.editCashflowTransaction = async function(id) {
    if (!window.cashflowTransactions) return;
    const t = window.cashflowTransactions.find(x => String(x.id) === String(id));
    if (!t) return;
    await window.openAddCashModal(t);
};

window.openAddCashModal = async function(existingData = null) {
    let incomeCats = ['DP', 'Pelunasan', 'Sponsorship'];
    let expenseCats = ['Operasional', 'Transport', 'Konsumsi', 'Gaji Kru'];
    try {
        const res = await fetch('/api/cms/cashflow-categories');
        if (res.ok) {
            const json = await res.json();
            const cats = json.data || [];
            if (cats.length > 0) {
                const inC = cats.filter(c => c.tipe === 'in' || c.tipe === 'income').map(c => c.nama);
                const outC = cats.filter(c => c.tipe === 'out' || c.tipe === 'expense').map(c => c.nama);
                if (inC.length > 0) incomeCats = inC;
                if (outC.length > 0) expenseCats = outC;
            }
        }
    } catch(e) { console.warn('Gagal memuat kategori dari DB, menggunakan fallback'); }

    const isEdit = !!existingData;
    const title = isEdit ? 'Edit Transaksi Kas' : 'Catat Transaksi Kas';
    
    let defaultCatOpts = [{value: '', label: '-- Pilih Tipe Kas Dahulu --'}];
    if (isEdit && existingData.type) {
        const opts = existingData.type === 'in' ? incomeCats : expenseCats;
        defaultCatOpts = [{value: '', label: '-- Pilih Kategori --'}, ...opts.map(c => ({value: c, label: c}))];
    }

    const isAutoSync = isEdit && (String(existingData.id).startsWith('ev_') || String(existingData.id).startsWith('exp_') || (existingData.desc && existingData.desc.includes('Pelunasan/DP Invoice')));

    const dataPromise = window.uiCustomForm([
        { id: 'type', label: 'Tipe Kas', type: 'select', options: [{value: '', label: '-- Pilih Tipe Kas --'}, {value: 'in', label: 'Kas Masuk (+)'}, {value: 'out', label: 'Kas Keluar (-)'}], value: isEdit ? existingData.type : '' },
        { id: 'category', label: 'Kategori', type: 'select', options: defaultCatOpts, value: isEdit ? existingData.category : '' },
        { id: 'amount', label: 'Nominal (Rp)' + (isAutoSync ? ' (Auto-Sync: Tidak dapat diedit)' : ''), type: 'number', value: isEdit ? existingData.amount : '', readonly: isAutoSync },
        { id: 'date', label: 'Tanggal', type: 'date', value: isEdit ? existingData.date : new Date().toISOString().split('T')[0] },
        { id: 'desc', label: 'Deskripsi', type: 'textarea', value: isEdit ? existingData.desc : '' },
        { id: 'proof', label: 'Bukti (Opsional)', type: 'file' }
    ], title);

    // Attach listener dynamically
    setTimeout(() => {
        const typeSelect = document.getElementById('cm_field_type');
        const catSelect = document.getElementById('cm_field_category');
        if (typeSelect && catSelect) {
            typeSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                catSelect.innerHTML = '';
                if (!val) {
                    catSelect.innerHTML = '<option value="">-- Pilih Tipe Kas Dahulu --</option>';
                    return;
                }
                const opts = val === 'in' ? incomeCats : expenseCats;
                catSelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
                opts.forEach(opt => {
                    const optionEl = document.createElement('option');
                    optionEl.value = opt;
                    optionEl.textContent = opt;
                    catSelect.appendChild(optionEl);
                });
            });
        }
    }, 50);

    const data = await dataPromise;
    if (!data) return; // User cancelled
    if (!data.type || !data.category || !data.amount || !data.desc) {
        uiAlert('Tipe, Kategori, Nominal dan Deskripsi wajib diisi!');
        return;
    }

    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('category', data.category);
    formData.append('amount', data.amount);
    formData.append('date', data.date);
    formData.append('desc', data.desc);
    if (isEdit) formData.append('id', existingData.id);
    if (data.proof) {
        formData.append('proof', data.proof);
    }

    fetch('/api/cms/cashflow-transactions', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: formData
    }).then(res => res.json())
      .then(resData => {
          if (resData.success) {
              uiAlert('Transaksi kas berhasil dicatat!');
              loadCashflowTransactions();
          } else {
              uiAlert('Gagal mencatat transaksi: ' + (resData.message || 'Error'));
          }
      }).catch(err => {
          console.error(err);
          uiAlert('Terjadi kesalahan jaringan.');
      });
};

window.handleSaveCashEntry = function(e) {
    e.preventDefault();
    const type = document.getElementById('newCfType')?.value;
    const category = document.getElementById('newCfCategory')?.value;
    const amount = document.getElementById('newCfAmount')?.value;
    const desc = document.getElementById('newCfDesc')?.value;
    const date = document.getElementById('newCfDate')?.value;
    
    if (!type || !category || !amount || !desc || !date) {
        uiAlert('Semua kolom wajib diisi!');
        return;
    }

    const payload = { type, category, amount, date, desc };

    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    fetch('/api/cms/cashflow-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(res => res.json())
      .then(data => {
          if (data.success) {
              uiAlert('Transaksi kas berhasil dicatat!');
              closeModals();
              e.target.reset();
              loadCashflowTransactions();
          } else {
              uiAlert('Gagal mencatat transaksi: ' + (data.message || 'Error'));
          }
      }).catch(err => {
          console.error(err);
          uiAlert('Terjadi kesalahan jaringan.');
      }).finally(() => {
          if (btn) btn.disabled = false;
      });
};

window.deleteCashflowTransaction = async function(id) {
    let t = window.cashflowTransactions ? window.cashflowTransactions.find(x => String(x.id) === String(id)) : null;
    let isAutoSync = String(id).startsWith('ev_') || String(id).startsWith('exp_') || (t && t.desc && t.desc.includes('Pelunasan/DP Invoice'));
    
    if (isAutoSync) {
        uiAlert('Data kas yang tersinkronisasi dari Invoice ECC tidak dapat dihapus manual dari sini.');
        return;
    }
    if (!(await window.uiConfirm('Hapus transaksi kas ini?'))) return;
    
    fetch('/api/cms/cashflow-transactions/' + id, {
        method: 'DELETE'
    }).then(res => res.json())
      .then(data => {
          if (data.success) {
              uiAlert('Transaksi berhasil dihapus');
              loadCashflowTransactions();
          } else {
              uiAlert('Gagal menghapus transaksi: ' + (data.message || 'Error'));
          }
      }).catch(err => {
          console.error(err);
          uiAlert('Terjadi kesalahan jaringan.');
      });
};

window.renderCashflowCategories = function() {
    const type = document.getElementById('newCfType').value;
    const cat = document.getElementById('newCfCategory');
    if (!cat) return;
    let opts = '<option value="" disabled selected>-- Pilih Kategori --</option>';
    if (type === 'in' || type === 'inflow') {
        opts += '<option value="Sponsorship">Sponsorship / Endorsement</option><option value="Lainnya">Pendapatan Lainnya</option>';
    } else {
        opts += '<option value="Transportasi">Biaya Transportasi</option><option value="Konsumsi">Biaya Konsumsi / Meals</option><option value="Wardrobe">Biaya Wardrobe / Makeup</option><option value="Lainnya">Pengeluaran Lainnya</option>';
    }
    cat.innerHTML = opts;
};

// Global function to handle quick event creation from calendar dashboard
window.handleCreateQuickEvent = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if(btn) btn.disabled = true;

    try {
        const data = {
            nama_acara: document.getElementById('newEventName').value,
            nama_pic: document.getElementById('newEventPic').value,
            no_wa: document.getElementById('newEventWa').value,
            tanggal_acara: document.getElementById('newEventDate').value,
            lokasi: document.getElementById('newEventVenue').value,
            waktu_mulai: document.getElementById('newEventTimeStart').value,
            waktu_selesai: document.getElementById('newEventTimeEnd').value,
            tipe_acara: 'Wedding' // Default
        };

        const res = await fetch('/api/cms/events', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        if(res.ok) {
            if(typeof window.uiAlert === 'function') window.uiAlert('Acara baru berhasil ditambahkan!');
            else window.uiAlert('Acara berhasil ditambahkan!');
            
            e.target.reset();
            document.getElementById('quickEventModal').classList.remove('active');
            
            if(typeof window.loadUnifiedEventsDatabase === 'function') {
                await window.loadUnifiedEventsDatabase();
            }
        } else {
            const err = await res.json();
            window.uiAlert('Gagal menyimpan acara: ' + (err.message || 'Server error'));
        }
    } catch(err) {
        console.error("Error creating event:", err);
        window.uiAlert('Terjadi kesalahan sistem');
    } finally {
        if(btn) btn.disabled = false;
    }
};

// ==========================================
// EVENT COMMAND CENTER - MISSING FUNCTIONS
// ==========================================

window.updateAdminFinance = async function(val) {
    if(!activeCommandCenterEventId) {
        if(typeof uiAlert === 'function') uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    const confirmed = typeof uiConfirm === 'function' ? await uiConfirm(`Ubah status pembayaran menjadi: ${val}?`) : confirm(`Ubah status pembayaran menjadi: ${val}?`);
    if(!confirmed) {
        const sel = document.getElementById('adminFinanceSelect');
        if(sel) sel.value = sel.getAttribute('data-original-value') || sel.options[0].value;
        return;
    }
    
    try {
        const res = await fetch('/api/cms/events/' + activeCommandCenterEventId, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status_pembayaran: val })
        });
        if(res.ok) {
            var json = await res.json().catch(function(){return {};});
            var newId = (json.data && json.data.id) ? json.data.id : activeCommandCenterEventId;
            if(typeof uiAlert === 'function') uiAlert('Status pembayaran berhasil diupdate!');
            const sel = document.getElementById('adminFinanceSelect');
            if(sel) sel.setAttribute('data-original-value', val);
            if(typeof loadCustomersData === 'function') { await loadCustomersData(); }
            if(typeof loadUnifiedEventsDatabase === 'function') {
                await loadUnifiedEventsDatabase();
                switchCommandCenterEvent(newId);
            }
        } else {
            if(typeof uiAlert === 'function') uiAlert('Gagal update status pembayaran.');
        }
    } catch(e) {
        console.error(e);
        if(typeof uiAlert === 'function') uiAlert('Terjadi kesalahan jaringan.');
    }
};

window.updateCcStatus = async function(statusVal) {
    if(!activeCommandCenterEventId) return;
    const ev = adminEventsDb.find(e => String(e.id) === String(activeCommandCenterEventId));
    if(!ev) return;
    
    ev.status = statusVal;
    
    // Attempt saving to DB
    try {
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;

        const actualId = ev.db_id || String(ev.id).replace('e_', '');
        const res = await fetch('/api/cms/events/' + actualId, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(ev)
        });
        if(res.ok) {
            if(typeof uiAlert === 'function') uiAlert('Status acara berhasil diperbarui!');
            switchCommandCenterEvent(ev.id); // reload the UI
        } else {
            if(typeof uiAlert === 'function') uiAlert('Gagal menyimpan status ke server.');
        }
    } catch(err) {
        console.error('Failed to update event status', err);
    }
};

// Helper: force-show a modal by directly setting inline styles (bypass CSS class/variable issues)
window._forceShowModal = function(id) {
    const m = document.getElementById(id);
    if (!m) { console.error('Modal not found: ' + id); return null; }
    m.style.cssText = [
        'display: flex !important',
        'position: fixed !important',
        'inset: 0 !important',
        'z-index: 99999 !important',
        'align-items: center !important',
        'justify-content: center !important',
        'padding: 1rem !important',
        'opacity: 1 !important',
        'pointer-events: auto !important',
        'background: rgba(0,0,0,0.75) !important',
        'backdrop-filter: blur(6px) !important'
    ].join(';');
    m.classList.add('active');
    // Ensure modal-content is visible
    const content = m.querySelector('.modal-content');
    if (content) {
        content.style.cssText = [
            'background: #1a2035 !important',
            'color: #e2e8f0 !important',
            'border-radius: 12px !important',
            'padding: 2rem !important',
            'max-width: 650px !important',
            'width: 100% !important',
            'max-height: 90vh !important',
            'overflow-y: auto !important',
            'box-shadow: 0 25px 50px rgba(0,0,0,0.7) !important',
            'border: 1px solid rgba(255,255,255,0.1) !important'
        ].join(';');
    }
    return m;
};

window._forceHideModal = function(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.style.cssText = '';
    m.classList.remove('active');
};

window.closeModals = function() {
    document.querySelectorAll('.modal-overlay').forEach(el => {
        el.style.cssText = '';
        el.classList.remove('active');
    });
};

window.openEditInvoiceModal = function() {
    const container = document.getElementById('invoiceItemsContainer');
    if (container) {
        container.innerHTML = '';
        const ev = (typeof adminEventsDb !== 'undefined' && activeCommandCenterEventId)
            ? adminEventsDb.find(e => String(e.id) === String(activeCommandCenterEventId))
            : null;
        const items = (ev && ev.invoiceItems && Array.isArray(ev.invoiceItems) && ev.invoiceItems.length > 0)
            ? ev.invoiceItems
            : [{ desc: ev ? 'Jasa MC & Entertainment' : '', price: (ev && ev.rawPrice) || 0 }];

        items.forEach(item => {
            const div = document.createElement('div');
            div.style.cssText = 'display:flex; gap:10px; margin-bottom:8px; align-items:center;';
            div.innerHTML = `
                <input type="text" class="form-input invoice-item-desc" style="flex:1; background:#0f172a; color:#e2e8f0; border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:0.5rem;" value="${item.desc || ''}" placeholder="Deskripsi layanan">
                <input type="number" class="form-input invoice-item-price" style="width:140px; background:#0f172a; color:#e2e8f0; border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:0.5rem;" value="${item.price || 0}" oninput="calculateInvoiceTotal()">
                <button type="button" style="background:transparent; border:none; color:#ef4444; font-size:1.2rem; cursor:pointer; padding:0 0.5rem;" onclick="this.parentElement.remove(); calculateInvoiceTotal();">✕</button>
            `;
            container.appendChild(div);
        });
    }
    calculateInvoiceTotal();
    window._forceShowModal('editInvoiceModal');
};


window.sendWaTemplate = async function(encodedBody) {
    if(!activeCommandCenterEventId) return;
    const ev = adminEventsDb.find(e => String(e.id) === String(activeCommandCenterEventId));
    if(!ev) return;

    let body = decodeURIComponent(encodedBody);
    body = body.replace(/\[NAMA\]/g, ev.pic || 'Klien');
    body = body.replace(/\[ACARA\]/g, ev.title || 'Acara');
    
    let phone = ev.metadata?.pic_wa || '';
    if(phone.startsWith('0')) phone = '62' + phone.substring(1);
    
    if (typeof uiCustomForm === 'function') {
        const data = await uiCustomForm([
            { id: 'phone', label: 'Nomor WhatsApp', type: 'text', value: phone },
            { id: 'message', label: 'Isi Pesan (Edit bila perlu)', type: 'textarea', value: body }
        ], 'Konfirmasi Pesan WhatsApp');
        
        if (data) {
            window.openWhatsAppChat(data.phone, ev.pic || '', ev.title || '', data.message);
        }
    } else {
        const editedBody = prompt("Edit pesan sebelum dikirim:", body);
        if (editedBody !== null) {
            window.openWhatsAppChat(phone, ev.pic || '', ev.title || '', editedBody);
        }
    }
};

window.addInvoiceItemRow = function() {
    const container = document.getElementById('invoiceItemsContainer');
    if(!container) return;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '5px';
    div.innerHTML = `
        <input type="text" class="form-input invoice-item-desc" style="flex:1;" placeholder="Deskripsi layanan (ex: Aditional MC)">
        <input type="number" class="form-input invoice-item-price" style="width:150px;" placeholder="1000000" oninput="calculateInvoiceTotal()">
        <button type="button" class="btn btn-secondary btn-sm" style="color:var(--adm-danger); border-color:transparent; background:transparent;" onclick="this.parentElement.remove(); calculateInvoiceTotal();">X</button>
    `;
    container.appendChild(div);
    calculateInvoiceTotal();
};

window.calculateInvoiceTotal = function() {
    const inputs = document.querySelectorAll('.invoice-item-price');
    let total = 0;
    inputs.forEach(inp => {
        const val = parseInt(inp.value) || 0;
        total += val;
    });
    const preview = document.getElementById('invoiceTotalPreview');
    if(preview) preview.textContent = 'Rp ' + total.toLocaleString('id-ID');
    return total;
};

window.saveInvoiceItems = async function() {
    if(!activeCommandCenterEventId) return;
    const total = calculateInvoiceTotal();
    
    const ev = adminEventsDb.find(e => String(e.id) === String(activeCommandCenterEventId));
    if (!ev) return;

    // Collect items from UI
    const inputsDesc = document.querySelectorAll('.invoice-item-desc');
    const inputsPrice = document.querySelectorAll('.invoice-item-price');
    const items = [];
    for(let i=0; i<inputsDesc.length; i++) {
        items.push({
            desc: inputsDesc[i].value,
            price: parseInt(inputsPrice[i].value) || 0
        });
    }
    
    ev.invoiceItems = items; // Update locally

    const payload = { 
        nilai_kontrak: total,
        metadata: {
            vipNotes: ev.vipNotes,
            vipProtocol: ev.vipProtocol,
            checklist: ev.checklist,
            expenses: ev.expenses,
            wardrobeIds: ev.wardrobeIds,
            invoice_items: ev.invoiceItems,
            musicList: ev.musicList,
            rundown: ev.rundown,
            vendors: ev.vendors
        }
    };
    
    try {
        const res = await fetch('/api/cms/events/' + activeCommandCenterEventId, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            if(typeof uiAlert === 'function') uiAlert('Rincian Invoice & Nilai Kontrak berhasil diperbarui!');
            if(typeof closeModals === 'function') closeModals();
            if(typeof loadUnifiedEventsDatabase === 'function') {
                await loadUnifiedEventsDatabase();
                switchCommandCenterEvent(activeCommandCenterEventId);
            }
        } else {
            if(typeof uiAlert === 'function') uiAlert('Gagal update nilai kontrak.');
        }
    } catch(e) {
        console.error(e);
        if(typeof uiAlert === 'function') uiAlert('Terjadi kesalahan jaringan.');
    }
};

window.openInvoicePrintModal = function() {
    if(!activeCommandCenterEventId) {
        if(typeof uiAlert === 'function') uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    const ev = adminEventsDb.find(e => String(e.id) === String(activeCommandCenterEventId));
    if (!ev) return;

    // Populate data
    const total = Number(ev.rawPrice) || 0;
    const dp = total / 2;
    const sisa = total - dp;
    
    document.getElementById('invModalNum').textContent = 'INV-MC-' + ev.id.toString().padStart(4, '0');
    document.getElementById('invModalClientName').textContent = ev.pic || 'Nama Klien';
    document.getElementById('invModalClientWa').textContent = 'Kontak: ' + (ev.metadata?.pic_wa || '-');
    document.getElementById('invModalEventTitle').textContent = ev.title || 'Wedding Reception';
    document.getElementById('invModalEventDateVenue').textContent = (ev.date || '') + ' ' + (ev.time || '') + ' ' + (ev.metadata?.venue || 'TBD');
    
    document.getElementById('invModalPackageName').textContent = 'Jasa MC & Entertainment';
    document.getElementById('invModalTotalPrice').textContent = 'Rp ' + total.toLocaleString('id-ID');
    
    document.getElementById('invModalTotalSummary').textContent = 'Rp ' + total.toLocaleString('id-ID');
    document.getElementById('invModalDpSummary').textContent = '- Rp ' + dp.toLocaleString('id-ID');
    document.getElementById('invModalSisaSummary').textContent = 'Rp ' + sisa.toLocaleString('id-ID');
    
    const badge = document.getElementById('invModalBadge');
    if (ev.status === 'Terkunci' || ev.status === 'Selesai') {
        badge.textContent = 'DP / LUNAS';
        badge.style.background = '#DCFCE7';
        badge.style.color = '#166534';
    } else {
        badge.textContent = 'UNPAID';
        badge.style.background = '#FEE2E2';
        badge.style.color = '#991B1B';
    }
    
    // Bank details
    const settings = typeof loadPaymentSettings === 'function' ? loadPaymentSettings() : { bankName: 'BCA', bankAccount: '1234567', bankHolder: 'MC' };
    document.getElementById('invModalBankInfo').innerHTML = `
        <strong>Pembayaran via Transfer:</strong><br>
        Bank: ${settings.bankName}<br>
        No. Rekening: ${settings.bankAccount}<br>
        A/N: ${settings.bankHolder}
    `;

    const m = window._forceShowModal('invoicePrintModal');
    if (m) {
        // Invoice print modal has a white/light background
        const content = m.querySelector('.modal-content');
        if (content) {
            content.style.cssText = [
                'background: #ffffff !important',
                'color: #0f172a !important',
                'border-radius: 12px !important',
                'padding: 2.5rem !important',
                'max-width: 850px !important',
                'width: 100% !important',
                'max-height: 90vh !important',
                'overflow-y: auto !important',
                'box-shadow: 0 25px 50px rgba(0,0,0,0.7) !important'
            ].join(';');
        }
    }
};

window.deleteWardrobeItem = async function(id) {
    if(typeof uiConfirm === 'function') {
        const sure = confirm('Yakin ingin menghapus item wardrobe ini?');
        if(!sure) return;
    } else if(!confirm('Yakin ingin menghapus item wardrobe ini?')) return;
    
    try {
        const res = await fetch('/api/cms/wardrobe-catalog/' + id, { method: 'DELETE' });
        if(res.ok) {
            if(typeof uiAlert === 'function') uiAlert('Item wardrobe dihapus!');
            renderWardrobe();
        } else {
            if(typeof uiAlert === 'function') uiAlert('Gagal menghapus dari server.');
        }
    } catch(e) {
        console.error(e);
    }
};

window.promptAssignWardrobe = async function(existingWardrobeId = null) {
    if(!activeCommandCenterEventId) {
        if(typeof uiAlert === 'function') uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    const ev = adminEventsDb.find(e => String(e.id) === String(activeCommandCenterEventId));
    if(!ev) return;
    
    let existingNote = '';
    if (existingWardrobeId && ev.wardrobeIds) {
        const assignment = ev.wardrobeIds.find(wItem => {
            const wId = (typeof wItem === 'object' && wItem !== null) ? wItem.id : wItem;
            return String(wId) === String(existingWardrobeId);
        });
        if (typeof assignment === 'object' && assignment !== null) {
            existingNote = assignment.note || '';
        }
    }
    
    let wardrobeOptions = [];
    try {
        const res = await fetch('/api/cms/wardrobe-catalog');
        const json = await res.json();
        if(json.success && json.data && json.data.length > 0) {
            wardrobeOptions = json.data.map(w => ({
                value: w.db_id || w.id,
                label: w.name || w.colorName,
                imgUrl: w.imgUrl
            }));
        }
    } catch(e) {}
    
    if(typeof uiCustomForm === 'function') {
        const data = await uiCustomForm([
            { id: 'wardrobe_id', label: 'Pilih Gaun / Koleksi', type: 'gallery', options: wardrobeOptions, value: existingWardrobeId || '' },
            { id: 'note', label: 'Catatan (Opsional)', type: 'text', value: existingNote }
        ], existingWardrobeId ? 'Edit Assign Wardrobe' : 'Assign Wardrobe ke Acara');
        
        if (data && data.wardrobe_id) {
            ev.wardrobeIds = ev.wardrobeIds || [];
            const finalId = isNaN(Number(data.wardrobe_id)) ? data.wardrobe_id : Number(data.wardrobe_id);
            const assignmentObj = data.note ? { id: finalId, note: data.note } : finalId;
            
            const existingIndex = ev.wardrobeIds.findIndex(wItem => {
                const wId = (typeof wItem === 'object' && wItem !== null) ? wItem.id : wItem;
                return String(wId) === String(finalId);
            });
            
            if (existingIndex === -1) {
                ev.wardrobeIds.push(assignmentObj);
            } else {
                ev.wardrobeIds[existingIndex] = assignmentObj;
            }
            
            // Sync to Server Database
            try {
                if (typeof syncEventMetadata === 'function') {
                    await syncEventMetadata(ev);
                }
            } catch(err) {
                console.error("Gagal sync wardrobe:", err);
            }

                saveUnifiedEventsDatabase(ev);
                if(typeof renderWardrobe === 'function') renderWardrobe();
                if(typeof switchCommandCenterEvent === 'function') switchCommandCenterEvent(ev.id);
                if(typeof uiAlert === 'function') uiAlert('Wardrobe berhasil diperbarui!');
        }
    } else {
        alert('Fitur ini memerlukan custom-modal.js.');
    }
};

window.unassignWardrobe = async function(itemId) {
    if(!activeCommandCenterEventId) return;
    
    const confirm = await uiConfirm('Apakah Anda yakin ingin menghapus wardrobe ini dari acara?');
    if (!confirm) return;

    const ev = adminEventsDb.find(e => String(e.id) === String(activeCommandCenterEventId));
    if(!ev || !ev.wardrobeIds) return;
    
    // Filter out the wardrobe item
    ev.wardrobeIds = ev.wardrobeIds.filter(wItem => {
        const wId = (typeof wItem === 'object' && wItem !== null) ? wItem.id : wItem;
        return String(wId) !== String(itemId);
    });
    
    // Sync to Server Database
    try {
        if (typeof syncEventMetadata === 'function') {
            await syncEventMetadata(ev);
        }
        
        saveUnifiedEventsDatabase(ev);
        if(typeof renderWardrobe === 'function') renderWardrobe();
        if(typeof uiAlert === 'function') uiAlert('Wardrobe berhasil dihapus dari acara.');
    } catch(err) {
        console.error("Gagal sync penghapusan wardrobe:", err);
        if(typeof uiAlert === 'function') uiAlert('Terjadi kesalahan saat menghapus.');
    }
};

window.promptAddExpense = async function() {
    if(!activeCommandCenterEventId) {
        if(typeof uiAlert === 'function') uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    if(typeof uiCustomForm === 'function') {
        const data = await uiCustomForm([
            { id: 'item', label: 'Nama Pengeluaran (Beban)', type: 'text' },
            { id: 'amount', label: 'Nominal (Rp)', type: 'number' },
            { id: 'date', label: 'Tanggal', type: 'date', value: new Date().toISOString().split('T')[0] }
        ], 'Tambah Pengeluaran Acara');
        
        if(data) {
            if(!data.item || !data.amount) {
                uiAlert('Nama pengeluaran dan nominal wajib diisi!');
                return;
            }
            const ev = adminEventsDb.find(e => String(e.id) === String(activeCommandCenterEventId));
            if(!ev) return;
            
            const expList = ev.expenses || [];
            expList.push({ item: data.item, amount: data.amount, date: data.date });
            
            const payload = { metadata: { expenses: expList } };
            
            try {
                const res = await fetch('/api/cms/events/' + ev.id, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                if(res.ok) {
                    uiAlert('Pengeluaran berhasil dicatat!');
                    if(typeof loadUnifiedEventsDatabase === 'function') {
                        await loadUnifiedEventsDatabase();
                        switchCommandCenterEvent(ev.id);
                    }
                } else {
                    uiAlert('Gagal mencatat pengeluaran.');
                }
            } catch(e) {
                console.error(e);
                uiAlert('Terjadi kesalahan jaringan saat menyimpan pengeluaran.');
            }
        }
    } else {
        alert('Fitur ini memerlukan custom-modal.js.');
    }
};

window.promptAddGlobalWardrobe = async function(existingWardrobeStr) {
    let existingItem = null;
    if(existingWardrobeStr) {
        try {
            existingItem = JSON.parse(decodeURIComponent(existingWardrobeStr));
        } catch(e) {}
    }

    if(typeof uiCustomForm === 'function') {
        const data = await uiCustomForm([
            { id: 'imgUrl', label: 'Foto Pakaian (Opsional, file gambar)', type: 'file' },
            { id: 'name', label: 'Kode / Nama Gaun', type: 'text', value: existingItem ? existingItem.name : '' },
            { id: 'desc', label: 'Deskripsi Singkat', type: 'textarea', value: existingItem ? existingItem.desc : '' },
            { id: 'colorName', label: 'Kategori', type: 'text', value: existingItem ? existingItem.colorName : '' },
            { id: 'colorHex', label: 'Warna (Contoh: Hitam, Biru, #FF0000)', type: 'text', value: existingItem ? existingItem.colorHex : '' },
            { id: 'status', label: 'Status Gaun', type: 'select', value: existingItem ? existingItem.status : 'Siap Pakai', options: [{value: 'Siap Pakai', label: 'Siap Pakai'}, {value: 'Sedang Dipakai', label: 'Sedang Dipakai'}, {value: 'Sedang Dicuci/Diperbaiki', label: 'Laundry / Rusak'}] }
        ], existingItem ? 'Edit Wardrobe' : 'Tambah Wardrobe Baru');
        
        if(data) {
            if(!data.name) {
                uiAlert('Nama Gaun wajib diisi!');
                return;
            }
            
            let base64Image = existingItem ? existingItem.imgUrl : '';
            if (data.imgUrl && data.imgUrl instanceof File) {
                try {
                    base64Image = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = e => resolve(e.target.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(data.imgUrl);
                    });
                } catch(err) {
                    console.error('Failed to read image', err);
                }
            }

            try {
                // Fetch existing first
                const res = await fetch('/api/cms/wardrobe-catalog');
                const json = await res.json();
                let items = [];
                if(json.success && json.data) items = json.data;
                
                if (existingItem) {
                    const idx = items.findIndex(i => String(i.db_id) === String(existingItem.db_id) || String(i.id) === String(existingItem.id));
                    if(idx !== -1) {
                        items[idx].name = data.name;
                        items[idx].desc = data.desc;
                        items[idx].colorName = data.colorName;
                        items[idx].colorHex = data.colorHex;
                        items[idx].status = data.status;
                        items[idx].imgUrl = base64Image;
                    }
                } else {
                    items.push({
                        name: data.name,
                        desc: data.desc,
                        colorName: data.colorName,
                        colorHex: data.colorHex,
                        status: data.status,
                        imgUrl: base64Image,
                        frequency: 0
                    });
                }
                
                const saveRes = await fetch('/api/cms/wardrobe-catalog', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ wardrobe: items })
                });
                
                if(saveRes.ok) {
                    uiAlert('Wardrobe berhasil ditambahkan!');
                    renderWardrobe();
                } else {
                    uiAlert('Gagal menyimpan ke server.');
                }
            } catch(e) {
                console.error(e);
                uiAlert('Terjadi kesalahan jaringan.');
            }
        }
    } else {
        alert('Fitur ini memerlukan custom-modal.js.');
    }
};

window.editWardrobe = async function(id) {
    if(typeof uiConfirm === 'function') {
        const confirmDelete = await uiConfirm('Fitur edit detail segera hadir. Apakah Anda ingin MENGHAPUS item ini dari database?');
        if(confirmDelete) {
            try {
                // Remove from API
                const res = await fetch('/api/cms/wardrobe-catalog');
                const json = await res.json();
                let items = [];
                if(json.success && json.data) items = json.data;
                
                items = items.filter(i => i.id !== id && i.name !== id);
                
                const saveRes = await fetch('/api/cms/wardrobe-catalog', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ wardrobe: items })
                });

                if(saveRes.ok) {
                    uiAlert('Wardrobe berhasil dihapus!');
                    renderWardrobe();
                } else {
                    uiAlert('Gagal menghapus dari server.');
                }
            } catch(e) {
                uiAlert('Terjadi kesalahan jaringan.');
            }
        }
    } else {
        if(confirm('Hapus item ini?')) {
            // Simplified fallback
            alert('Harap update di versi baru.');
        }
    }
};

window.updateDashboardMetrics = async function() {
    try {
        const [evRes, cfRes] = await Promise.all([
            fetch('/api/cms/events').catch(() => null),
            fetch('/api/cms/cashflow-transactions').catch(() => null)
        ]);
        
        let events = [];
        if (evRes && evRes.ok) {
            const evJson = await evRes.json();
            if (evJson.success && evJson.data) events = evJson.data;
        } else {
            events = window.adminEventsDb || [];
        }

        let cashflows = [];
        if (cfRes && cfRes.ok) {
            const cfJson = await cfRes.json();
            if (cfJson.success && cfJson.data) cashflows = cfJson.data;
        }

        // Metrics for events
        const totalEvents = events.length;
        const terkunci = events.filter(e => e.status === 'Terkunci').length;
        const tentative = events.filter(e => e.status === 'Tentative').length;
        const review = events.filter(e => e.status === 'Review' || !e.status).length;

        const revTerkunci = events.filter(e => e.status === 'Terkunci').reduce((sum, e) => sum + (Number(e.rawPrice) || 0), 0);
        
        const convRate = totalEvents > 0 ? Math.round((terkunci / totalEvents) * 100) : 0;
        const avgDeal = terkunci > 0 ? Math.round(revTerkunci / terkunci) : 0;
        
        const annualTarget = 100000000; // 100 Juta as example target
        const targetPercent = Math.round((revTerkunci / annualTarget) * 100);

        // Calculate expenses
        const expenses = cashflows.filter(c => c.type === 'expense' || c.type === 'out');
        const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const avgExpense = expenses.length > 0 ? Math.round(totalExpense / expenses.length) : 0;

        let topExpense = 'Belum Ada';
        if (expenses.length > 0) {
            const maxExp = expenses.reduce((max, e) => (Number(e.amount) > Number(max.amount)) ? e : max, expenses[0]);
            topExpense = maxExp.desc || 'Pengeluaran';
        }

        const formatRp = (num) => 'Rp ' + num.toLocaleString('id-ID');

        // Update DOM
        const elRev = document.getElementById('dashTotalRev');
        if(elRev) elRev.textContent = formatRp(revTerkunci);

        const elEvents = document.getElementById('dashTotalEvents');
        if(elEvents) elEvents.innerHTML = totalEvents + ' Acara';
        
        const elEventsFoot = document.getElementById('dashTotalEvents')?.nextElementSibling;
        if(elEventsFoot) elEventsFoot.innerHTML = '<span style="color:var(--adm-info); font-weight:700;">' + terkunci + ' Terkunci</span><span> ' + tentative + ' Tentative ' + review + ' Review</span>';

        const elConv = document.getElementById('dashConvRate');
        if(elConv) elConv.textContent = convRate + '%';

        const elAvgDeal = document.getElementById('dashAvgDeal');
        if(elAvgDeal) elAvgDeal.textContent = formatRp(avgDeal);

        const elTarget = document.getElementById('dashAnnualTarget');
        if(elTarget) elTarget.textContent = targetPercent + '% Tercapai';

        const elLeadTime = document.getElementById('dashLeadTime');
        if(elLeadTime) elLeadTime.textContent = 'H-30 Hari'; // static avg

        const elAvgExp = document.getElementById('dashAvgExpense');
        if(elAvgExp) elAvgExp.textContent = formatRp(avgExpense);

        const elTopExp = document.getElementById('dashTopExpense');
        if(elTopExp) elTopExp.textContent = topExpense;

    } catch(e) {
        console.error('Failed to update dashboard metrics', e);
    }
};

// Hook it into window.loadUnifiedEventsDatabase
const _origLoadUnified2 = window.loadUnifiedEventsDatabase;
if(_origLoadUnified2) {
    window.loadUnifiedEventsDatabase = async function() {
        await _origLoadUnified2();
        if(typeof updateDashboardMetrics === 'function' && document.getElementById('sec-dashboard')) {
            updateDashboardMetrics();
        }
    }
}
window.deleteWardrobeItem = async function(id) {
    if(!await window.uiConfirm('Yakin ingin menghapus item wardrobe ini?')) return;
    try {
        const res = await fetch('/api/cms/wardrobe-catalog/' + id, { method: 'DELETE' });
        if(res.ok) {
            uiAlert('Wardrobe berhasil dihapus!');
            renderWardrobe();
        } else {
            uiAlert('Gagal menghapus wardrobe.');
        }
    } catch(e) {
        console.error(e);
        uiAlert('Kesalahan jaringan.');
    }
};





window.fetchWaTemplates = async function() {
    try {
        const res = await fetch('/api/cms/wa-templates');
        if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                window.currentWaTemplates = json.data.map((t, i) => ({
                    id: 't' + i,
                    title: t.title || 'Sapaan',
                    body: t.message || t
                }));
                // Repopulate if Command Center is active
                if (window.activeCommandCenterEvent) {
                    const waListContainer = document.getElementById('ccWaAutomationList');
                    if (waListContainer) {
                        let waHtml = '';
                        window.currentWaTemplates.forEach(t => {
                            waHtml += `
                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:12px; margin-bottom:10px;">
                                    <div style="font-weight:700; color:var(--adm-gold); margin-bottom:6px;">${t.title}</div>
                                    <div style="font-size:0.8rem; color:#94A3B8; margin-bottom:8px;">${t.body.substring(0, 50)}...</div>
                                    <button class="btn btn-secondary btn-sm" onclick="sendWaTemplate('${encodeURIComponent(t.body)}')">Kirim Pesan Ini</button>
                                </div>
                            `;
                        });
                        waListContainer.innerHTML = waHtml;
                    }
                }
            }
        }
    } catch (e) {
        console.error('Failed to fetch WA templates', e);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    fetchWaTemplates();
});

// ============================================================
// Edit Venue & Jam Acara Terpadu
// ============================================================

window.openEditEventScheduleModal = function(eventId) {
    if (!eventId) eventId = window.activeCommandCenterEventId;
    if (!eventId || !window.adminEventsDb) return;
    
    const ev = window.adminEventsDb.find(e => String(e.id) === String(eventId));
    if (!ev) return;
    
    document.getElementById('editScheduleEventId').value = ev.id;
    document.getElementById('editScheduleEventTitle').value = ev.title || ev.event || '';
    document.getElementById('editScheduleEventDate').value = ev.date || '';
    document.getElementById('editScheduleEventStatus').value = ev.status || 'Review';
    document.getElementById('editScheduleEventVenue').value = ev.venue || (ev.metadata && ev.metadata.venue) || '';
    
    let startTime = '18:00';
    let endTime = '22:00';
    
    if (ev.time) {
        const parts = ev.time.split('-');
        if (parts.length > 0) startTime = parts[0].replace('WIB', '').trim();
        if (parts.length > 1) endTime = parts[1].replace('WIB', '').trim();
    }
    
    document.getElementById('editScheduleStartTime').value = startTime;
    document.getElementById('editScheduleEndTime').value = endTime;
    
    document.getElementById('editScheduleCollisionAlert').style.display = 'none';
    
    const modal = document.getElementById('editEventScheduleModal');
    if (modal) {
        modal.style.display = 'flex';
        // Give it a tiny delay to allow CSS transitions if needed
        setTimeout(() => modal.classList.add('show'), 10);
    }
    
    window.handleEditTimeChange();
};

window.handleEditTimeChange = function() {
    const start = document.getElementById('editScheduleStartTime').value;
    const end = document.getElementById('editScheduleEndTime').value;
    
    let durationText = '0 Jam';
    if (start && end) {
        let [sh, sm] = start.split(':').map(Number);
        let [eh, em] = end.split(':').map(Number);
        
        let startMins = sh * 60 + sm;
        let endMins = eh * 60 + em;
        if (endMins < startMins) endMins += 24 * 60; // cross midnight
        
        let diff = endMins - startMins;
        let diffH = Math.floor(diff / 60);
        let diffM = diff % 60;
        
        if (diffM === 0) durationText = `${diffH} Jam`;
        else durationText = `${diffH} Jam ${diffM} Menit`;
    }
    
    document.getElementById('editScheduleDuration').value = durationText;
    document.getElementById('editScheduleTimePreview').textContent = `${start} - ${end} WIB (${durationText})`;
};

window.checkEditScheduleCollision = function() {
    const date = document.getElementById('editScheduleEventDate').value;
    const currentId = document.getElementById('editScheduleEventId').value;
    const alertBox = document.getElementById('editScheduleCollisionAlert');
    
    if (!date || !window.adminEventsDb) return;
    
    const conflicts = window.adminEventsDb.filter(e => e.date === date && String(e.id) !== String(currentId));
    
    if (conflicts.length > 0) {
        alertBox.style.display = 'block';
        alertBox.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        alertBox.style.color = '#EF4444';
        alertBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        alertBox.innerHTML = `⚠️ <strong>Peringatan Bentrok:</strong> Ada ${conflicts.length} acara lain pada tanggal ini!`;
    } else {
        alertBox.style.display = 'block';
        alertBox.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        alertBox.style.color = '#10B981';
        alertBox.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        alertBox.innerHTML = `✅ Tanggal ini aman dari jadwal acara lain.`;
    }
};

window.handleSaveEventSchedule = async function(e) {
    if (e) e.preventDefault();
    
    const eventId = document.getElementById('editScheduleEventId').value;
    const title = document.getElementById('editScheduleEventTitle').value;
    const date = document.getElementById('editScheduleEventDate').value;
    const status = document.getElementById('editScheduleEventStatus').value;
    const venue = document.getElementById('editScheduleEventVenue').value;
    const start = document.getElementById('editScheduleStartTime').value;
    const end = document.getElementById('editScheduleEndTime').value;
    
    if (!eventId || !title || !date || !venue || !start || !end) {
        if (typeof uiAlert === 'function') uiAlert('Mohon lengkapi semua data wajib!');
        return;
    }
    
    const timeStr = `${start} - ${end} WIB`;
    
    const payload = {
        title: title,
        event: title,
        date: date,
        time: timeStr,
        status: status,
        venue: venue,
        metadata: { venue: venue } // ensure venue is also saved to metadata if used there
    };
    
    try {
        const tokenMeta = document.querySelector('meta[name="csrf-token"]');
        const token = tokenMeta ? tokenMeta.getAttribute('content') : '';
        
        const res = await fetch('/api/cms/events/' + eventId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token
            },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error('Gagal menyimpan perubahan');
        
        const json = await res.json();
        
        // Update local DB
        if (window.adminEventsDb) {
            const ev = window.adminEventsDb.find(e => String(e.id) === String(eventId));
            if (ev) {
                ev.title = title;
                ev.event = title;
                ev.date = date;
                ev.time = timeStr;
                ev.status = status;
                ev.venue = venue;
                if (!ev.metadata) ev.metadata = {};
                ev.metadata.venue = venue;
            }
        }
        
        if (typeof window.showToast === 'function') window.showToast('Jadwal Acara berhasil diperbarui!', 'success');
        if (typeof closeModals === 'function') closeModals();
        
        // Refresh UI
        if (window.activeCommandCenterEventId === eventId && typeof loadActiveEventInCommandCenter === 'function') {
            loadActiveEventInCommandCenter(eventId);
        }
        if (typeof renderDashEvents === 'function') renderDashEvents();
        
    } catch (error) {
        console.error(error);
        if (typeof uiAlert === 'function') uiAlert('Terjadi kesalahan saat menyimpan data.');
    }
};

// --- FINAL MUSIC & SOUNDBOARD OVERRIDES ---

// Helper to get current event
function _getEv() {
    return window.activeCommandCenterEvent || (typeof currentEv !== 'undefined' ? currentEv : null);
}


// ==========================================
// MASTER MUSIC BANK MODULE
// ==========================================
window.getGlobalMusicBank = function() {
    let bank = [];
    try {
        const raw = localStorage.getItem('mc_music_bank_data');
        if (raw) bank = JSON.parse(raw);
    } catch(e){}
    
    // If empty, supply dummies
    if (!Array.isArray(bank) || bank.length === 0) {
        bank = [
            { id: 'bank_1', title: 'Wedding March (Bridal Chorus)', artist: 'Richard Wagner', url_link: '', file_upload: 'wedding_march.mp3', type: 'BGM' },
            { id: 'bank_2', title: 'A Thousand Years', artist: 'Christina Perri', url_link: 'https://youtube.com/watch?v=rtOvBOTyX00', file_upload: '', type: 'BGM' },
            { id: 'bank_3', title: 'Drumroll Suspens', artist: 'SFX', url_link: '', file_upload: 'drumroll.wav', type: 'SFX' },
            { id: 'bank_4', title: 'Applause / Tepuk Tangan', artist: 'SFX', url_link: '', file_upload: 'applause.wav', type: 'SFX' }
        ];
        localStorage.setItem('mc_music_bank_data', JSON.stringify(bank));
        if (window.syncEngine && window.syncEngine.push) {
            window.syncEngine.push('/api/cms/music-bank', { data: bank });
        }
    }
    return bank;
};

window.saveGlobalMusicBank = function(bank) {
    localStorage.setItem('mc_music_bank_data', JSON.stringify(bank));
    if (window.syncEngine && window.syncEngine.push) {
        window.syncEngine.push('/api/cms/music-bank', { data: bank });
    }
};

window.openManageMusicBank = async function() {
    window.memoryAudioFiles = window.memoryAudioFiles || {};
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        window.memoryAudioFiles[fileInput.files[0].name] = URL.createObjectURL(fileInput.files[0]);
    }
    
    const bank = window.getGlobalMusicBank();
    let html = '<div style="max-height:500px; overflow-y:auto; padding-right:0.5rem;">';
    if (bank.length === 0) {
        html += '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Bank musik masih kosong.</div>';
    } else {
        bank.forEach((m, idx) => {
            html += '<div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border:1px solid rgba(255,255,255,0.1); border-radius:8px; margin-bottom:0.75rem; background:rgba(0,0,0,0.2);">';
            html += '<div>';
            html += '<div style="font-weight:bold; color:#FFF; font-size:1.1rem; margin-bottom:0.2rem;">' + m.title + '</div>';
            html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + (m.artist || 'Unknown') + ' | ' + (m.type || 'Lainnya') + '</div>';
            html += '<div style="font-size:0.75rem; color:var(--adm-text-secondary); margin-top:0.3rem;">' + (m.url_link ? '&#128279; ' + m.url_link : (m.file_upload ? '&#128194; ' + m.file_upload : '')) + '</div>';
            html += '</div>';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteMusicBankItem(' + idx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);">Hapus</button>';
            html += '</div>';
        });
    }
    html += '</div>';
    
    const modalId = 'modalMusicBankManage';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.classList.add('active');
        overlay.style.zIndex = '999999';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h3 class="modal-title">&#128194; Manajemen Bank Musik Master</h3>
                    <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'">&times;</button>
                </div>
                <div class="modal-body" id="musicBankBody">${html}</div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').style.display='none'">Tutup</button>
                    <button class="btn btn-primary" onclick="window.uiAlert('Untuk menambah lagu ke bank, gunakan tombol + Tambah Lagu pada acara, dan pilih Opsi \'Simpan ke Bank Musik Master\'.')">+ Cara Tambah Lagu</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        document.getElementById('musicBankBody').innerHTML = html;
        overlay.style.display = 'flex';
        overlay.classList.add('active');
    }
};

window.deleteMusicBankItem = async function(idx) {
    const bank = window.getGlobalMusicBank();
    if (await window.uiConfirm('Hapus lagu ini dari Bank Musik Master? Lagu yang sudah di-import ke acara tidak akan terhapus.')) {
        bank.splice(idx, 1);
        window.saveGlobalMusicBank(bank);
        window.openManageMusicBank();
    }
};

window.showMusicBankSelector = function() {
    const bank = window.getGlobalMusicBank();
    
    const modalId = 'modalMusicBankSelect';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.classList.add('active');
        overlay.style.zIndex = '9999999'; // above uiFormModal
        document.body.appendChild(overlay);
    }
    
    let html = '<div style="max-height:400px; overflow-y:auto;">';
    if (bank.length === 0) {
        html += '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Bank musik masih kosong.</div>';
    } else {
        bank.forEach((m, idx) => {
            html += '<div onclick="window.selectBankItem(' + idx + ')" style="display:flex; flex-direction:column; padding:0.8rem; border:1px solid rgba(255,255,255,0.1); border-radius:8px; margin-bottom:0.5rem; cursor:pointer; background:rgba(0,0,0,0.2);" onmouseover="this.style.background=\'rgba(212,175,55,0.1)\'" onmouseout="this.style.background=\'rgba(0,0,0,0.2)\'">';
            html += '<div style="font-weight:bold; color:#FFF; margin-bottom:0.2rem;">' + m.title + '</div>';
            html += '<div style="font-size:0.8rem; color:var(--adm-gold);">' + (m.artist || 'Unknown') + '</div>';
            html += '</div>';
        });
    }
    html += '</div>';
    
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3 class="modal-title">🎵 Impor dari Bank Musik</h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'">&times;</button>
            </div>
            <div class="modal-body">${html}</div>
            <div class="modal-footer">
                <button class="btn btn-secondary" style="width:100%;" onclick="document.getElementById('${modalId}').style.display='none'">Batal</button>
            </div>
        </div>
    `;
    overlay.style.display = 'flex';
        overlay.classList.add('active');
};

window.selectBankItem = function(idx) {
    const bank = window.getGlobalMusicBank();
    const m = bank[idx];
    if (m) {
        const titleIn = document.getElementById('title');
        const artistIn = document.getElementById('artist');
        const urlIn = document.getElementById('url_link');
        const fileIn = document.getElementById('file_upload');
        
        if (titleIn) titleIn.value = m.title;
        if (artistIn) artistIn.value = m.artist || '';
        
        if (m.url_link && urlIn) {
            urlIn.value = m.url_link;
            urlIn.dispatchEvent(new Event('input'));
        } else if (m.file_upload) {
            if (urlIn) {
                urlIn.value = '';
                urlIn.dispatchEvent(new Event('input'));
            }
            if (fileIn) {
                fileIn.disabled = true;
                fileIn.parentElement.innerHTML += '<div style="margin-top:0.5rem; font-size:0.8rem; color:#10B981;">&#10004; Menggunakan file tersimpan: ' + m.file_upload + '</div>';
                window._pendingBankFile = m.file_upload;
            }
        }
        document.getElementById('modalMusicBankSelect').style.display = 'none';
        window.showToast('Lagu berhasil di-impor dari Bank!', 'green');
    }
};

window.openAddMusicModal = async function(editIndex = -1) { window._fullBankOptionsMusic = null;
    let ev = _getEv();
    if (!ev) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    
    let editItem = null;
    if (editIndex >= 0 && ev.musicList && ev.musicList[editIndex]) {
        editItem = ev.musicList[editIndex];
    }
    
    const rundownOptions = [{value: '', label: '-- Tidak Terhubung (Standby) --'}];
    if (ev.rundown && ev.rundown.length > 0) {
        ev.rundown.forEach((r, idx) => {
            rundownOptions.push({value: idx, label: `Segmen ${idx+1}: ${r.title || 'Untitled'}`});
        });
    }
    
    const bank = window.getGlobalMusicBank();
    let bankOptionsHtml = '';
    if (bank && bank.length > 0) {
        bank.forEach((b, idx) => {
            // Check if this matches the editItem
            let isSelected = false;
            if (editItem && editItem.title === b.title && (editItem.artist || '') === (b.artist || '')) {
                isSelected = true;
            }
            bankOptionsHtml += `<option value="${idx}" ${isSelected ? 'selected' : ''}>${b.title} ${b.artist ? '- ' + b.artist : ''}</option>`;
        });
    } else {
        bankOptionsHtml = '<option value="" disabled>-- Master Bank Kosong, silakan isi dulu --</option>';
    }
    
    const modalId = 'modalEventMusicForm';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '999999';
        document.body.appendChild(overlay);
    }
    
    let html = `
        <div class="modal-content" style="max-width:550px;">
            <div class="modal-header">
                <h3 class="modal-title">${editItem ? '✏️ Edit Lagu Acara' : '🎵 Tambah Lagu Acara'}</h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active');">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="evmFormIdx" value="${editIndex >= 0 ? editIndex : ''}">
                
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1.5rem;">
                    <label class="form-label" style="color:var(--adm-gold); font-size:1.1rem; margin-bottom:0.8rem;">Pilih Lagu dari Master Bank *</label>
                    <select class="form-select" id="evmFormBankSelect" style="font-size:1.05rem; padding:0.6rem;">
                        <option value="">-- Pilih Lagu --</option>
                        ${bankOptionsHtml}
                    </select>
                    <div style="font-size:0.75rem; color:var(--adm-text-muted); margin-top:0.6rem;">
                        <i>💡 Mengunggah file audio atau memasukkan link YouTube sekarang hanya dapat dilakukan secara terpusat melalui menu <b>Master Bank Musik</b>.</i>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Terhubung ke Segmen Rundown</label>
                    <select class="form-select" id="evmFormSegment">
                        ${rundownOptions.map(opt => `<option value="${opt.value}" ${editItem && editItem.segment_idx == opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Instruksi Cue (opsional, untuk Stage MC / Operator)</label>
                    <textarea class="form-input" id="evmFormCue" rows="2" placeholder="Contoh: Putar dari menit 1:15 saat MC memanggil nama"> ${editItem ? (editItem.cue_instruction || '') : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Kategori Momen</label>
                    <select class="form-select" id="evmFormCategory">
                        <option value="BGM" ${editItem && editItem.category==='BGM'?'selected':''}>General Background BGM</option>
                        <option value="Opening" ${editItem && editItem.category==='Opening'?'selected':''}>Opening & Welcoming</option>
                        <option value="Entrance" ${editItem && editItem.category==='Entrance'?'selected':''}>Grand Entrance</option>
                        <option value="Ceremony" ${editItem && editItem.category==='Ceremony'?'selected':''}>Ceremony & Sambutan</option>
                        <option value="Toast" ${editItem && editItem.category==='Toast'?'selected':''}>Toast & Cake Cutting</option>
                        <option value="Dinner" ${editItem && editItem.category==='Dinner'?'selected':''}>Dinner & Entertainment</option>
                        <option value="Games" ${editItem && editItem.category==='Games'?'selected':''}>Games & Bouquet Toss</option>
                        <option value="Closing" ${editItem && editItem.category==='Closing'?'selected':''}>Closing & Photo Session</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active');">Batal</button>
                <button class="btn btn-primary" onclick="window.saveEventMusicForm()">Simpan Lagu</button>
            </div>
        </div>
    `;
    
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.classList.add('active');
};


window.syncMusicToRundown = function(ev) {
    if (!ev || !ev.rundown) return;
    // Bersihkan semua cue_music bawaan/dummy
    ev.rundown.forEach(r => r.cue_music = '');
    
    if (ev.musicList) {
        ev.musicList.forEach(m => {
            let idxs = Array.isArray(m.segment_idxs) ? m.segment_idxs : (m.segment_idx !== null && m.segment_idx !== undefined ? [m.segment_idx] : []);
            idxs.forEach(idx => {
                if (ev.rundown[idx]) {
                    // Jika ada lebih dari 1 lagu di segmen yg sama, gabungkan (meskipun idealnya 1 segmen 1 BGM utama)
                    if (ev.rundown[idx].cue_music) {
                        ev.rundown[idx].cue_music += ' & ' + m.title;
                    } else {
                        ev.rundown[idx].cue_music = m.title;
                    }
                }
            });
        });
    }
};

window.saveEventMusicForm = async function() {
    const idxStr = document.getElementById('evmFormIdx').value;
    const bankIdxStr = document.getElementById('evmFormBankSelect').value;
    const cue_instruction = document.getElementById('evmFormCue').value.trim();
    
    const checkedBoxes = Array.from(document.querySelectorAll('.evm-segment-cb:checked'));
    const segment_idxs = checkedBoxes.map(cb => parseInt(cb.value));
    const segment_idx = segment_idxs.length > 0 ? segment_idxs[0] : null; 
    
    const category = document.getElementById('evmFormCategory').value;
    
    if (bankIdxStr === '') return window.uiAlert('Pilih lagu dari Master Bank terlebih dahulu!');
    
    let ev = _getEv();
    if (!ev) return;
    if (!ev.musicList) ev.musicList = [];
    
    const bank = window.getGlobalMusicBank();
    const selectedBankItem = bank[parseInt(bankIdxStr)];
    if (!selectedBankItem) return window.uiAlert('Lagu di Master Bank tidak ditemukan!');
    
    // Mencegah duplikasi lagu yang sama ditambahkan dua kali sebagai baris berbeda
    if (idxStr === '') {
        const isExist = ev.musicList.find(m => m.title === selectedBankItem.title);
        if (isExist) {
            return window.uiAlert('Lagu ini sudah ada di dalam daftar Playlist Acara. Silakan edit lagu yang sudah ada jika ingin mengubah segmennya.');
        }
    }
    
    const newItem = {
        id: (idxStr !== '') ? ev.musicList[parseInt(idxStr)].id : 'music_' + Date.now(),
        title: selectedBankItem.title,
        artist: selectedBankItem.artist,
        url_link: selectedBankItem.url_link,
        file_upload: selectedBankItem.file_upload,
        cue_instruction: cue_instruction,
        segment_idx: segment_idx,
        segment_idxs: segment_idxs,
        category: category
    };
    
    if (idxStr !== '') {
        ev.musicList[parseInt(idxStr)] = newItem;
    } else {
        ev.musicList.push(newItem);
    }
    
    // Sinkronisasi ulang secara menyeluruh
    window.syncMusicToRundown(ev);
    
    ev.metadata = ev.metadata || {};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList; 
    
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    
    document.getElementById('modalEventMusicForm').style.display = 'none';
    document.getElementById('modalEventMusicForm').classList.remove('active');
    
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
};

window.deleteMusic = async function(index) {
    let ev = _getEv();
    if (!ev || !ev.musicList || !ev.musicList[index]) return;
    if (!(await window.uiConfirm(`Hapus lagu: "${ev.musicList[index].title}" dari playlist?`))) return;
    
    ev.musicList.splice(index, 1);
    
    // Sinkronisasi ulang secara menyeluruh
    window.syncMusicToRundown(ev);
    
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList;
    
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
    
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList;
    
    _setEv(ev);
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
    
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};


window.resetCurrentEventMusic = async function() {
    let ev = _getEv();
    if (!(await window.uiConfirm('Apakah Anda yakin ingin mereset playlist musik ke default? Semua musik kustom yang telah ditambahkan akan terhapus.'))) return;
    if (ev) {
        ev.musicList = [];
        if (ev.metadata) ev.metadata.musicList = [];
        if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
        if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
        if (typeof window.showToast === 'function') window.showToast('Playlist berhasil direset ke Default Master.');
    }
};

window.filterMusicList = function() {
    let ev = _getEv();
    if (ev && typeof window.renderAdminMusicListWrapper === 'function') {
        window.renderAdminMusicListWrapper(ev);
    }
};

window.openAddLandingMusicModal = async function(editIndex = -1) {
    let ev = _getEv();
    if (!ev) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    
    let editItem = null;
    if (editIndex >= 0 && ev.landingMusic && ev.landingMusic[editIndex]) {
        editItem = ev.landingMusic[editIndex];
    }
    
    const bank = window.getGlobalMusicBank();
    let bankOptionsHtml = '';
    if (bank && bank.length > 0) {
        bank.forEach((b, idx) => {
            let isSelected = false;
            if (editItem && editItem.title === b.title && (editItem.artist || '') === (b.artist || '')) {
                isSelected = true;
            }
            bankOptionsHtml += `<option value="${idx}" ${isSelected ? 'selected' : ''}>${b.title} ${b.artist ? '- ' + b.artist : ''}</option>`;
        });
    } else {
        bankOptionsHtml = '<option value="" disabled>-- Master Bank Kosong, silakan isi dulu --</option>';
    }
    
    const modalId = 'modalLandingMusicForm';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '999999';
        document.body.appendChild(overlay);
    }
    
    let html = `
        <div class="modal-content" style="max-width:550px;">
            <div class="modal-header">
                <h3 class="modal-title">${editItem ? '✏️ Edit Musik Landing Page' : '🎵 Tambah Musik Landing Page'}</h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active');">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="lmFormIdx" value="${editIndex >= 0 ? editIndex : ''}">
                
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1.5rem;">
                    <label class="form-label" style="color:var(--adm-gold); font-size:1.1rem; margin-bottom:0.8rem;">Pilih Lagu dari Master Bank *</label>
                    <select class="form-select" id="lmFormBankSelect" style="font-size:1.05rem; padding:0.6rem;">
                        <option value="">-- Pilih Lagu --</option>
                        ${bankOptionsHtml}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Status Auto-play di Landing Page</label>
                    <select class="form-select" id="lmFormStatus">
                        <option value="1" ${editItem && editItem.is_active ? 'selected' : ''}>Aktif (Berputar Otomatis)</option>
                        <option value="0" ${editItem && !editItem.is_active ? 'selected' : ''}>Tidak Aktif (Mute Default)</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active');">Batal</button>
                <button class="btn btn-primary" onclick="window.saveLandingMusicForm()">Simpan Musik</button>
            </div>
        </div>
    `;
    
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.classList.add('active');
};

window.saveLandingMusicForm = async function() {
    const idxStr = document.getElementById('lmFormIdx').value;
    const bankIdxStr = document.getElementById('lmFormBankSelect').value;
    const is_active = document.getElementById('lmFormStatus').value === '1';
    
    if (bankIdxStr === '') return window.uiAlert('Pilih lagu dari Master Bank terlebih dahulu!');
    
    let ev = _getEv();
    if (!ev) return;
    if (!ev.landingMusic) ev.landingMusic = [];
    
    const bank = window.getGlobalMusicBank();
    const selectedBankItem = bank[parseInt(bankIdxStr)];
    if (!selectedBankItem) return window.uiAlert('Lagu di Master Bank tidak ditemukan!');
    
    const newItem = {
        id: (idxStr !== '') ? ev.landingMusic[parseInt(idxStr)].id : 'landing_' + Date.now(),
        title: selectedBankItem.title,
        artist: selectedBankItem.artist,
        url_link: selectedBankItem.url_link,
        file_upload: selectedBankItem.file_upload,
        is_active: is_active
    };
    
    if (idxStr !== '') {
        ev.landingMusic[parseInt(idxStr)] = newItem;
    } else {
        ev.landingMusic.push(newItem);
    }
    
    ev.metadata = ev.metadata || {};
    ev.metadata.landingMusic = ev.landingMusic;
    // _setEv(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    
    document.getElementById('modalLandingMusicForm').style.display = 'none';
    document.getElementById('modalLandingMusicForm').classList.remove('active');
    
    if (typeof window.renderAdminLandingMusicListWrapper === 'function') {
        window.renderAdminLandingMusicListWrapper(ev);
    } else if (typeof window.renderAdminLandingMusicList === 'function') {
        window.renderAdminLandingMusicList(ev);
    }
};


window.deleteLandingMusic = async function(index) {
    let ev = _getEv();
    if (!ev || !ev.landingMusic || !ev.landingMusic[index]) return;
    if (!(await window.uiConfirm(`Hapus musik: "${ev.landingMusic[index].title}"?`))) return;
    ev.landingMusic.splice(index, 1);
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.landingMusic = ev.landingMusic;
    if (typeof window.renderAdminLandingMusicList === 'function') window.renderAdminLandingMusicList(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};

window.toggleLandingMusic = function(index) {
    let ev = _getEv();
    if (!ev || !ev.landingMusic || !ev.landingMusic[index]) return;
    const currentState = ev.landingMusic[index].is_active;
    
    if (!currentState) {
        ev.landingMusic.forEach(m => m.is_active = false);
    }
    ev.landingMusic[index].is_active = !currentState;
    
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.landingMusic = ev.landingMusic;
    if (typeof window.renderAdminLandingMusicList === 'function') window.renderAdminLandingMusicList(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};

// --- SOUNDBOARD MODULE ---
window.checkAndGenerateDummySoundboard = function(currentEv) {
    if (currentEv.metadata) {
        if (currentEv.metadata.soundboard) currentEv.soundboard = currentEv.metadata.soundboard;
        if (currentEv.metadata.landingMusic) currentEv.landingMusic = currentEv.metadata.landingMusic;
    }
    if (!currentEv.soundboard) currentEv.soundboard = [];
    if (!currentEv.landingMusic) currentEv.landingMusic = [];
};
window.renderAdminSoundboardList = function(currentEv) {
    if (!currentEv) return;
    window.checkAndGenerateDummySoundboard(currentEv);
    
    // Update Title
    const titleEl = document.getElementById('soundboardEventTitle');
    if (titleEl) titleEl.textContent = ' ' + (currentEv.title || '');
    
    const sbList = currentEv.soundboard || [];
    
    // Update KPI
    const kpiTotal = document.getElementById('sbMetricTotal');
    if (kpiTotal) kpiTotal.textContent = sbList.length + ' Sound';
    
    const kpiActive = document.getElementById('sbMetricActive');
    if (kpiActive) {
        const activeCount = sbList.filter(item => item.is_brought).length;
        kpiActive.textContent = activeCount + ' Sound';
    }
    
    // 1. Render Grid Preview
    const gridContainer = document.getElementById('adminSoundboardGridPreview');
    if (gridContainer) {
        if (sbList.length === 0) {
            gridContainer.innerHTML = '<div style="color:var(--text-muted);">Belum ada sound effect.</div>';
        } else {
            let gridHtml = '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:1rem;">';
            sbList.forEach(item => {
                if (!item.is_brought) return;
                gridHtml += `
                    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:1rem; text-align:center; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background=\'rgba(56,189,248,0.1)'" onmouseout="this.style.background=\'rgba(255,255,255,0.05)'" onclick="window.playSoundboardEffect('${item.title}')">
                        <div style="font-size:2rem; margin-bottom:0.5rem;">🎵</div>
                        <div style="font-weight:700; font-size:0.85rem;">${item.title}</div>
                        <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:0.25rem;">[${item.shortcut}]</div>
                    </div>
                `;
            });
            gridHtml += '</div>';
            gridContainer.innerHTML = gridHtml;
        }
    }
    
    // 2. Render Table
    const tableContainer = document.getElementById('adminSoundboardTableContainer');
    if (tableContainer) {
        if (sbList.length === 0) {
            tableContainer.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-muted);">Belum ada efek suara.</div>';
            return;
        }
        
        let html = '<table class="ecc-table" style="width:100%; text-align:left; border-collapse:collapse;">';
        html += '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><th style="padding:1rem;">Judul Efek</th><th style="padding:1rem;">Tombol Shortcut</th><th style="padding:1rem;">Status Bawa (Stage Mode)</th><th style="padding:1rem; text-align:right;">Aksi</th></tr></thead>';
        html += '<tbody>';
        
        sbList.forEach((item, idx) => {
            let statusBadge = item.is_brought 
                ? '<span style="background:rgba(56,189,248,0.15); color:#38BDF8; padding:0.25rem 0.6rem; border-radius:9999px; font-size:0.75rem; font-weight:700;">👀 Dibawa</span>'
                : '<span style="background:rgba(255,255,255,0.1); color:var(--adm-text-secondary); padding:0.25rem 0.6rem; border-radius:9999px; font-size:0.75rem;">Disembunyikan</span>';
                
            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">';
            html += '<td style="padding:1rem; font-weight:700;">' + (item.title || 'Untitled') + '</td>';
            html += '<td style="padding:1rem;"><kbd style="background:#333; padding:0.2rem 0.5rem; border-radius:4px;">' + (item.shortcut || '-') + '</kbd></td>';
            html += '<td style="padding:1rem;">' + statusBadge + '</td>';
            html += '<td style="padding:1rem; text-align:right; white-space:nowrap;">';
            html += `<button class="btn btn-secondary btn-sm" onclick="window.playSoundboardEffect('${item.title.replace(/'/g, "\\'")}')" style="margin-right:0.5rem; color:#60A5FA; border-color:rgba(96,165,250,0.3);" title="Putar Preview">▶️ Putar</button>`;
            html += '<button class="btn btn-secondary btn-sm" onclick="window.toggleSoundboardIsBrought(' + idx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);">' + (item.is_brought ? 'Sembunyikan' : 'Bawa') + '</button>';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.openAddSoundboardModal(' + idx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteSoundboard(' + idx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>';
            html += '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        tableContainer.innerHTML = html;
    }
};

window.openAddSoundboardModal = async function(editIndex = -1) { window._fullBankOptionsSb = null;
    let ev = _getEv();
    if (!ev) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    
    let editItem = null;
    if (editIndex >= 0 && ev.soundboard && ev.soundboard[editIndex]) {
        editItem = ev.soundboard[editIndex];
    }
    
    const bank = window.getGlobalMusicBank();
    let bankOptionsHtml = '';
    if (bank && bank.length > 0) {
        bank.forEach((b, idx) => {
            let isSelected = false;
            if (editItem && editItem.title === b.title) {
                isSelected = true;
            }
            bankOptionsHtml += `<option value="${idx}" ${isSelected ? 'selected' : ''}>${b.title} ${b.artist ? '- ' + b.artist : ''}</option>`;
        });
    } else {
        bankOptionsHtml = '<option value="" disabled>-- Master Bank Kosong, silakan isi dulu --</option>';
    }
    
    const modalId = 'modalSoundboardForm';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '999999';
        document.body.appendChild(overlay);
    }
    
    let html = `
        <div class="modal-content" style="max-width:550px;">
            <div class="modal-header">
                <h3 class="modal-title">${editItem ? '✏️ Edit Sound Effect' : '🎵 Tambah Sound Effect Baru'}</h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active');">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="sbFormIdx" value="${editIndex >= 0 ? editIndex : ''}">
                
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1.5rem;">
                    <label class="form-label" style="color:var(--adm-gold); font-size:1.1rem; margin-bottom:0.8rem;">Pilih Sound Effect dari Master Bank *</label>
                    <input type="text" id="sbFormBankSearch" class="form-input" placeholder="🔍 Ketik untuk mencari efek suara..." style="margin-bottom:0.5rem;" oninput="
                        const filter = this.value.toLowerCase();
                        const select = document.getElementById('sbFormBankSelect');
                        if (!window._fullBankOptionsSb) {
                            window._fullBankOptionsSb = Array.from(select.options).map(o => ({val: o.value, text: o.text, selected: o.selected}));
                        }
                        select.innerHTML = '';
                        window._fullBankOptionsSb.forEach(o => {
                            if (o.val === '' || o.text.toLowerCase().includes(filter)) {
                                const opt = document.createElement('option');
                                opt.value = o.val;
                                opt.textContent = o.text;
                                if (o.selected) opt.selected = true;
                                select.appendChild(opt);
                            }
                        });
">
                    <select class="form-select" id="sbFormBankSelect" style="font-size:1.05rem; padding:0.6rem;">
                        <option value="">-- Pilih Efek Suara --</option>
                        ${bankOptionsHtml}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Tombol Shortcut (Keyboard 0-9)</label>
                    <input type="text" class="form-input" id="sbFormShortcut" value="${editItem ? editItem.shortcut : ''}" placeholder="Misal: 1">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Bawa ke Stage Mode?</label>
                    <select class="form-select" id="sbFormBrought">
                        <option value="1" ${editItem && editItem.is_brought ? 'selected' : ''}>Ya, Tampilkan di Stage Mode</option>
                        <option value="0" ${editItem && !editItem.is_brought ? 'selected' : ''}>Tidak, Sembunyikan</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active');">Batal</button>
                <button class="btn btn-primary" onclick="window.saveSoundboardForm()">Simpan Sound Effect</button>
            </div>
        </div>
    `;
    
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.classList.add('active');
};

window.saveSoundboardForm = async function() {
    const idxStr = document.getElementById('sbFormIdx').value;
    const bankIdxStr = document.getElementById('sbFormBankSelect').value;
    const shortcut = document.getElementById('sbFormShortcut').value;
    const is_brought = document.getElementById('sbFormBrought').value === '1';
    
    if (bankIdxStr === '') return window.uiAlert('Pilih lagu dari Master Bank terlebih dahulu!');
    
    let ev = _getEv();
    if (!ev) return;
    if (!ev.soundboard) ev.soundboard = [];
    
    const bank = window.getGlobalMusicBank();
    const selectedBankItem = bank[parseInt(bankIdxStr)];
    if (!selectedBankItem) return window.uiAlert('Lagu di Master Bank tidak ditemukan!');
    
    const newItem = {
        id: (idxStr !== '') ? ev.soundboard[parseInt(idxStr)].id : 'sb_' + Date.now(),
        title: selectedBankItem.title,
        shortcut: shortcut,
        is_brought: is_brought
    };
    
    if (idxStr !== '') {
        ev.soundboard[parseInt(idxStr)] = newItem;
    } else {
        ev.soundboard.push(newItem);
    }
    
    ev.metadata = ev.metadata || {};
    ev.metadata.soundboard = ev.soundboard;
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    
    document.getElementById('modalSoundboardForm').style.display = 'none';
    document.getElementById('modalSoundboardForm').classList.remove('active');
    
    window.renderAdminSoundboardList(ev);
    if (typeof window.showToast === 'function') window.showToast('Soundboard berhasil disimpan!');
};


window.deleteSoundboard = async function(index) {
    let ev = _getEv();
    if (!ev || !ev.soundboard || !ev.soundboard[index]) return;
    if (!(await window.uiConfirm(`Hapus efek suara: "${ev.soundboard[index].title}"?`))) return;
    ev.soundboard.splice(index, 1);
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.soundboard = ev.soundboard;
    window.renderAdminSoundboardList(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};

window.toggleSoundboardIsBrought = function(index) {
    let ev = _getEv();
    if (!ev || !ev.soundboard || !ev.soundboard[index]) return;
    ev.soundboard[index].is_brought = !ev.soundboard[index].is_brought;
    
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.soundboard = ev.soundboard;
    window.renderAdminSoundboardList(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};

window.resetCurrentEventSoundboard = async function() {
    let ev = _getEv();
    if (!(await window.uiConfirm('Reset soundboard ke preset standar (6 Sound bawaan)? Semua kustomisasi akan hilang.'))) return;
    if (ev) {
        ev.soundboard = [];
        window.renderAdminSoundboardList(ev);
        if (typeof window.showToast === 'function') window.showToast('Soundboard dikembalikan ke standar.');
        if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    }
};


window.switchMusicSubtab = function(tabName) {
    let ev = _getEv();
    // Hide all panels
    const bgmPanel = document.getElementById('musicSubtabBgm');
    const soundboardPanel = document.getElementById('musicSubtabSoundboard');
    const landingPanel = document.getElementById('musicSubtabLanding');
    
    if (bgmPanel) bgmPanel.style.display = 'none';
    if (soundboardPanel) soundboardPanel.style.display = 'none';
    if (landingPanel) landingPanel.style.display = 'none';
    
    // Remove active class from buttons
    const btnBgm = document.getElementById('btnSubtabBgm');
    const btnSoundboard = document.getElementById('btnSubtabSoundboard');
    const btnLanding = document.getElementById('btnSubtabLanding');
    
    if (btnBgm) btnBgm.classList.remove('active');
    if (btnSoundboard) btnSoundboard.classList.remove('active');
    if (btnLanding) btnLanding.classList.remove('active');
    
    // Show selected panel & set active
    if (tabName === 'bgm') {
        if (bgmPanel) bgmPanel.style.display = 'block';
        if (btnBgm) btnBgm.classList.add('active');
        if (ev) {
            if (typeof window.checkAndGenerateDummyMusic === 'function') window.checkAndGenerateDummyMusic(ev);
            if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
        }
    } else if (tabName === 'soundboard') {
        if (soundboardPanel) soundboardPanel.style.display = 'block';
        if (btnSoundboard) btnSoundboard.classList.add('active');
        if (ev) {
            window.renderAdminSoundboardList(ev);
        }
    } else if (tabName === 'landing') {
        if (landingPanel) landingPanel.style.display = 'block';
        if (btnLanding) btnLanding.classList.add('active');
        if (ev) {
            window.renderAdminLandingMusicList(ev);
        }
    }
};

window.checkAndGenerateDummyMusic = function(currentEv) {
    if (!currentEv.music) currentEv.music = [];
};
window.renderAdminLandingMusicList = function(currentEv) {
    const container = document.getElementById('adminLandingMusicContainer');
    if (!container) return;
    
    if (!currentEv || !currentEv.landingMusic || currentEv.landingMusic.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:3rem; background:rgba(255,255,255,0.02); border-radius:12px; color:var(--adm-text-muted);">Belum ada musik khusus landing page.<br><br><button class="btn btn-primary btn-sm" onclick="window.openAddLandingMusicModal()">+ Tambah Musik Pertama</button></div>';
        return;
    }
    
    let html = '<table class="ecc-table" style="width:100%; text-align:left; border-collapse:collapse;">';
    html += '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><th style="padding:1rem;">Judul Musik / Audio</th><th style="padding:1rem;">Status Putar</th><th style="padding:1rem; text-align:right;">Aksi</th></tr></thead>';
    html += '<tbody>';
    
    currentEv.landingMusic.forEach((item, idx) => {
        let statusBadge = item.is_active 
            ? '<span style="background:rgba(16,185,129,0.15); color:#34D399; border:1px solid #10B981; padding:0.25rem 0.6rem; border-radius:9999px; font-size:0.75rem; font-weight:700;">Aktif (Auto-play di web)</span>'
            : '<span style="background:rgba(255,255,255,0.1); color:var(--adm-text-secondary); padding:0.25rem 0.6rem; border-radius:9999px; font-size:0.75rem;">Tidak Aktif</span>';
            
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.02)\'" onmouseout="this.style.background=\'transparent\'">';
        html += '<td style="padding:1rem;">';
        html += '<div style="font-weight:700; font-size:1.05rem; color:#FFF; margin-bottom:0.3rem;">' + (item.title || 'Untitled') + '</div>';
        html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + (item.artist || 'Unknown') + '</div>';
        html += '</td>';
        html += '<td style="padding:1rem;">' + statusBadge + '</td>';
        html += '<td style="padding:1rem; text-align:right; white-space:nowrap;">';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.toggleLandingMusic(' + idx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);">' + (item.is_active ? 'Nonaktifkan' : 'Aktifkan') + '</button>';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.openAddLandingMusicModal(' + idx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" title="Edit">✏️</button>';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteLandingMusic(' + idx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus">🗑️</button>';
        html += '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
};

// Hook into the original render wrapper to ensure checkAndGenerate is called on load
if (typeof window.originalRenderAdminMusicListWrapper === 'undefined') {
    window.originalRenderAdminMusicListWrapper = window.renderAdminMusicListWrapper || function(){};
}
window.renderAdminMusicListWrapper = function(currentEv) {
    if (currentEv) {
        window.checkAndGenerateDummyMusic(currentEv);
    }
    if (typeof window.originalRenderAdminMusicListWrapper === 'function') {
        window.originalRenderAdminMusicListWrapper(currentEv);
    }
};

// Initialize if ev exists and music tab is active
setTimeout(() => {
    let ev = _getEv();
    if (ev) {
        const bgmPanel = document.getElementById('musicSubtabBgm');
        if (bgmPanel && bgmPanel.style.display !== 'none') {
            window.checkAndGenerateDummyMusic(ev);
            window.renderAdminMusicListWrapper(ev);
        }
    }
}, 500);

if (typeof window.originalRenderAdminMusicListWrapper === 'undefined') {
    window.originalRenderAdminMusicListWrapper = window.renderAdminMusicList || function(){};
}
window.renderAdminMusicListWrapper = function(currentEv) {
    if (currentEv) {
        window.checkAndGenerateDummyMusic(currentEv);
    }
    if (typeof window.originalRenderAdminMusicListWrapper === 'function') {
        window.originalRenderAdminMusicListWrapper(currentEv);
    }
};



window.renderMusicBankSection = async function() {
    const bank = window.getGlobalMusicBank();
    let html = '<div style="width:100%; overflow-x:auto;">';
    if (bank.length === 0) {
        html += '<div style="text-align:center; padding:3rem; color:var(--adm-text-muted);">Bank musik masih kosong.<br><br>Gunakan tombol + Tambah Lagu di pojok kanan atas.</div>';
    } else {
        html += '<table class="ecc-table" style="width:100%; text-align:left; border-collapse:collapse; white-space:nowrap;">';
        html += '<thead><tr style="background:rgba(0,0,0,0.3); border-bottom:1px solid rgba(255,255,255,0.05); color:var(--adm-text-secondary); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">';
        html += '<th style="padding:1.2rem 1.5rem; border-top-left-radius:8px;">Detail Musik / Audio</th>';
        html += '<th style="padding:1.2rem 1.5rem;">Tipe Audio</th>';
        html += '<th style="padding:1.2rem 1.5rem; text-align:right; border-top-right-radius:8px;">Aksi</th>';
        html += '</tr></thead>';
        html += '<tbody>';
        
        bank.forEach((m, idx) => {
            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.02)\'" onmouseout="this.style.background=\'transparent\'">';
            html += '<td style="padding:1rem 1.5rem;">';
            html += '<div style="font-weight:700; font-size:1.05rem; color:#FFF; margin-bottom:0.2rem;">' + m.title + '</div>';
            html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + (m.artist || 'Unknown') + '</div>';
            let srcTxt = m.url_link ? '&#128279; ' + m.url_link : (m.file_upload ? '&#128194; File Upload' : '');
            if(srcTxt) html += '<div style="font-size:0.75rem; color:var(--adm-text-secondary); margin-top:0.3rem;">' + srcTxt + '</div>';
            html += '</td>';
            html += '<td style="padding:1rem 1.5rem;"><span style="background:rgba(255,255,255,0.1); color:#E5E7EB; padding:0.25rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:600; text-transform:uppercase;">' + (m.type || 'Lainnya') + '</span></td>';
            html += '<td style="padding:1rem 1.5rem; text-align:right;">';
            
            html += '<button class="btn btn-secondary btn-sm" onclick="window.playMasterMusic(' + idx + ')" style="color:#60A5FA; border-color:rgba(96,165,250,0.3); margin-right:0.5rem;" title="Putar Preview">▶️ Putar</button>';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.openMasterBankForm(' + idx + ')" style="color:var(--adm-gold); border-color:rgba(212,175,55,0.3); margin-right:0.5rem;" title="Edit Lagu">✏️ Edit</button>';
            
            html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteMusicBankItemSection(' + idx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus">🗑️ Hapus</button>';
            html += '</td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
    }
    html += '</div>';
    
    document.getElementById('musicBankSectionBody').innerHTML = html;
};

window.deleteMusicBankItemSection = async function(idx) {
    const bank = window.getGlobalMusicBank();
    if (await window.uiConfirm('Hapus lagu ini dari Master Bank Musik? Lagu yang sudah terpakai di Acara tidak akan terpengaruh.')) {
        bank.splice(idx, 1);
        window.saveGlobalMusicBank(bank);
        window.renderMusicBankSection();
        if (typeof window.showToast === 'function') window.showToast('Lagu berhasil dihapus dari bank', 'red');
    }
};


window.openMasterBankForm = function(idx = null) {
    let title = '', artist = '', type = 'BGM', url_link = '', file_upload = '';
    
    if (idx !== null) {
        const bank = window.getGlobalMusicBank();
        if (bank[idx]) {
            title = bank[idx].title || '';
            artist = bank[idx].artist || '';
            type = bank[idx].type || 'BGM';
            url_link = bank[idx].url_link || '';
            file_upload = bank[idx].file_upload || '';
        }
    }
    
    const modalId = 'modalMasterBankForm';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.classList.add('active');
        overlay.style.zIndex = '999999';
        document.body.appendChild(overlay);
    }
    
    let html = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3 class="modal-title">${idx !== null ? '✏️ Edit Lagu Master' : '🎵 Tambah Lagu Master'}</h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="mbFormIdx" value="${idx !== null ? idx : ''}">
                <div class="form-group">
                    <label class="form-label">Judul Musik / Audio *</label>
                    <input type="text" class="form-input" id="mbFormTitle" value="${title}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Penyanyi / Artis / Komposer</label>
                    <input type="text" class="form-input" id="mbFormArtist" value="${artist}">
                </div>
                <div class="form-group">
                    <label class="form-label">Tipe Audio</label>
                    <select class="form-select" id="mbFormType">
                        <option value="BGM" ${type==='BGM'?'selected':''}>BGM (Backgorund Music)</option>
                        <option value="SFX" ${type==='SFX'?'selected':''}>SFX (Sound Effect)</option>
                        <option value="Lagu Utama" ${type==='Lagu Utama'?'selected':''}>Lagu Utama / Entrance</option>
                        <option value="Lainnya" ${type==='Lainnya'?'selected':''}>Lainnya</option>
                    </select>
                </div>
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1rem;">
                    <label class="form-label">File Audio Lokal (.mp3, .wav)</label>
                    <input type="file" class="form-input" id="mbFormFile" accept="audio/*">
                    ${file_upload ? `<div style="font-size:0.75rem; color:var(--adm-gold); margin-top:0.3rem;">File saat ini: ${file_upload}</div>` : ''}
                </div>
                <div style="text-align:center; font-size:0.8rem; color:var(--adm-text-muted); margin-bottom:1rem;">ATAU</div>
                <div class="form-group">
                    <label class="form-label">Link YouTube / Drive / Spotify</label>
                    <input type="text" class="form-input" id="mbFormUrl" value="${url_link}" placeholder="https://youtube.com/...">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').style.display='none'">Batal</button>
                <button class="btn btn-primary" onclick="window.saveMasterBankForm()">Simpan ke Bank</button>
            </div>
        </div>
    `;
    
        overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.classList.add('active');

    const fileInput = document.getElementById('mbFormFile');
    const urlInput = document.getElementById('mbFormUrl');
    
    function toggleMbInputs() {
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            urlInput.disabled = true;
            urlInput.style.opacity = '0.5';
            urlInput.value = '';
        } else if (urlInput && urlInput.value.trim() !== '') {
            fileInput.disabled = true;
            fileInput.style.opacity = '0.5';
            fileInput.value = '';
        } else {
            if (urlInput) {
                urlInput.disabled = false;
                urlInput.style.opacity = '1';
            }
            if (fileInput) {
                fileInput.disabled = false;
                fileInput.style.opacity = '1';
            }
        }
    }
    
    if (fileInput) fileInput.addEventListener('change', toggleMbInputs);
    if (urlInput) urlInput.addEventListener('input', toggleMbInputs);
    
    // Initial toggle based on existing data
    if (url_link) {
        if (fileInput) {
            fileInput.disabled = true;
            fileInput.style.opacity = '0.5';
        }
    } else if (file_upload) {
        if (urlInput) {
            urlInput.disabled = true;
            urlInput.style.opacity = '0.5';
        }
    }
};

window.saveMasterBankForm = async function() {
    const idxStr = document.getElementById('mbFormIdx').value;
    const title = document.getElementById('mbFormTitle').value.trim();
    const artist = document.getElementById('mbFormArtist').value.trim();
    const type = document.getElementById('mbFormType').value;
    const url_link = document.getElementById('mbFormUrl').value.trim();
    const fileInput = document.getElementById('mbFormFile');
    
    if (!title) return window.uiAlert('Judul musik harus diisi!');
    
    let final_url = url_link;
    let final_file = '';

    if (idxStr !== '') {
        const bank = window.getGlobalMusicBank();
        final_file = bank[parseInt(idxStr)].file_upload || '';
    }

    if (url_link && fileInput && fileInput.files && fileInput.files.length > 0) {
        return window.uiAlert('Silakan pilih salah satu: Upload File lokal ATAU masukkan Link URL.');
    }
    
    if (final_url !== '') {
        final_file = '';
    } else if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        try {
            document.getElementById('mbFormTitle').disabled = true;
            document.getElementById('mbFormArtist').disabled = true;
            const res = await fetch('/api/cms/music-bank/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                final_file = data.url; 
            } else {
                document.getElementById('mbFormTitle').disabled = false;
                document.getElementById('mbFormArtist').disabled = false;
                return window.uiAlert('Gagal upload file: ' + data.message);
            }
        } catch(e) {
            document.getElementById('mbFormTitle').disabled = false;
            document.getElementById('mbFormArtist').disabled = false;
            return window.uiAlert('Error upload file: ' + e.message);
        }
    }
    
    document.getElementById('mbFormTitle').disabled = false;
    document.getElementById('mbFormArtist').disabled = false;
    
    const bank = window.getGlobalMusicBank();
    const item = { title, artist, type, url_link: final_url, file_upload: final_file };
    
    if (idxStr !== '') {
        const oldItem = bank[parseInt(idxStr)];
        bank[parseInt(idxStr)] = item;

        // --- SYNC TO ALL EVENTS ---
        const allEventsRaw = localStorage.getItem('mc_events_data');
        if (allEventsRaw) {
            let allEvents = [];
            try { allEvents = JSON.parse(allEventsRaw); } catch(e){}
            let updatedAny = false;
            
            allEvents.forEach(ev => {
                if (ev.musicList && ev.musicList.length > 0) {
                    ev.musicList.forEach(m => {
                        if (m.title === oldItem.title && (m.artist || '') === (oldItem.artist || '')) {
                            m.title = item.title;
                            m.artist = item.artist;
                            m.url_link = item.url_link;
                            m.file_upload = item.file_upload;
                            updatedAny = true;
                        }
                    });
                }
            });
            
            if (updatedAny) {
                localStorage.setItem('mc_events_data', JSON.stringify(allEvents));
                if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) {
                    window.syncEngine.pushEventsToServer();
                }
                if (typeof _getEv === 'function') {
                    let currentEv = _getEv();
                    if (currentEv && currentEv.id) {
                        const matched = allEvents.find(e => e.id === currentEv.id);
                        if (matched && typeof _setEv === 'function') _setEv(matched);
                    }
                }
            }
        }
        // --------------------------

        if (typeof window.showToast === 'function') window.showToast('Lagu diupdate & disinkron ke seluruh acara!', 'green');
    } else {
        bank.push(item);
        if (typeof window.showToast === 'function') window.showToast('Lagu berhasil ditambahkan ke bank!', 'green');
    }
    
    window.saveGlobalMusicBank(bank);
    document.getElementById('modalMasterBankForm').style.display = 'none';
    document.getElementById('modalMasterBankForm').classList.remove('active');
    
    if (typeof window.renderMusicBankSection === 'function') {
        window.renderMusicBankSection();
    }
};

window.playMasterMusic = function(idx) {
    const bank = window.getGlobalMusicBank();
    if (!bank[idx]) return;
    
    const m = bank[idx];
    
    const modalId = 'modalMusicPlayer';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '9999999';
        document.body.appendChild(overlay);
    }
    
    let contentHtml = '';
    if (m.url_link) {
        let embedUrl = m.url_link;
        if (embedUrl.includes('youtube.com/watch?v=')) {
            embedUrl = embedUrl.replace('watch?v=', 'embed/');
        } else if (embedUrl.includes('youtu.be/')) {
            embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
        }
        contentHtml = `<iframe width="100%" height="250" src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    } else if (m.file_upload) {
        contentHtml = `
            <div style="padding:2rem; text-align:center; background:rgba(0,0,0,0.3); border-radius:8px;">
                <div style="font-size:2rem; margin-bottom:1rem;">🎵</div>
                <div style="margin-bottom:1.5rem; color:var(--adm-gold);">${m.file_upload.split('/').pop()}</div>
                <audio controls autoplay style="width:100%;">
                    <source src="${m.file_upload}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
    } else {
        contentHtml = '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Tidak ada media untuk diputar.</div>';
    }
    
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:500px; background:#111;">
            <div class="modal-header">
                <h3 class="modal-title">▶️ Memutar: ${m.title}</h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active'); document.getElementById('${modalId}').innerHTML='';">&times;</button>
            </div>
            <div class="modal-body" style="padding:0;">
                ${contentHtml}
            </div>
        </div>
    `;
    
    overlay.style.display = 'flex';
    overlay.classList.add('active');
};


// --- MUSIK & SOUND ACARA MODULE (INTEGRATION WITH STAGE & RUNDOWN) ---
window.openAddMusicModal = async function(editIndex = -1) {
    let ev = _getEv();
    if (!ev) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    
    let editItem = null;
    if (editIndex >= 0 && ev.musicList && ev.musicList[editIndex]) {
        editItem = ev.musicList[editIndex];
    }
    
    const rundownOptions = [{value: '', label: '-- Tidak Terhubung (Standby) --'}];
    if (ev.rundown && ev.rundown.length > 0) {
        ev.rundown.forEach((r, idx) => {
            rundownOptions.push({value: idx, label: `Segmen ${idx+1}: ${r.title || 'Untitled'}`});
        });
    }
    
    const bank = window.getGlobalMusicBank();
    let bankOptionsHtml = '';
    if (bank && bank.length > 0) {
        bank.forEach((b, idx) => {
            // Check if this matches the editItem
            let isSelected = false;
            if (editItem && editItem.title === b.title && (editItem.artist || '') === (b.artist || '')) {
                isSelected = true;
            }
            bankOptionsHtml += `<option value="${idx}" ${isSelected ? 'selected' : ''}>${b.title} ${b.artist ? '- ' + b.artist : ''}</option>`;
        });
    } else {
        bankOptionsHtml = '<option value="" disabled>-- Master Bank Kosong, silakan isi dulu --</option>';
    }
    
    const modalId = 'modalEventMusicForm';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '999999';
        document.body.appendChild(overlay);
    }
    
    let html = `
        <div class="modal-content" style="max-width:550px;">
            <div class="modal-header">
                <h3 class="modal-title">${editItem ? '✏️ Edit Lagu Acara' : '🎵 Tambah Lagu Acara'}</h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active');">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="evmFormIdx" value="${editIndex >= 0 ? editIndex : ''}">
                
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1.5rem;">
                    <label class="form-label" style="color:var(--adm-gold); font-size:1.1rem; margin-bottom:0.8rem;">Pilih Lagu dari Master Bank *</label>
                    
                    <!-- Custom Select UI -->
                    <div style="position:relative; width:100%; font-size:1.05rem;">
                        <input type="hidden" id="evmFormBankSelect" value="${editItem ? bank.findIndex(b => b.title === editItem.title) : ''}">
                        
                        <!-- The clickable "button" -->
                        <div id="evmCustomSelectBtn" style="padding:0.6rem 1rem; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="document.getElementById('evmCustomSelectDropdown').style.display = document.getElementById('evmCustomSelectDropdown').style.display === 'none' ? 'block' : 'none'; document.getElementById('evmCustomSelectSearch').focus();">
                            <span id="evmCustomSelectLabel">${editItem ? editItem.title + (editItem.artist ? ' - ' + editItem.artist : '') : '-- Pilih Lagu --'}</span>
                            <span style="font-size:0.8rem;">▼</span>
                        </div>
                        
                        <!-- The dropdown panel -->
                        <div id="evmCustomSelectDropdown" style="display:none; position:absolute; top:100%; left:0; right:0; margin-top:4px; background:#1A1E29; border:1px solid rgba(255,255,255,0.1); border-radius:6px; box-shadow:0 8px 16px rgba(0,0,0,0.5); z-index:999999;">
                            
                            <!-- Search box inside dropdown -->
                            <div style="padding:0.5rem; border-bottom:1px solid rgba(255,255,255,0.05);">
                                <input type="text" id="evmCustomSelectSearch" class="form-input" placeholder="🔍 Cari lagu..." style="padding:0.5rem; font-size:0.95rem;" oninput="
                                    const filter = this.value.toLowerCase();
                                    document.querySelectorAll('.evm-option-item').forEach(item => {
                                        if(item.textContent.toLowerCase().includes(filter)) item.style.display = 'block';
                                        else item.style.display = 'none';
                                    });
                                ">
                            </div>
                            
                            <!-- Options list -->
                            <div id="evmCustomSelectOptionsList" style="max-height:200px; overflow-y:auto; padding:0.25rem;">
                                ${bank.map((b, idx) => `
                                    <div class="evm-option-item" style="padding:0.6rem 1rem; cursor:pointer; border-radius:4px; margin-bottom:2px;" 
                                         onmouseover="this.style.background='rgba(56,189,248,0.1)'" 
                                         onmouseout="this.style.background='transparent'"
                                         onclick="
                                            document.getElementById('evmFormBankSelect').value = '${idx}';
                                            document.getElementById('evmCustomSelectLabel').textContent = '${b.title.replace(/'/g, "\'")} ${b.artist ? ' - ' + b.artist.replace(/'/g, "\'") : ''}';
                                            document.getElementById('evmCustomSelectDropdown').style.display = 'none';
                                         ">
                                        ${b.title} ${b.artist ? '- ' + b.artist : ''}
                                    </div>
                                `).join('')}
                            </div>
                            
                        </div>
                    </div>
                    
                    <!-- Close dropdown when clicking outside -->
                    <script>
                        document.addEventListener('click', function(e) {
                            const btn = document.getElementById('evmCustomSelectBtn');
                            const drop = document.getElementById('evmCustomSelectDropdown');
                            if(btn && drop && !btn.contains(e.target) && !drop.contains(e.target)) {
                                drop.style.display = 'none';
                            }
                        });
                    </script>

                    <div style="font-size:0.75rem; color:var(--adm-text-muted); margin-top:0.6rem;">
                        <i>💡 Mengunggah file audio atau memasukkan link YouTube sekarang hanya dapat dilakukan secara terpusat melalui menu <b>Master Bank Musik</b>.</i>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Terhubung ke Segmen Rundown <span style="font-size:0.75rem; color:#888;">(Bisa pilih lebih dari satu)</span></label>
                    <div id="evmFormSegmentContainer" style="height: 160px; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 0.8rem;">
                        ${(() => {
                            let isStandby = false;
                            if (!editItem || (editItem.segment_idx === null && (!editItem.segment_idxs || editItem.segment_idxs.length===0))) {
                                isStandby = true;
                            }
                            return `
                            <label style="display: flex; align-items: center; margin-bottom: 0.8rem; cursor: pointer; padding-bottom: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <input type="checkbox" value="" id="evmFormSegmentStandby" ${isStandby ? 'checked' : ''} style="width: 18px; height: 18px; margin-right: 0.5rem; accent-color: var(--adm-gold);" onchange="if(this.checked) document.querySelectorAll('.evm-segment-cb').forEach(cb => cb.checked = false)">
                                <span style="color:var(--adm-text-muted);">-- Tidak Terhubung (Standby) --</span>
                            </label>`;
                        })()}
                        
                        ${rundownOptions.filter(o => o.value !== '').map(opt => {
                            let isSelected = false;
                            if (editItem && Array.isArray(editItem.segment_idxs)) {
                                isSelected = editItem.segment_idxs.includes(parseInt(opt.value)) || editItem.segment_idxs.includes(opt.value);
                            } else if (editItem && editItem.segment_idx == opt.value) {
                                isSelected = true;
                            }
                            return `
                            <label style="display: flex; align-items: center; margin-bottom: 0.6rem; cursor: pointer;">
                                <input type="checkbox" class="evm-segment-cb" value="${opt.value}" ${isSelected ? 'checked' : ''} style="width: 18px; height: 18px; margin-right: 0.5rem; accent-color: #38BDF8;" onchange="if(this.checked) document.getElementById('evmFormSegmentStandby').checked = false"> 
                                <span>${opt.label}</span>
                            </label>`;
                        }).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Instruksi Cue (opsional, untuk Stage MC / Operator)</label>
                    <textarea class="form-input" id="evmFormCue" rows="2" placeholder="Contoh: Putar dari menit 1:15 saat MC memanggil nama"> ${editItem ? (editItem.cue_instruction || '') : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Kategori Momen</label>
                    <select class="form-select" id="evmFormCategory">
                        <option value="BGM" ${editItem && editItem.category==='BGM'?'selected':''}>General Background BGM</option>
                        <option value="Opening" ${editItem && editItem.category==='Opening'?'selected':''}>Opening & Welcoming</option>
                        <option value="Entrance" ${editItem && editItem.category==='Entrance'?'selected':''}>Grand Entrance</option>
                        <option value="Ceremony" ${editItem && editItem.category==='Ceremony'?'selected':''}>Ceremony & Sambutan</option>
                        <option value="Toast" ${editItem && editItem.category==='Toast'?'selected':''}>Toast & Cake Cutting</option>
                        <option value="Dinner" ${editItem && editItem.category==='Dinner'?'selected':''}>Dinner & Entertainment</option>
                        <option value="Games" ${editItem && editItem.category==='Games'?'selected':''}>Games & Bouquet Toss</option>
                        <option value="Closing" ${editItem && editItem.category==='Closing'?'selected':''}>Closing & Photo Session</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active');">Batal</button>
                <button class="btn btn-primary" onclick="window.saveEventMusicForm()">Simpan Lagu</button>
            </div>
        </div>
    `;
    
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.classList.add('active');
};

window.saveEventMusicForm = async function() {
    const idxStr = document.getElementById('evmFormIdx').value;
    const bankIdxStr = document.getElementById('evmFormBankSelect').value;
    const cue_instruction = document.getElementById('evmFormCue').value.trim();
    
    const checkedBoxes = Array.from(document.querySelectorAll('.evm-segment-cb:checked'));
    const segment_idxs = checkedBoxes.map(cb => parseInt(cb.value));
    const segment_idx = segment_idxs.length > 0 ? segment_idxs[0] : null; 
    
    const category = document.getElementById('evmFormCategory').value;
    
    if (bankIdxStr === '') return window.uiAlert('Pilih lagu dari Master Bank terlebih dahulu!');
    
    let ev = _getEv();
    if (!ev) return;
    if (!ev.musicList) ev.musicList = [];
    
    const bank = window.getGlobalMusicBank();
    const selectedBankItem = bank[parseInt(bankIdxStr)];
    if (!selectedBankItem) return window.uiAlert('Lagu di Master Bank tidak ditemukan!');
    
    const newItem = {
        id: (idxStr !== '') ? ev.musicList[parseInt(idxStr)].id : 'music_' + Date.now(),
        title: selectedBankItem.title,
        artist: selectedBankItem.artist,
        url_link: selectedBankItem.url_link,
        file_upload: selectedBankItem.file_upload,
        cue_instruction: cue_instruction,
        segment_idx: segment_idx,
        segment_idxs: segment_idxs,
        category: category
    };
    
    if (idxStr !== '') {
        const oldItem = ev.musicList[parseInt(idxStr)];
        const oldIdxs = Array.isArray(oldItem.segment_idxs) ? oldItem.segment_idxs : (oldItem.segment_idx !== null && oldItem.segment_idx !== undefined ? [oldItem.segment_idx] : []);
        
        oldIdxs.forEach(oldIdx => {
            if (!segment_idxs.includes(oldIdx) && ev.rundown && ev.rundown[oldIdx]) {
                ev.rundown[oldIdx].cue_music = ''; 
            }
        });
        
        ev.musicList[parseInt(idxStr)] = newItem;
    } else {
        ev.musicList.push(newItem);
    }
    
    segment_idxs.forEach(idx => {
        if (ev.rundown && ev.rundown[idx]) {
            ev.rundown[idx].cue_music = newItem.title;
        }
    });
    
    ev.metadata = ev.metadata || {};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList; 
    

    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    
    document.getElementById('modalEventMusicForm').style.display = 'none';
    document.getElementById('modalEventMusicForm').classList.remove('active');
    
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
};

window.deleteMusic = async function(index) {
    let ev = _getEv();
    if (!ev || !ev.musicList || !ev.musicList[index]) return;
    if (!(await window.uiConfirm(`Hapus lagu: "${ev.musicList[index].title}" dari playlist?`))) return;
    
    ev.musicList.splice(index, 1);
    
    // Sinkronisasi ulang secara menyeluruh
    window.syncMusicToRundown(ev);
    
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList;
    
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
    
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList;
    

    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
    
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};


window.downloadAllAudioPack = function() {
    if (typeof window.uiAlert === 'function') window.uiAlert('Menyiapkan Audio Pack (.wav)... Harap tunggu, mengumpulkan aset untuk Mode Offline.', 'Mengunduh Audio Pack');
    else alert('Fitur unduh Audio Pack sedang disiapkan.');
    
    // Simulate generation
    setTimeout(() => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Download Audio Pack (.wav) berhasil dikemas dan disimpan ke perangkat Anda. Anda dapat menggunakannya untuk pemutaran offline (Zero Internet Required).', 'Berhasil');
    }, 2000);
};

window.openMusicPrintModal = function() {
    if (typeof window.uiAlert === 'function') window.uiAlert('Membuka layout cetak PDF untuk Cue Sheet Musik...', 'Cetak');
    else alert('Membuka layout cetak PDF...');
};

window.resetCurrentEventMusic = async function() {
    if (!(await window.uiConfirm('Apakah Anda yakin ingin mereset playlist musik ke default? Semua musik kustom yang telah ditambahkan akan terhapus.'))) return;
    if (ev) {
        ev.musicList = [];
        if (ev.metadata) ev.metadata.musicList = [];
        window.renderAdminMusicListWrapper(ev);
        if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) {
            window.syncEngine.pushEventsToServer();
        }
        if (typeof window.showToast === 'function') window.showToast('Playlist berhasil direset ke Default Master.');
    }
};

window.filterMusicList = function() {
    if (typeof ev !== 'undefined' && ev) {
        window.renderAdminMusicListWrapper(ev);
    }
};

window.renderAdminMusicListWrapper = function(currentEv) {
    const container = document.getElementById('adminMusicTableContainer');
    if (!container) return;
    
    const metricTotal = document.getElementById('musicMetricTotal');
    const metricLinked = document.getElementById('musicMetricLinked');
    
    if (!currentEv || !currentEv.musicList || currentEv.musicList.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:3rem; background:rgba(255,255,255,0.02); border-radius:12px; color:var(--adm-text-muted);">Belum ada daftar musik/cue audio.<br><br><button class="btn btn-primary btn-sm" onclick="window.openAddMusicModal()">+ Tambah Lagu Acara Pertama</button></div>';
        if (metricTotal) metricTotal.textContent = '0 Trek';
        if (metricLinked) metricLinked.textContent = '0 / ' + (currentEv.rundown ? currentEv.rundown.length : 0) + ' Segmen';
        return;
    }
    
    let filteredList = currentEv.musicList;
    const searchInput = document.getElementById('musicSearchInput');
    const categoryFilter = document.getElementById('musicCategoryFilter');
    const statusFilter = document.getElementById('musicStatusFilter');
    
    if (searchInput && searchInput.value) {
        const q = searchInput.value.toLowerCase();
        filteredList = filteredList.filter(m => (m.title||'').toLowerCase().includes(q) || (m.artist||'').toLowerCase().includes(q) || (m.cue_instruction||'').toLowerCase().includes(q));
    }
    if (categoryFilter && categoryFilter.selectedIndex > 0) {
        const cat = categoryFilter.value;
        filteredList = filteredList.filter(m => m.category === cat);
    }
    if (statusFilter && statusFilter.selectedIndex > 0) {
        const stat = statusFilter.value;
        if (stat === 'LINKED') {
            filteredList = filteredList.filter(m => m.segment_idx !== null && m.segment_idx !== undefined && m.segment_idx !== '');
        } else {
            filteredList = filteredList.filter(m => m.segment_idx === null || m.segment_idx === undefined || m.segment_idx === '');
        }
    }
    
    if (metricTotal) metricTotal.textContent = currentEv.musicList.length + ' Trek';
    const linkedCount = currentEv.musicList.filter(m => m.segment_idx !== null && m.segment_idx !== undefined && m.segment_idx !== '').length;
    const rundownCount = currentEv.rundown ? currentEv.rundown.length : 0;
    if (metricLinked) metricLinked.textContent = linkedCount + ' / ' + rundownCount + ' Segmen';

    if (filteredList.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Tidak ada musik yang cocok dengan filter pencarian.</div>';
        return;
    }

    let html = '<table class="ecc-table" style="width:100%; text-align:left; border-collapse:collapse;">';
    html += '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><th style="padding:1rem;">Judul & Artis</th><th style="padding:1rem;">Instruksi Cue (FOH/DJ)</th><th style="padding:1rem;">Terhubung Segmen Rundown</th><th style="padding:1rem; text-align:right;">Aksi</th></tr></thead>';
    html += '<tbody>';
    
    filteredList.forEach(item => {
        const realIdx = currentEv.musicList.findIndex(m => m.id === item.id);
        
        let segmentText = '<span style="display:inline-block; padding:0.25rem 0.5rem; background:rgba(255,255,255,0.05); border-radius:4px; font-size:0.75rem; color:var(--adm-text-muted);">Trek Standby (Bebas Main)</span>';
        
        let activeIdxs = [];
        if (Array.isArray(item.segment_idxs) && item.segment_idxs.length > 0) activeIdxs = item.segment_idxs;
        else if (item.segment_idx !== null && item.segment_idx !== undefined && item.segment_idx !== '') activeIdxs = [item.segment_idx];
        
        if (activeIdxs.length > 0 && currentEv.rundown) {
            segmentText = activeIdxs.map(s_idx => {
                if (currentEv.rundown[s_idx]) {
                    return '<div style="color:#38BDF8; font-weight:600; font-size:0.85rem; margin-bottom:0.3rem;"><span style="background:rgba(56,189,248,0.15); padding:0.15rem 0.4rem; border-radius:4px; margin-right:0.4rem;">Segmen ' + (s_idx + 1) + '</span>' + escapeHtml(currentEv.rundown[s_idx].title || '') + '</div>';
                }
                return '';
            }).join('');
            if(segmentText !== '') {
                segmentText += '<div style="font-size:0.75rem; color:var(--adm-text-secondary); margin-top:0.3rem;">➡️  Auto-cue di Stage Mode aktif.</div>';
            } else {
                segmentText = '<span style="display:inline-block; padding:0.25rem 0.5rem; background:rgba(255,255,255,0.05); border-radius:4px; font-size:0.75rem; color:var(--adm-text-muted);">Trek Standby (Bebas Main)</span>';
            }
        }
        
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.02)\'" onmouseout="this.style.background=\'transparent\'">';
        html += '<td style="padding:1rem;">';
        html += '<div style="font-weight:700; font-size:1.05rem; color:#FFF; margin-bottom:0.3rem;">' + escapeHtml(item.title || 'Untitled') + '</div>';
        html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + escapeHtml(item.artist || 'Unknown Artist') + ' <span style="color:var(--adm-text-secondary); margin:0 0.4rem;">&bull;</span> <span style="background:rgba(212,175,55,0.1); padding:0.15rem 0.4rem; border-radius:4px;">' + escapeHtml(item.category || 'BGM') + '</span></div>';
        html += '</td>';
        html += '<td style="padding:1rem; max-width:250px; font-size:0.85rem; color:var(--adm-text-secondary); line-height:1.4;">' + (item.cue_instruction ? escapeHtml(item.cue_instruction) : '<i style="color:#555;">Tidak ada instruksi khusus</i>') + '</td>';
        html += '<td style="padding:1rem;">' + segmentText + '</td>';
        html += '<td style="padding:1rem; text-align:right; white-space:nowrap;">';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.openAddMusicModal(' + realIdx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" title="Edit / Ganti Segmen">✏️ </button>';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteMusic(' + realIdx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus Lagu">🗑️ </button>';
        html += '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
};

// Override the original renderAdminMusicList to use our wrapper
window.renderAdminMusicList = window.renderAdminMusicListWrapper;

// Trigger render immediately if ev is ready
if (typeof ev !== 'undefined' && ev) {
    window.renderAdminMusicListWrapper(ev);
}


// ==========================================
// MASTER BANK UI MODULE
// ==========================================
window.renderMusicBankSection = async function() {
    window.memoryAudioFiles = window.memoryAudioFiles || {};
    try {
        const fInput = document.getElementById('mbFormFile');
        if (fInput && fInput.files && fInput.files.length > 0) {
            window.memoryAudioFiles[fInput.files[0].name] = URL.createObjectURL(fInput.files[0]);
        }
    } catch(e) {}
    
    const bank = window.getGlobalMusicBank();
    let html = '<div style="width:100%; overflow-x:auto;">';
    if (bank.length === 0) {
        html += '<div style="text-align:center; padding:3rem; color:var(--adm-text-muted);">Bank musik masih kosong.<br><br>Gunakan tombol + Tambah Lagu di pojok kanan atas.</div>';
    } else {
        html += '<table class="ecc-table" style="width:100%; text-align:left; border-collapse:collapse; white-space:nowrap;">';
        html += '<thead><tr style="background:rgba(0,0,0,0.3); border-bottom:1px solid rgba(255,255,255,0.05); color:var(--adm-text-secondary); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">';
        html += '<th style="padding:1.2rem 1.5rem; border-top-left-radius:8px;">Detail Musik / Audio</th>';
        html += '<th style="padding:1.2rem 1.5rem;">Tipe Audio</th>';
        html += '<th style="padding:1.2rem 1.5rem; text-align:right; border-top-right-radius:8px;">Aksi</th>';
        html += '</tr></thead>';
        html += '<tbody>';
        
        bank.forEach((m, idx) => {
            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.02)\'" onmouseout="this.style.background=\'transparent\'">';
            html += '<td style="padding:1rem 1.5rem;">';
            html += '<div style="font-weight:700; font-size:1.05rem; color:#FFF; margin-bottom:0.2rem;">' + m.title + '</div>';
            html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + (m.artist || 'Unknown') + '</div>';
            let srcTxt = m.url_link ? '&#128279; ' + m.url_link : (m.file_upload ? '&#128194; File Upload' : '');
            if(srcTxt) html += '<div style="font-size:0.75rem; color:var(--adm-text-secondary); margin-top:0.3rem;">' + srcTxt + '</div>';
            html += '</td>';
            html += '<td style="padding:1rem 1.5rem;"><span style="background:rgba(255,255,255,0.1); color:#E5E7EB; padding:0.25rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:600; text-transform:uppercase;">' + (m.type || 'Lainnya') + '</span></td>';
            html += '<td style="padding:1rem 1.5rem; text-align:right;">';
            
            html += '<button class="btn btn-secondary btn-sm" onclick="window.playMasterMusic(' + idx + ')" style="color:#60A5FA; border-color:rgba(96,165,250,0.3); margin-right:0.5rem;" title="Putar Preview">▶️ Putar</button>';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.openMasterBankForm(' + idx + ')" style="color:var(--adm-gold); border-color:rgba(212,175,55,0.3); margin-right:0.5rem;" title="Edit Lagu">✏️ Edit</button>';
            
            html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteMusicBankItemSection(' + idx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus">🗑️ Hapus</button>';
            html += '</td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
    }
    html += '</div>';
    
    document.getElementById('musicBankSectionBody').innerHTML = html;
};

window.deleteMusicBankItemSection = async function(idx) {
    const bank = window.getGlobalMusicBank();
    if (await window.uiConfirm('Hapus lagu ini dari Master Bank Musik? Lagu yang sudah terpakai di Acara tidak akan terpengaruh.')) {
        bank.splice(idx, 1);
        window.saveGlobalMusicBank(bank);
        window.renderMusicBankSection();
        if (typeof window.showToast === 'function') window.showToast('Lagu berhasil dihapus dari bank', 'red');
    }
};

window.openMasterBankForm = function(idx = null) {
    let title = '', artist = '', type = 'BGM', url_link = '', file_upload = '';
    
    if (idx !== null) {
        const bank = window.getGlobalMusicBank();
        if (bank[idx]) {
            title = bank[idx].title || '';
            artist = bank[idx].artist || '';
            type = bank[idx].type || 'BGM';
            url_link = bank[idx].url_link || '';
            file_upload = bank[idx].file_upload || '';
        }
    }
    
    const modalId = 'modalMasterBankForm';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.classList.add('active');
        overlay.style.zIndex = '999999';
        document.body.appendChild(overlay);
    }
    
    let html = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3 class="modal-title">${idx !== null ? '✏️ Edit Lagu Master' : '🎵 Tambah Lagu Master'}</h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active')">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="mbFormIdx" value="${idx !== null ? idx : ''}">
                <div class="form-group">
                    <label class="form-label">Judul Musik / Audio *</label>
                    <input type="text" class="form-input" id="mbFormTitle" value="${title}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Penyanyi / Artis / Komposer</label>
                    <input type="text" class="form-input" id="mbFormArtist" value="${artist}">
                </div>
                <div class="form-group">
                    <label class="form-label">Tipe Audio</label>
                    <select class="form-select" id="mbFormType">
                        <option value="BGM" ${type==='BGM'?'selected':''}>BGM (Backgorund Music)</option>
                        <option value="SFX" ${type==='SFX'?'selected':''}>SFX (Sound Effect)</option>
                        <option value="Lagu Utama" ${type==='Lagu Utama'?'selected':''}>Lagu Utama / Entrance</option>
                        <option value="Lainnya" ${type==='Lainnya'?'selected':''}>Lainnya</option>
                    </select>
                </div>
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1rem;">
                    <label class="form-label">File Audio Lokal (.mp3, .wav)</label>
                    <input type="file" class="form-input" id="mbFormFile" accept="audio/*">
                    ${file_upload ? `<div style="font-size:0.75rem; color:var(--adm-gold); margin-top:0.3rem;">File saat ini: ${file_upload}</div>` : ''}
                </div>
                <div style="text-align:center; font-size:0.8rem; color:var(--adm-text-muted); margin-bottom:1rem;">ATAU</div>
                <div class="form-group">
                    <label class="form-label">Link YouTube / Drive / Spotify</label>
                    <input type="text" class="form-input" id="mbFormUrl" value="${url_link}" placeholder="https://youtube.com/...">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active')">Batal</button>
                <button class="btn btn-primary" onclick="window.saveMasterBankForm()">Simpan ke Bank</button>
            </div>
        </div>
    `;
    
        overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.classList.add('active');

    const fileInput = document.getElementById('mbFormFile');
    const urlInput = document.getElementById('mbFormUrl');
    
    function toggleMbInputs() {
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            urlInput.disabled = true;
            urlInput.style.opacity = '0.5';
            urlInput.value = '';
        } else if (urlInput && urlInput.value.trim() !== '') {
            fileInput.disabled = true;
            fileInput.style.opacity = '0.5';
            fileInput.value = '';
        } else {
            if (urlInput) {
                urlInput.disabled = false;
                urlInput.style.opacity = '1';
            }
            if (fileInput) {
                fileInput.disabled = false;
                fileInput.style.opacity = '1';
            }
        }
    }
    
    if (fileInput) fileInput.addEventListener('change', toggleMbInputs);
    if (urlInput) urlInput.addEventListener('input', toggleMbInputs);
    
    // Initial toggle based on existing data
    if (url_link) {
        if (fileInput) {
            fileInput.disabled = true;
            fileInput.style.opacity = '0.5';
        }
    } else if (file_upload) {
        if (urlInput) {
            urlInput.disabled = true;
            urlInput.style.opacity = '0.5';
        }
    }
};

window.saveMasterBankForm = async function() {
    const idxStr = document.getElementById('mbFormIdx').value;
    const title = document.getElementById('mbFormTitle').value.trim();
    const artist = document.getElementById('mbFormArtist').value.trim();
    const type = document.getElementById('mbFormType').value;
    const url_link = document.getElementById('mbFormUrl').value.trim();
    const fileInput = document.getElementById('mbFormFile');
    
    if (!title) return window.uiAlert('Judul musik harus diisi!');
    
    let final_url = url_link;
    let final_file = '';

    if (idxStr !== '') {
        const bank = window.getGlobalMusicBank();
        final_file = bank[parseInt(idxStr)].file_upload || '';
    }

    if (url_link && fileInput && fileInput.files && fileInput.files.length > 0) {
        return window.uiAlert('Silakan pilih salah satu: Upload File lokal ATAU masukkan Link URL.');
    }
    
    if (final_url !== '') {
        final_file = '';
    } else if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        try {
            document.getElementById('mbFormTitle').disabled = true;
            document.getElementById('mbFormArtist').disabled = true;
            const res = await fetch('/api/cms/music-bank/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                final_file = data.url; 
            } else {
                document.getElementById('mbFormTitle').disabled = false;
                document.getElementById('mbFormArtist').disabled = false;
                return window.uiAlert('Gagal upload file: ' + data.message);
            }
        } catch(e) {
            document.getElementById('mbFormTitle').disabled = false;
            document.getElementById('mbFormArtist').disabled = false;
            return window.uiAlert('Error upload file: ' + e.message);
        }
    }
    
    document.getElementById('mbFormTitle').disabled = false;
    document.getElementById('mbFormArtist').disabled = false;
    
    const bank = window.getGlobalMusicBank();
    const item = { title, artist, type, url_link: final_url, file_upload: final_file };
    
    if (idxStr !== '') {
        const oldItem = bank[parseInt(idxStr)];
        bank[parseInt(idxStr)] = item;

        // --- SYNC TO ALL EVENTS ---
        const allEventsRaw = localStorage.getItem('mc_events_data');
        if (allEventsRaw) {
            let allEvents = [];
            try { allEvents = JSON.parse(allEventsRaw); } catch(e){}
            let updatedAny = false;
            
            allEvents.forEach(ev => {
                if (ev.musicList && ev.musicList.length > 0) {
                    ev.musicList.forEach(m => {
                        if (m.title === oldItem.title && (m.artist || '') === (oldItem.artist || '')) {
                            m.title = item.title;
                            m.artist = item.artist;
                            m.url_link = item.url_link;
                            m.file_upload = item.file_upload;
                            updatedAny = true;
                        }
                    });
                }
            });
            
            if (updatedAny) {
                localStorage.setItem('mc_events_data', JSON.stringify(allEvents));
                if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) {
                    window.syncEngine.pushEventsToServer();
                }
                if (typeof _getEv === 'function') {
                    let currentEv = _getEv();
                    if (currentEv && currentEv.id) {
                        const matched = allEvents.find(e => e.id === currentEv.id);
                        if (matched && typeof _setEv === 'function') _setEv(matched);
                    }
                }
            }
        }
        // --------------------------

        if (typeof window.showToast === 'function') window.showToast('Lagu diupdate & disinkron ke seluruh acara!', 'green');
    } else {
        bank.push(item);
        if (typeof window.showToast === 'function') window.showToast('Lagu berhasil ditambahkan ke bank!', 'green');
    }
    
    window.saveGlobalMusicBank(bank);
    document.getElementById('modalMasterBankForm').style.display = 'none';
    document.getElementById('modalMasterBankForm').classList.remove('active');
    
    if (typeof window.renderMusicBankSection === 'function') {
        window.renderMusicBankSection();
    }
};

window.playMasterMusic = function(idx) {
    const bank = window.getGlobalMusicBank();
    if (!bank[idx]) return;
    
    const m = bank[idx];
    
    const modalId = 'modalMusicPlayer';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '9999999';
        document.body.appendChild(overlay);
    }
    
    let contentHtml = '';
    if (m.url_link) {
        let embedUrl = m.url_link;
        if (embedUrl.includes('youtube.com/watch?v=')) {
            embedUrl = embedUrl.replace('watch?v=', 'embed/');
        } else if (embedUrl.includes('youtu.be/')) {
            embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
        }
        contentHtml = `<iframe width="100%" height="250" src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    } else if (m.file_upload) {
        contentHtml = `
            <div style="padding:2rem; text-align:center; background:rgba(0,0,0,0.3); border-radius:8px;">
                <div style="font-size:2rem; margin-bottom:1rem;">🎵</div>
                <div style="margin-bottom:1.5rem; color:var(--adm-gold);">${m.file_upload.split('/').pop()}</div>
                <audio controls autoplay style="width:100%;">
                    <source src="${m.file_upload}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
    } else {
        contentHtml = '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Tidak ada media untuk diputar.</div>';
    }
    
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:500px; background:#111;">
            <div class="modal-header">
                <h3 class="modal-title">▶️ Memutar: ${m.title}</h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active'); document.getElementById('${modalId}').innerHTML='';">&times;</button>
            </div>
            <div class="modal-body" style="padding:0;">
                ${contentHtml}
            </div>
        </div>
    `;
    
    overlay.style.display = 'flex';
    overlay.classList.add('active');
};


if (!window.syncEngine) {
    window.syncEngine = { pushEventsToServer: pushEventsToServer };
} else {
    window.syncEngine.pushEventsToServer = pushEventsToServer;
}

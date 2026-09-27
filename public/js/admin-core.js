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
window.syncChannel = new BroadcastChannel('mc_sync_channel');
window.syncChannel.onmessage = (event) => {
    if (event.data === 'RELOAD_CALENDAR') {
        console.log('[SyncChannel] Sinyal update diterima, me-reload database calendar...');
        if (typeof loadUnifiedEventsDatabase === 'function') {
            loadUnifiedEventsDatabase();
        }
    }
};

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

        if (map.has(key)) {
            const ev = map.get(key);
            ev.customerId = cust.id;
            ev.price = 'Rp ' + Number(cust.price || 0).toLocaleString('id-ID');
            ev.rawPrice = Number(cust.price || 0);
            ev.pic = cust.name + (cust.w? ` (${cust.wa})` : '');
            ev.paymentStatus = cust.paymentStatus;
            ev.category = cust.category || ev.category;
            map.set(key, ev);
        } else {
            const newEv = {
                id: cust.id,
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
            musicList: Array.isArray(ev.musicList) ? ev.musicList : [],
            rundown: Array.isArray(ev.rundown) ? ev.rundown : [],
            created_at: ev.created_at || null
        }));

        // Data murni dari database, tidak menyimpan cache lokal lagi
        
        if (typeof renderDashEvents === 'function') renderDashEvents();
        if (typeof window.adminCalendar !== 'undefined' && window.adminCalendar.setEvents) {
            window.adminCalendar.setEvents(adminEventsDb);
        }
        
        updateCalendarMenuBadge();
        if (typeof updateCalMetrics === 'function') updateCalMetrics();
        
    } catch (e) {
        console.error('[Sync] Gagal memuat event:', e);
    }
    
    // saveUnifiedEventsDatabase();
    if (window.renderCashflowTable) window.renderCashflowTable();


    if (!activeCommandCenterEventId && adminEventsDb.length > 0) {
        activeCommandCenterEventId = adminEventsDb[0].id;
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
function saveUnifiedEventsDatabase() {
    try {
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
    // Disabled per user request: data lokal tidak boleh menimpa server secara massal
    console.log('[Sync] pushEventsToServer disabled.');
}

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

function switchCommandCenterEvent(eventId) {
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
}
window.switchCommandCenterEvent = switchCommandCenterEvent;

function openEventInCommandCenter(eventId) {
    loadActiveEventInCommandCenter(eventId);
    if (typeof navigateToSection === 'function') {
        navigateToSection('sec-command-center', document.getElementById('menu-command-center'));
    }
}
window.openEventInCommandCenter = openEventInCommandCenter;

function openCustomerInCommandCenter(custId) {
    let ev = adminEventsDb.find(e => String(e.customerId) === String(custId) || String(e.id) === String(custId));
    if (!ev) {
        let cust = null;
        try {
            const raw = JSON.stringify(window.mcCustomers || []);
            const custs = raw ? JSON.parse(raw) : [];
            cust = custs.find(c => String(c.id) === String(custId));
        } catch(e) {}

        if (cust) {
            syncCustomerToCalendar(cust);
            ev = adminEventsDb.find(e => String(e.customerId) === String(custId) || String(e.id) === String(custId));
        }
    }
    const targetId = ev ? ev.id : (adminEventsDb[0] ? adminEventsDb[0].id : 1);
    openEventInCommandCenter(targetId);
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
    let existingIndex = adminEventsDb.findIndex(e => String(e.id) === String(cust.id) || String(e.customerId) === String(cust.id) || `${e.date}::${(e.title || '').trim().toLowerCase()}` === key);

    let status = 'Review';
    if (cust.paymentStatus && (cust.paymentStatus.includes('Lunas') || cust.paymentStatus.includes('100%') || cust.paymentStatus.includes('DP'))) {
        status = 'Terkunci';
    } else if (cust.paymentStatus && (cust.paymentStatus.includes('Hold') || cust.paymentStatus.includes('Tentative'))) {
        status = 'Tentative';
    }

    const timeFormatted = cust.time || (cust.startTime && cust.endTime ? `${cust.startTime} - ${cust.endTime} WIB (${cust.duration || ''})` : '18:00 - 22:00 WIB (4 Jam)');
    const eventData = {
        id: cust.id,
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
        adminEventsDb[existingIndex] = { ...adminEventsDb[existingIndex], ...eventDat};
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
    const eventsToDelete = adminEventsDb.filter(e => String(e.id) === String(custId) || String(e.customerId) === String(custId));
    
    // 1. Delete from SERVER database (MySQL)
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || window.CSRF_TOKEN || '';
        const headers = { 'Accept': 'application/json', 'X-CSRF-TOKEN': token };
        
        // Delete events from server
        for (const ev of eventsToDelete) {
            const dbEvId = ev._dbEventId || ev.dbEventId || ev.id;
            if (dbEvId) {
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
    try { AdminDB.setItem('activeCommandCenterEventId', ev.id); } catch(e) {}

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
    if (metaDate) metaDate.textContent = `& ${formatDateIndoFull(ev.date)}`;

    const metaTime = document.getElementById('ccEventMetaTime');
    if (metaTime) metaTime.textContent = `⏰ ${ev.time || '19:00 - 22:00 WIB'}`;

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
    const clientPhone = cust ? cust.w: (ev.pic && ev.pic.includes('(') ? ev.pic.split('(')[1].replace(')', '').trim() : '-');
    const clientEmail = cust ? (cust.email || '-') : '-';
    const clientPkg = cust ? cust.category : (ev.category || 'Belum Dipilih');
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

    const clientNameEl = document.getElementById('eccClientName');
    if (clientNameEl) clientNameEl.textContent = clientName;

    const clientContact = document.getElementById('eccClientContact');
    if (clientContact) {
        clientContact.innerHTML = `<span>${clientPhone}</span> <span>S0️ ${clientEmail}</span>`;
    }

    const clientPkgEl = document.getElementById('eccClientPkg');
    if (clientPkgEl) clientPkgEl.textContent = clientPkg;

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

    // 5. Tab 1 - VIP Protocol
    const vipContainer = document.getElementById('eccVipProtocolList');
    if (vipContainer) {
        const protocols = ev.vipProtocol && ev.vipProtocol.length > 0 ? ev.vipProtocol : [];
        if (protocols.length === 0) {
            vipContainer.innerHTML = '<div style="color:var(--adm-text-muted); font-size:0.85rem; font-style:italic;">Belum addatprotokol VIP.</div>';
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
    const dpVal = isLunas ? rawVal : (isDp ? Math.round(rawVal * 0.5) : 0);
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
        } else if (isDp) {
            financeBadge.className = 'badge badge-tentative';
            financeBadge.textContent = 'DP 50% Diterima';
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
        postReviewArea.value = `Halo Kak ${clientName}, salam hangat dari VanyArsyad & Tim MC-Connect.nnTerimkasih banyak atas kepercayaan luar biasyang telah diberikan kepadkami untuk memandu agendistimew"${ev.title}". Merupakan suatu kehormatan dan kebahagiaan tak terhinggdapat menjadi bagian dari momen indah Anda!nnJikKak ${clientName} berkenan, kami akan sangat berterimkasih atas ulasan bintang 5 dan testimoni singkat melalui tautan berikut:n⭐ https://vanyaarsyad.com/review?id=${ev.id}nnUlasan dan feedback Kak ${clientName} sangat berhargbagi peningkatan standar performpanggung kami di masdepan. Sukses dan bahagiselalu!nnSalam hormat,nVanyArsyad, S.I.Kom`;
    }
    const postReviewSub = document.getElementById('tabReviewSubtitle');
    if (postReviewSub) {
        postReviewSub.textContent = `Kirim pesan otomatis WhatsApp kepad${clientName} (${clientPhone}) untuk meminttestimoni & rating bintang 5 setelah acara selesai.`;
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
        window.loadActiveEventInCommandCenter();
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
    const progressBar = document.getElementById('eccChecklistProgress');
    const progressText = document.getElementById('eccChecklistProgressText');
    if (!progressBar) return;
    
    try {
        const checkboxes = document.querySelectorAll('#eccChecklistBody input[type="checkbox"]');
        if (checkboxes.length === 0) return;
        
        const checked = document.querySelectorAll('#eccChecklistBody input[type="checkbox"]:checked').length;
        const total = checkboxes.length;
        const pct = Math.round((checked / total) * 100);
        
        progressBar.style.width = pct + '%';
        progressBar.setAttribute('aria-valuenow', pct);
        if (progressText) {
            progressText.textContent = checked + '/' + total + ' (' + pct + '%)';
        }
    } catch(e) {}
}
window.updateAdminChkProgress = updateAdminChkProgress;

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
                } else {
                    badge.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>';
                    badge.className = 'badge badge-tentative';
                    msg.style.display = 'none';
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
    renderAdminAgendaList(); // Reuse agenda list for rundown
}
window.renderAdminRundownList = renderAdminRundownList;

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
window.renderAdminSoundboardList = renderAdminSoundboardList;

function renderAdminVendorCollab(ev) {
    try {
        const container = document.getElementById('eccVendorBody');
        if (!container) return;
        if (!ev || !ev.vendors || ev.vendors.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--adm-text-muted);">Belum ada vendor terdaftar.</div>';
            return;
        }
        container.innerHTML = ev.vendors.map(v => {
            return '<div style="padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">' +
                '<strong>' + escapeHtml(v.name || 'Vendor') + '</strong>' +
                '<div style="font-size:0.8rem; color:var(--adm-text-muted);">' + escapeHtml(v.role || v.type || '') + '</div>' +
            '</div>';
        }).join('');
    } catch(e) {}
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
            if (!Array.isArray(items) || items.length === 0) {
                grid.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Belum ada item wardrobe.</div>';
            } else {
                grid.innerHTML = items.map(item => {
                    return '<div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:1rem; border:1px solid rgba(255,255,255,0.06); display:flex; gap:1rem; align-items:center;">' +
                        (item.imgUrl ? '<img src="'+escapeHtml(item.imgUrl)+'" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">' : '<div style="width:50px; height:50px; border-radius:8px; background:#444; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">👔</div>') +
                        '<div>' +
                            '<div style="font-weight:700;">' + escapeHtml(item.name || 'Item') + '</div>' +
                            '<div style="font-size:0.8rem; color:var(--adm-text-muted); margin-top:0.25rem;">' + escapeHtml(item.colorName || item.colorHex || '') + '</div>' +
                        '</div>' +
                    '</div>';
                }).join('');
            }
        }

        // 2. Render in Global Wardrobe Manager (globalWardrobeTableBody)
        const tbody = document.getElementById('globalWardrobeTableBody');
        if (tbody) {
            if (!Array.isArray(items) || items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Belum ada item wardrobe. Klik Tambah Gaun Baru.</td></tr>';
            } else {
                tbody.innerHTML = items.map(item => {
                    return '<tr>' +
                        '<td>' + (item.imgUrl ? '<img src="'+escapeHtml(item.imgUrl)+'" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">' : '<div style="width:40px; height:40px; border-radius:6px; background:#444; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">👔</div>') + '</td>' +
                        '<td style="font-weight:600;">' + escapeHtml(item.name || '-') + '</td>' +
                        '<td>' + escapeHtml(item.desc || '-') + '</td>' +
                        '<td>' + (item.colorName ? escapeHtml(item.colorName) : (item.colorHex ? escapeHtml(item.colorHex) : '-')) + '</td>' +
                        '<td><span class="badge" style="background:rgba(59,130,246,0.1); color:#60A5FA;">' + escapeHtml(item.status || 'Tersedia') + '</span></td>' +
                        '<td style="text-align:center;">' + (item.frequency || 0) + 'x</td>' +
                        '<td style="text-align:right;">' +
                            '<button class="btn btn-secondary btn-sm" onclick="editWardrobe('+escapeHtml(JSON.stringify(item.id||item.name))+')">Hapus</button>' +
                        '</td>' +
                    '</tr>';
                }).join('');
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
        
        const el1 = document.getElementById('calMetricTerkunci');
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


function autoSyncCustomersToEvents(customers) {
    if (!customers || !Array.isArray(customers)) return;
    
    let isModified = false;
    customers.forEach(cust => {
        if (!cust.date || !cust.event) return;
        
        const key = `${cust.date}::${(cust.event || '').trim().toLowerCase()}`;
        let existingIndex = adminEventsDb.findIndex(e => String(e.id) === String(cust.id) || String(e.customerId) === String(cust.id) || `${e.date}::${(e.title || '').trim().toLowerCase()}` === key);

        let status = 'Review';
        if (cust.paymentStatus && (cust.paymentStatus.includes('Lunas') || cust.paymentStatus.includes('100%') || cust.paymentStatus.includes('DP'))) {
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
                id: cust.id || Date.now(),
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
                renderCashflowTable();
            }
        })
        .catch(err => {
            console.error('Failed to load cashflow', err);
            window.cashflowTransactions = [];
            renderCashflowTable();
        });
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
                        transactions.push({
                            id: 'ev_' + c.id,
                            date: c.date || new Date().toISOString().split('T')[0],
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
        
        // Sort by date descending
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
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
                transactions.push({ id: 'ev_' + c.id, date: c.date, desc: desc, category: 'Pendapatan Booking', amount: amount, type: 'in', status: 'Berhasil' });
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

    const dataPromise = window.uiCustomForm([
        { id: 'type', label: 'Tipe Kas', type: 'select', options: [{value: '', label: '-- Pilih Tipe Kas --'}, {value: 'in', label: 'Kas Masuk (+)'}, {value: 'out', label: 'Kas Keluar (-)'}], value: isEdit ? existingData.type : '' },
        { id: 'category', label: 'Kategori', type: 'select', options: defaultCatOpts, value: isEdit ? existingData.category : '' },
        { id: 'amount', label: 'Nominal (Rp)', type: 'number', value: isEdit ? existingData.amount : '' },
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
    if (String(id).startsWith('ev_') || String(id).startsWith('exp_')) {
        uiAlert('Data auto-sync dari kalender tidak dapat dihapus dari sini.');
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
            if(typeof uiAlert === 'function') uiAlert('Status pembayaran berhasil diupdate!');
            const sel = document.getElementById('adminFinanceSelect');
            if(sel) sel.setAttribute('data-original-value', val);
            if(typeof loadUnifiedEventsDatabase === 'function') {
                await loadUnifiedEventsDatabase();
                switchCommandCenterEvent(activeCommandCenterEventId);
            }
        } else {
            if(typeof uiAlert === 'function') uiAlert('Gagal update status pembayaran.');
        }
    } catch(e) {
        console.error(e);
        if(typeof uiAlert === 'function') uiAlert('Terjadi kesalahan jaringan.');
    }
};

window.openEditInvoiceModal = function() {
    if(!activeCommandCenterEventId) {
        if(typeof uiAlert === 'function') uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    const ev = adminEventsDb.find(e => String(e.id) === String(activeCommandCenterEventId));
    if (!ev) return;

    const container = document.getElementById('invoiceItemsContainer');
    if(container) {
        container.innerHTML = '';
        // Create an initial item based on current contract value
        const initialVal = ev.rawPrice || 0;
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '5px';
        div.innerHTML = `
            <input type="text" class="form-input invoice-item-desc" style="flex:1;" value="Jasa MC & Entertainment" placeholder="Deskripsi layanan (ex: Aditional MC)">
            <input type="number" class="form-input invoice-item-price" style="width:150px;" value="${initialVal}" placeholder="1000000" oninput="calculateInvoiceTotal()">
            <button type="button" class="btn btn-secondary btn-sm" style="color:var(--adm-danger); border-color:transparent; background:transparent;" onclick="this.parentElement.remove(); calculateInvoiceTotal();">X</button>
        `;
        container.appendChild(div);
    }
    calculateInvoiceTotal();

    const m = document.getElementById('editInvoiceModal');
    if(m) m.classList.add('active');
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
    
    try {
        const res = await fetch('/api/cms/events/' + activeCommandCenterEventId, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nilai_kontrak: total })
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

    const m = document.getElementById('invoicePrintModal');
    if(m) m.classList.add('active');
};

window.promptAssignWardrobe = async function() {
    if(!activeCommandCenterEventId) {
        if(typeof uiAlert === 'function') uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    
    let wardrobeOptions = [{value: '', label: 'Belum ada data gaun. Buka menu Wardrobe.'}];
    
    if(typeof uiCustomForm === 'function') {
        const data = await uiCustomForm([
            { id: 'wardrobe_id', label: 'Pilih Gaun / Koleksi', type: 'select', options: wardrobeOptions },
            { id: 'note', label: 'Catatan (Opsional)', type: 'text' }
        ], 'Assign Wardrobe ke Acara');
        
        if(data) {
            uiAlert('Fitur integrasi Wardrobe masih dalam pengembangan. Data yang dimasukkan: ' + JSON.stringify(data));
        }
    } else {
        alert('Fitur ini memerlukan custom-modal.js.');
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

window.promptAddGlobalWardrobe = async function() {
    if(typeof uiCustomForm === 'function') {
        const data = await uiCustomForm([
            { id: 'name', label: 'Kode / Nama Gaun', type: 'text' },
            { id: 'desc', label: 'Deskripsi Singkat', type: 'text' },
            { id: 'colorName', label: 'Kategori / Warna', type: 'text' },
            { id: 'status', label: 'Status Gaun', type: 'select', options: [{value: 'Tersedia', label: 'Tersedia'}, {value: 'Sedang Dipakai', label: 'Sedang Dipakai'}, {value: 'Laundry / Rusak', label: 'Laundry / Rusak'}] }
        ], 'Tambah Wardrobe Baru');
        
        if(data) {
            if(!data.name) {
                uiAlert('Nama Gaun wajib diisi!');
                return;
            }
            try {
                // Fetch existing first
                const res = await fetch('/api/cms/wardrobe-catalog');
                const json = await res.json();
                let items = [];
                if(json.success && json.data) items = json.data;
                
                items.push({
                    name: data.name,
                    desc: data.desc,
                    colorName: data.colorName,
                    status: data.status,
                    frequency: 0
                });
                
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
        const expenses = cashflows.filter(c => c.type === 'expense');
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

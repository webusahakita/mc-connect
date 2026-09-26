const fs = require('fs');

// ============================================================
// STEP 1: Add all missing function definitions to admin-core.js
// ============================================================
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Find the DOMContentLoaded block to insert functions BEFORE it
let domIdx = js.lastIndexOf("document.addEventListener('DOMContentLoaded'");

let missingFunctions = `
// ============================================================
// CMS Landing Page Configuration Loader
// ============================================================
function initAdminCms() {
    try {
        const saved = localStorage.getItem('mc_cms_config');
        if (saved) {
            window.cmsConfig = JSON.parse(saved);
        } else {
            window.cmsConfig = {};
        }
        // Populate CMS fields if on settings page
        const heroTitle = document.getElementById('cmsHeroTitle');
        if (heroTitle && window.cmsConfig.heroTitle) {
            heroTitle.value = window.cmsConfig.heroTitle;
        }
        const heroSubtitle = document.getElementById('cmsHeroSubtitle');
        if (heroSubtitle && window.cmsConfig.heroSubtitle) {
            heroSubtitle.value = window.cmsConfig.heroSubtitle;
        }
    } catch(e) {
        console.warn('CMS init skipped:', e.message);
    }
}
window.initAdminCms = initAdminCms;

// ============================================================
// Cash Flow Transactions Loader
// ============================================================
function loadCashflowTransactions() {
    try {
        const saved = localStorage.getItem('mc_cashflow_db');
        if (saved) {
            window.cashflowTransactions = JSON.parse(saved);
        } else {
            window.cashflowTransactions = [];
        }
        if (typeof renderCashflowTable === 'function') {
            renderCashflowTable();
        }
    } catch(e) {
        console.warn('Cashflow load skipped:', e.message);
        window.cashflowTransactions = [];
    }
}
window.loadCashflowTransactions = loadCashflowTransactions;

// ============================================================
// Payment Settings Loader
// ============================================================
function loadPaymentSettings() {
    try {
        const saved = localStorage.getItem('mc_payment_settings');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch(e) {}
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
        const inspector = document.getElementById('agendaInspector');
        const title = document.getElementById('agendaInspectorTitle');
        const body = document.getElementById('agendaInspectorBody');
        
        if (title) {
            title.textContent = 'Agenda: ' + dateStr;
        }
        
        if (body) {
            if (!eventsOnDate || eventsOnDate.length === 0) {
                body.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--adm-text-muted);">Tanggal ini tersedia. Klik tombol + untuk membuat booking baru.</div>';
            } else {
                body.innerHTML = eventsOnDate.map(ev => {
                    return '<div style="padding:0.75rem; margin-bottom:0.5rem; background:rgba(255,255,255,0.03); border-radius:8px; border-left:3px solid ' + (ev.status === 'Terkunci' ? '#10B981' : '#F59E0B') + ';">' +
                        '<strong>' + escapeHtml(ev.title || 'Acara') + '</strong>' +
                        '<div style="font-size:0.8rem; color:var(--adm-text-muted); margin-top:0.25rem;">' + (ev.time || '19:00 - 22:00 WIB') + ' | ' + (ev.venue || 'Venue TBD') + '</div>' +
                        '<div style="margin-top:0.25rem;"><span style="color:' + (ev.status === 'Terkunci' ? '#10B981' : '#F59E0B') + '; font-weight:600; font-size:0.8rem;">' + (ev.status || 'Review') + '</span></div>' +
                    '</div>';
                }).join('');
            }
        }
        
        if (inspector) {
            inspector.style.display = '';
            inspector.classList.add('active');
        }
    } catch(e) {
        console.warn('showAgendaInspector:', e.message);
    }
}
window.showAgendaInspector = showAgendaInspector;

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
function renderWardrobe() {
    try {
        const container = document.getElementById('wardrobeGrid');
        if (!container) return;
        const items = JSON.parse(localStorage.getItem('mc_wardrobe_db') || '[]');
        if (items.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Belum ada item wardrobe. Klik + untuk menambahkan.</div>';
            return;
        }
        container.innerHTML = items.map(item => {
            return '<div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:1rem; border:1px solid rgba(255,255,255,0.06);">' +
                '<div style="font-weight:700;">' + escapeHtml(item.name || 'Item') + '</div>' +
                '<div style="font-size:0.8rem; color:var(--adm-text-muted); margin-top:0.25rem;">' + escapeHtml(item.category || '') + '</div>' +
                (item.notes ? '<div style="font-size:0.75rem; color:var(--adm-text-secondary); margin-top:0.25rem;">' + escapeHtml(item.notes) + '</div>' : '') +
            '</div>';
        }).join('');
    } catch(e) {}
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

`;

// Insert before DOMContentLoaded
if (domIdx !== -1) {
    js = js.substring(0, domIdx) + missingFunctions + '\n' + js.substring(domIdx);
    console.log('Inserted all missing functions before DOMContentLoaded');
} else {
    js += missingFunctions;
    console.log('Appended all missing functions');
}

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('admin-core.js updated');

// ============================================================
// STEP 2: Fix ALL remaining text typos across all files
// ============================================================
let html = fs.readFileSync('public/admin.html', 'utf8');
let cjs = fs.readFileSync('public/js/customers.js', 'utf8');

// Build comprehensive typo map
const typoFixes = [
    // Concatenated words (from comma removal disaster)
    [/Performa MC/g, 'Performa MC'],  // already correct, skip
    [/Daftar Acar&/g, 'Daftar Acara &'],
    [/Daftar Acar([^a])/g, 'Daftar Acara$1'],
    [/Jadwal Acar([^a])/g, 'Jadwal Acara$1'],
    [/Durasi Acar([^a])/g, 'Durasi Acara$1'],
    [/adacar([^a])/g, 'ada acara$1'],
    [/dibuktepat/g, 'dibuka tepat'],
    [/Tabel Pengaturan Sound/g, 'Tabel Pengaturan Sound'],
    [/5 setelah acarselesai/g, '5 setelah acara selesai'],
    [/Kalender Ketersedi([^a])/g, 'Kalender Ketersediaan$1'],
    [/tersedi([^a])/g, 'tersedia$1'],  // be careful with this one
];

for (let [pattern, replacement] of typoFixes) {
    html = html.replace(pattern, replacement);
    js = js.replace(pattern, replacement);
    cjs = cjs.replace(pattern, replacement);
}

fs.writeFileSync('public/admin.html', html, 'utf8');
fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
fs.writeFileSync('public/js/customers.js', cjs, 'utf8');
console.log('All text typos fixed');

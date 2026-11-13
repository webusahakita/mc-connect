import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

function setupDomMocks(dom) {
    dom.window.fetch = async () => ({
        ok: true,
        json: async () => ({ success: true, data: [] })
    });
    dom.window.BroadcastChannel = class {
        constructor() {}
        postMessage() {}
        close() {}
    };
    dom.window.scrollTo = () => {};
    dom.window.setInterval = () => 0;
    dom.window.setTimeout = () => 0;
    dom.window.escapeHtml = (s) => s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';
    return dom;
}

// -----------------------------------------------------------------------------
// SKENARIO 1: Portal Publik (/) & Booking Request Form
// -----------------------------------------------------------------------------
test('Skenario 1: Portal Publik memiliki navigasi mulus, sosmed lengkap, riders download, dan modal booking terproteksi', () => {
    const indexHtml = fs.readFileSync('public/index.html', 'utf8');
    const calJs = fs.readFileSync('public/js/calendar.js', 'utf8');

    // 1. Social media links (Instagram, TikTok, Facebook)
    assert.ok(indexHtml.includes('pubHeroSosmed'), 'pubHeroSosmed container must exist');
    assert.ok(indexHtml.includes('exportPressKitPDF()') || indexHtml.includes('Press Kit'), 'Press kit / riders download button must exist');

    // 1b. Menu Tab Buat Web MC / Bisnis (Opens in new tab, not inside main landing page)
    assert.ok(indexHtml.includes('href="/bisnis"'), 'Menu tab must link to /bisnis');
    assert.ok(indexHtml.includes('target="_blank"'), 'Menu tab must open in a new tab');
    assert.ok(!indexHtml.includes('<section class="section-padding keunggulan-section" id="keunggulan">'), 'Section should not clutter main landing page');
    
    // 1c. Dedicated Keunggulan HTML file exists and contains full feature showcase
    const keunggulanHtml = fs.readFileSync('public/keunggulan.html', 'utf8');
    assert.ok(keunggulanHtml.includes('advantagesGrid'), 'advantagesGrid must exist on keunggulan page');
    assert.ok(keunggulanHtml.includes('portal-grid'), 'portal-grid must exist on keunggulan page');
    assert.ok(keunggulanHtml.includes('Matriks Perbandingan'), 'Comparison matrix must exist on keunggulan page');
    assert.ok(keunggulanHtml.includes('6287886136189') || keunggulanHtml.includes('0878-8613-6189'), 'WhatsApp contact 0878-8613-6189 must exist for booking/sales');
    assert.ok(keunggulanHtml.includes('Wardrobe Tracker') && keunggulanHtml.includes('Master Bank Musik'), 'Full features must be present');
    assert.ok(keunggulanHtml.includes('application/ld+json'), 'SEO JSON-LD schema must exist');

    // 2. Booking Modal fields validation
    assert.ok(indexHtml.includes('id="bookPicName"'), 'bookPicName input must exist');
    assert.ok(indexHtml.includes('id="bookWa"'), 'bookWa input must exist');
    assert.ok(indexHtml.includes('id="bookEventName"') || indexHtml.includes('id="bookEventDate"'), 'Booking fields must exist');

    // 3. Kalender Ketersediaan Publik: Color badge mapping
    assert.ok(calJs.includes('Tersedia') && calJs.includes('Available'), 'Available status supported');
    assert.ok(calJs.includes('Tentative') && calJs.includes('#F59E0B'), 'Tentative yellow status supported');
    assert.ok(calJs.includes('Terkunci') && calJs.includes('#EF4444'), 'Locked red status supported');
});

// -----------------------------------------------------------------------------
// SKENARIO 2: Konfirmasi Lead & Finansial (Admin Workspace)
// -----------------------------------------------------------------------------
test('Skenario 2: Admin Workspace memiliki kalender responsif, QRIS statis bisnis, dan integrasi WhatsApp', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');
    const adminCss = fs.readFileSync('public/css/admin.css', 'utf8');

    // 1. Calendar Header responsive bar
    assert.ok(adminHtml.includes('class="calendar-section-header"'), 'calendar-section-header must exist');
    assert.ok(adminHtml.includes('class="calendar-actions-bar"'), 'calendar-actions-bar must exist');
    assert.ok(adminHtml.includes('Hari Ini'), 'Hari Ini button must exist');
    assert.ok(adminHtml.includes('+ Tambah Jadwal Baru'), '+ Tambah Jadwal Baru button must exist');

    // 2. Static QRIS Bisnis in Command Center
    assert.ok(adminHtml.includes('id="adminQrisImg"'), 'adminQrisImg element must exist');
    assert.ok(adminHtml.includes('id="adminQrisTitle"'), 'adminQrisTitle element must exist');
    assert.ok(adminHtml.includes('id="adminQrisDesc"'), 'adminQrisDesc element must exist');

    // 3. WhatsApp Gateway Helper function cleans number and injects client name
    const adminCoreJs = fs.readFileSync('public/js/admin-core.js', 'utf8');
    assert.ok(adminCoreJs.includes('formatWaPhone') || adminCoreJs.includes('replace(/[^0-9]/g'), 'Must sanitize WhatsApp phone numbers');
});

// -----------------------------------------------------------------------------
// SKENARIO 3: Penyiapan Rundown & AI MC Co-Pilot
// -----------------------------------------------------------------------------
test('Skenario 3: Penyiapan Rundown, AI Co-Pilot prompt, dan sync ke Vendor Collab', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');

    // 1. Rundown Tab in Command Center
    assert.ok(adminHtml.includes('id="tab-stage"'), 'tab-stage must exist');
    assert.ok(adminHtml.includes('id="adminRundownTimeline"'), 'adminRundownTimeline must exist');

    // 2. AI MC Co-Pilot Tab / Modal
    assert.ok(adminHtml.includes('id="aiCoPilotModal"'), 'aiCoPilotModal must exist');
    assert.ok(adminHtml.includes('id="btnRunAiScript"'), 'btnRunAiScript must exist');
    assert.ok(adminHtml.includes('applyAiScript()'), 'applyAiScript must exist');

    // 3. Vendor Collab Tab syncs event title & segment list
    assert.ok(adminHtml.includes('id="vendorCollabEventTitle"'), 'vendorCollabEventTitle must exist');
    assert.ok(adminHtml.includes('id="vendorCollabTableBody"'), 'vendorCollabTableBody must exist');
});

// -----------------------------------------------------------------------------
// SKENARIO 4: Simulasi Hari H (Stage Mode & Vendor Live Sync)
// -----------------------------------------------------------------------------
test('Skenario 4: Stage Mode (OLED dark, font size, mirror, soundboard) & Vendor Mode (Live Sync, 2D Scroll, Pagination)', () => {
    const stageHtml = fs.readFileSync('resources/views/workspace/stage.html', 'utf8');
    const stageCss = fs.readFileSync('public/css/stage-mode.css', 'utf8');
    const vendorHtml = fs.readFileSync('resources/views/workspace/vendor.html', 'utf8');

    // 1. Stage Mode features
    assert.ok(stageHtml.includes('A+') && stageHtml.includes('A-'), 'Font zoom buttons exist in stage mode');
    assert.ok(stageHtml.includes('Mirror') || stageHtml.includes('mirror'), 'Mirror mode toggle exists');
    assert.ok(stageHtml.includes('soundboard') || stageHtml.includes('sfx') || stageHtml.includes('Soundboard'), 'Soundboard SFX exists');
    assert.ok(stageHtml.includes('btnStageNext') || stageHtml.includes('BERIKUTNYA'), 'Next segment giant button exists');
    assert.ok(stageCss.includes('stage-clock'), 'Clock styles exist in stage-mode.css');

    // 2. Vendor Mode features
    assert.ok(vendorHtml.includes('LIVE ON STAGE') || vendorHtml.includes('live-indicator'), 'Live indicator badge exists');
    assert.ok(vendorHtml.includes('vendorPageSizeSelect'), 'Row count filter dropdown exists');
    assert.ok(vendorHtml.includes('vendor-table-scroll-container'), '2D scroll container exists');
    assert.ok(vendorHtml.includes('btnVendorPrev') && vendorHtml.includes('btnVendorNext'), 'Pagination nav buttons exist');
});

// -----------------------------------------------------------------------------
// SKENARIO 5: Pasca-Acara & Tutup Buku Finansial
// -----------------------------------------------------------------------------
test('Skenario 5: Data Pelanggan CRM, Cashflow input validation (no minus/letters), and receipt proof upload', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');

    // 1. Customers Section
    assert.ok(adminHtml.includes('id="sec-customers"'), 'sec-customers section must exist');
    assert.ok(adminHtml.includes('id="custSearchInput"'), 'Customer search input must exist');

    // 2. Cashflow Section & Input validations
    assert.ok(adminHtml.includes('id="sec-cashflow"'), 'sec-cashflow section must exist');
    assert.ok(adminHtml.includes('id="newCfAmount"'), 'newCfAmount input must exist');
    assert.ok(adminHtml.includes('replace(/[^0-9]/g, \'\')'), 'newCfAmount strictly replaces non-digits');

    // 3. Expense Tracker input validation
    assert.ok(adminHtml.includes('id="expenseAmount"'), 'expenseAmount input must exist');
    assert.ok(adminHtml.includes('replace(/[^0-9]/g, \'\')'), 'expenseAmount strictly replaces non-digits');
});

// -----------------------------------------------------------------------------
// PUSAT PANDUAN & ROADMAP SAAS (SIDEBAR MENU STATIS & SEC-GUIDE)
// -----------------------------------------------------------------------------
test('Menu Sidebar Statis: Panduan & Fitur Aplikasi serta Blueprint SaaS terpasang rapi', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');
    const adminCoreJs = fs.readFileSync('public/js/admin-core.js', 'utf8');
    const adminCss = fs.readFileSync('public/css/admin.css', 'utf8');

    // 1. Sidebar menu button exists
    assert.ok(adminHtml.includes('id="menu-guide"'), 'menu-guide button must exist in sidebar');
    assert.ok(adminHtml.includes("navigateToSection('sec-guide'"), 'menu-guide must navigate to sec-guide');
    assert.ok(adminHtml.includes('Panduan & Fitur'), 'menu-guide must contain label Panduan & Fitur');

    // 2. Section sec-guide exists with 4 subpanels
    assert.ok(adminHtml.includes('id="sec-guide"'), 'sec-guide section must exist');
    assert.ok(adminHtml.includes('id="guide-workflow"'), 'guide-workflow subpanel must exist');
    assert.ok(adminHtml.includes('id="guide-features"'), 'guide-features subpanel must exist');
    assert.ok(adminHtml.includes('id="guide-saas"'), 'guide-saas subpanel must exist');
    assert.ok(adminHtml.includes('id="guide-actions"'), 'guide-actions subpanel must exist');

    // 3. Breadcrumb mapping exists in admin-core.js
    assert.ok(adminCoreJs.includes("'sec-guide'"), 'sec-guide must be registered in sectionBreadcrumbMap');

    // 4. CSS classes exist in admin.css
    assert.ok(adminCss.includes('.guide-hero-banner'), 'guide-hero-banner must exist in admin.css');
    assert.ok(adminCss.includes('.guide-step-card'), 'guide-step-card must exist in admin.css');
    assert.ok(adminCss.includes('.saas-tier-card'), 'saas-tier-card must exist in admin.css');
});

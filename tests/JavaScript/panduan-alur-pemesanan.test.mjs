import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// NOTE: The legacy monolithic workspace HTML (index.html, workspace/admin.html,
// workspace/stage.html, workspace/vendor.html) was removed in favour of the React
// SPA. Assertions that scraped those files are gone; what remains below verifies
// the still-shipping first-party assets (keunggulan.html, calendar.js,
// admin-core.js and the CSS bundles).

// -----------------------------------------------------------------------------
// SKENARIO 1: Portal Publik — halaman keunggulan & kalender ketersediaan
// -----------------------------------------------------------------------------
test('Skenario 1: Halaman keunggulan lengkap dan kalender publik memetakan status warna', () => {
    const calJs = fs.readFileSync('public/js/calendar.js', 'utf8');

    // 1. Dedicated Keunggulan HTML file exists and contains full feature showcase
    const keunggulanHtml = fs.readFileSync('public/keunggulan.html', 'utf8');
    assert.ok(keunggulanHtml.includes('advantagesGrid'), 'advantagesGrid must exist on keunggulan page');
    assert.ok(keunggulanHtml.includes('portal-grid'), 'portal-grid must exist on keunggulan page');
    assert.ok(keunggulanHtml.includes('Matriks Perbandingan'), 'Comparison matrix must exist on keunggulan page');
    assert.ok(keunggulanHtml.includes('6287886136189') || keunggulanHtml.includes('0878-8613-6189'), 'WhatsApp contact 0878-8613-6189 must exist for booking/sales');
    assert.ok(keunggulanHtml.includes('Wardrobe Tracker') && keunggulanHtml.includes('Master Bank Musik'), 'Full features must be present');
    assert.ok(keunggulanHtml.includes('application/ld+json'), 'SEO JSON-LD schema must exist');

    // 2. Kalender Ketersediaan Publik: Color badge mapping
    assert.ok(calJs.includes('Tersedia') && calJs.includes('Available'), 'Available status supported');
    assert.ok(calJs.includes('Tentative') && calJs.includes('#F59E0B'), 'Tentative yellow status supported');
    assert.ok(calJs.includes('Terkunci') && calJs.includes('#EF4444'), 'Locked red status supported');
});

// -----------------------------------------------------------------------------
// SKENARIO 2: Integrasi WhatsApp (admin-core.js)
// -----------------------------------------------------------------------------
test('Skenario 2: WhatsApp Gateway Helper membersihkan nomor telepon', () => {
    const adminCoreJs = fs.readFileSync('public/js/admin-core.js', 'utf8');
    assert.ok(adminCoreJs.includes('formatWaPhone') || adminCoreJs.includes('replace(/[^0-9]/g'), 'Must sanitize WhatsApp phone numbers');
});

// -----------------------------------------------------------------------------
// SKENARIO 4: Stage Mode styling (stage-mode.css)
// -----------------------------------------------------------------------------
test('Skenario 4: Stage Mode memiliki styling clock', () => {
    const stageCss = fs.readFileSync('public/css/stage-mode.css', 'utf8');
    assert.ok(stageCss.includes('stage-clock'), 'Clock styles exist in stage-mode.css');
});

// -----------------------------------------------------------------------------
// PUSAT PANDUAN & ROADMAP SAAS (breadcrumb + styling)
// -----------------------------------------------------------------------------
test('Menu Sidebar Statis: breadcrumb sec-guide dan styling panduan terpasang', () => {
    const adminCoreJs = fs.readFileSync('public/js/admin-core.js', 'utf8');
    const adminCss = fs.readFileSync('public/css/admin.css', 'utf8');

    // Breadcrumb mapping exists in admin-core.js
    assert.ok(adminCoreJs.includes("'sec-guide'"), 'sec-guide must be registered in sectionBreadcrumbMap');

    // CSS classes exist in admin.css
    assert.ok(adminCss.includes('.guide-hero-banner'), 'guide-hero-banner must exist in admin.css');
    assert.ok(adminCss.includes('.guide-step-card'), 'guide-step-card must exist in admin.css');
    assert.ok(adminCss.includes('.saas-tier-card'), 'saas-tier-card must exist in admin.css');
});

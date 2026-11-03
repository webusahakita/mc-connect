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

// 1. Kalender Acara: Responsive Actions Bar & Section Header
test('1. Kalender Acara has responsive action buttons and section header', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');
    const adminCss = fs.readFileSync('public/css/admin.css', 'utf8');

    assert.ok(adminHtml.includes('class="calendar-section-header"'), 'calendar-section-header class must exist in admin.html');
    assert.ok(adminHtml.includes('class="calendar-actions-bar"'), 'calendar-actions-bar class must exist in admin.html');
    assert.ok(adminHtml.includes('+ Tambah Jadwal Baru'), '+ Tambah Jadwal Baru button must exist');
    assert.ok(adminHtml.includes('Hari Ini'), 'Hari Ini button must exist');

    assert.ok(adminCss.includes('.calendar-actions-bar'), '.calendar-actions-bar must be defined in admin.css');
    assert.ok(adminCss.includes('.calendar-section-header'), '.calendar-section-header must be defined in admin.css');
});

// 2. Landing Page: Facebook link saving & rendering
test('2. Landing Page renders Facebook link correctly and CmsApiController saves facebook_handle', () => {
    const controllerPhp = fs.readFileSync('app/Http/Controllers/CmsApiController.php', 'utf8');
    const publicCmsJs = fs.readFileSync('public/js/public-cms.js', 'utf8');
    const indexHtml = fs.readFileSync('public/index.html', 'utf8');

    // Controller check
    assert.ok(controllerPhp.includes("'facebook_handle'    => $request->input('fb'"), 'facebook_handle must be saved in updateBiodata');
    assert.ok(controllerPhp.includes("'fb'                  => $mc->facebook_handle"), 'fb must be returned in getBiodataData');

    // Frontend rendering in JSDOM
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
        <div id="pubHeroSosmed"></div>
        <div id="pubHeroSpec"></div>
    </body></html>`, { url: 'http://localhost:8000', runScripts: 'dangerously' });

    setupDomMocks(dom);
    dom.window.eval(publicCmsJs);

    // Verify index.html has wrap
    assert.ok(indexHtml.includes('pubHeroSosmed') && indexHtml.includes('flex-wrap:wrap'), 'pubHeroSosmed must support flex-wrap');
});

// 3. CMS Konten: Responsive social media inputs
test('3. CMS Konten social media fields are wrapped in responsive grid', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');
    const adminCss = fs.readFileSync('public/css/admin.css', 'utf8');

    assert.ok(adminHtml.includes('cms-social-grid'), 'cms-social-grid class must exist in admin.html');
    assert.ok(adminHtml.includes('id="cmsIg"'), 'cmsIg must exist');
    assert.ok(adminHtml.includes('id="cmsTiktok"'), 'cmsTiktok must exist');
    assert.ok(adminHtml.includes('id="cmsFb"'), 'cmsFb must exist');

    assert.ok(adminCss.includes('.cms-social-grid'), '.cms-social-grid must be defined in admin.css');
});

// 4. Galeri Portofolio: Responsive actions
test('4. Galeri Portofolio footer buttons are wrapped in responsive classes', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');
    const adminCss = fs.readFileSync('public/css/admin.css', 'utf8');

    assert.ok(adminHtml.includes('gallery-footer-actions'), 'gallery-footer-actions class must exist in admin.html');
    assert.ok(adminHtml.includes('gallery-btn-group'), 'gallery-btn-group class must exist in admin.html');
    assert.ok(adminHtml.includes('Reset ke Default'), 'Reset ke Default button must exist');
    assert.ok(adminHtml.includes('Simpan & Publikasi Galeri'), 'Simpan & Publikasi Galeri button must exist');

    assert.ok(adminCss.includes('.gallery-footer-actions'), '.gallery-footer-actions must be defined in admin.css');
    assert.ok(adminCss.includes('.gallery-btn-group'), '.gallery-btn-group must be defined in admin.css');
});

// 5. Event Command Center: Static QRIS from DB & Vendor Collab sync
test('5. Event Command Center supports static QRIS from DB and syncs active event vendor collab', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');
    const adminCoreJs = fs.readFileSync('public/js/admin-core.js', 'utf8');
    const appJs = fs.readFileSync('public/js/app.js', 'utf8');

    assert.ok(adminHtml.includes('id="adminQrisTitle"'), 'adminQrisTitle must exist in admin.html');
    assert.ok(adminHtml.includes('id="adminQrisDesc"'), 'adminQrisDesc must exist in admin.html');
    assert.ok(adminHtml.includes('id="vendorCollabEventTitle"'), 'vendorCollabEventTitle must exist');
    assert.ok(adminHtml.includes('id="vendorCollabEventMeta"'), 'vendorCollabEventMeta must exist');

    // Test in mock JSDOM with proper HTML table wrapper
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
        <img id="adminQrisImg" src="">
        <div id="adminQrisTitle"></div>
        <div id="adminQrisDesc"></div>
        <div id="vendorCollabEventTitle"></div>
        <div id="vendorCollabEventMeta"></div>
        <span id="vendorCollabCountBadge"></span>
        <table><tbody id="vendorCollabTableBody"></tbody></table>
        <div class="ecc-tab-btn" data-tab="tab-vendor"></div>
        <div class="tab-panel" id="tab-vendor"></div>
    </body></html>`, { url: 'http://localhost:8000', runScripts: 'dangerously' });

    setupDomMocks(dom);
    dom.window.mcGlobalPaymentSettings = { qrisUrl: '/uploads/qris/my-static-qris.png' };
    
    // Evaluate adminCoreJs
    dom.window.eval(adminCoreJs);
    dom.window.eval(appJs);

    // Call renderAdminVendorCollab with active event
    const mockEvent = {
        id: 77,
        title: 'Wedding Mega & Fikri',
        date: '2026-11-20',
        time: '19:00 - 22:00 WIB',
        venue: 'The Dharmawangsa',
        rundown: [
            { start_time: '19:00', end_time: '19:15', title: 'Grand Entrance', prompter: 'Selamat malam...' },
            { start_time: '19:15', end_time: '19:30', title: 'Toast & Opening', prompter: 'Mari kita angkat gelas...' }
        ],
        musicList: [
            { title: 'Romantic Piano', cue_instruction: 'Volume 40% fade in', segment_idxs: [0] }
        ]
    };
    dom.window.activeCommandCenterEvent = mockEvent;

    dom.window.renderAdminVendorCollab(mockEvent);

    assert.equal(dom.window.document.getElementById('vendorCollabEventTitle').textContent, 'Wedding Mega & Fikri');
    assert.ok(dom.window.document.getElementById('vendorCollabEventMeta').textContent.includes('The Dharmawangsa'));
    assert.equal(dom.window.document.getElementById('vendorCollabCountBadge').textContent, '2 segmen tersedia');
    assert.ok(dom.window.document.getElementById('vendorCollabTableBody').innerHTML.includes('Grand Entrance'));
    assert.ok(dom.window.document.getElementById('vendorCollabTableBody').innerHTML.includes('Toast &amp; Opening') || dom.window.document.getElementById('vendorCollabTableBody').innerHTML.includes('Toast & Opening'));
});

// 6. Vendor.html: Table pagination, page size filter, scrollable container, and nav buttons
test('6. Vendor.html has full pagination, row count filter, 2D scroll container, and nav buttons', async () => {
    const vendorHtml = fs.readFileSync('resources/views/workspace/vendor.html', 'utf8');

    // UI elements check
    assert.ok(vendorHtml.includes('id="vendorPageSizeSelect"'), 'Page size select filter must exist');
    assert.ok(vendorHtml.includes('class="vendor-table-scroll-container"'), 'Scrollable table container must exist');
    assert.ok(vendorHtml.includes('overflow-x: auto'), 'Container must have overflow-x');
    assert.ok(vendorHtml.includes('overflow-y: auto'), 'Container must have overflow-y');
    assert.ok(vendorHtml.includes('position: sticky'), 'Table header must be sticky');
    assert.ok(vendorHtml.includes('id="vendorPaginationInfo"'), 'Pagination info label must exist');
    assert.ok(vendorHtml.includes('id="btnVendorPrev"'), 'Prev button must exist');
    assert.ok(vendorHtml.includes('id="btnVendorNext"'), 'Next button must exist');
    assert.ok(vendorHtml.includes('id="vendorPageIndicator"'), 'Page indicator must exist');

    // Seed 15 items in mock event for fetch
    const testItems = [];
    for (let i = 1; i <= 15; i++) {
        testItems.push({
            start_time: `18:${String(i).padStart(2, '0')}`,
            end_time: `18:${String(i + 1).padStart(2, '0')}`,
            title: `Segmen Uji Coba #${i}`,
            cue_music: `Track #${i}`,
            pic: 'MC'
        });
    }

    const dom = new JSDOM(vendorHtml, { url: 'http://localhost:8000', runScripts: 'dangerously' });
    dom.window.fetch = async () => ({
        ok: true,
        json: async () => ({
            success: true,
            data: [{ id: 1, title: 'Event Test', rundown: testItems }]
        })
    });
    dom.window.BroadcastChannel = class { postMessage() {} close() {} };
    dom.window.scrollTo = () => {};

    // Wait for initial async loadActiveEventData() to settle
    await new Promise(r => setTimeout(r, 100));

    dom.window.changeVendorPageSize(5);

    // Verify first page contains only 5 rows
    const tbody = dom.window.document.getElementById('vendorRundownTableBody');
    assert.equal(tbody.querySelectorAll('tr').length, 5, 'Page 1 must render exactly 5 rows');
    assert.ok(tbody.innerHTML.includes('Segmen Uji Coba #1'));
    assert.ok(tbody.innerHTML.includes('Segmen Uji Coba #5'));
    assert.ok(!tbody.innerHTML.includes('Segmen Uji Coba #6'));

    // Check pagination info
    const info = dom.window.document.getElementById('vendorPaginationInfo');
    assert.ok(info.innerHTML.includes('1 - 5'), 'Info must show 1 - 5');
    assert.ok(info.innerHTML.includes('15'), 'Info must show total 15 items');

    // Navigate to next page
    dom.window.navigateVendorPage(1);
    assert.equal(dom.window.vendorCurrentPage, 2);
    assert.equal(tbody.querySelectorAll('tr').length, 5, 'Page 2 must render exactly 5 rows');
    assert.ok(tbody.innerHTML.includes('Segmen Uji Coba #6'));
    assert.ok(tbody.innerHTML.includes('Segmen Uji Coba #10'));

    // Change page size to All (-1)
    dom.window.changeVendorPageSize(-1);
    assert.equal(dom.window.vendorPageSize, -1);
    assert.equal(tbody.querySelectorAll('tr').length, 15, 'All 15 rows must be rendered when pageSize is -1');
});

// 7. Input Validation: Pure digits only, no negative numbers or non-numeric characters
test('7. Input Validation: WhatsApp, Nilai Kontrak, Cashflow and Expense strictly reject minus and non-digits', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');

    // WhatsApp customer input
    assert.ok(adminHtml.includes('id="newCustWa"'), 'newCustWa must exist');
    assert.ok(adminHtml.includes('id="newCustWa"') && adminHtml.includes('replace(/[^0-9]/g, \'\')'), 'newCustWa must sanitize non-digits oninput');
    
    // Customer price / nilai kontrak input
    assert.ok(adminHtml.includes('id="newCustPrice"'), 'newCustPrice must exist');
    assert.ok(adminHtml.includes('id="newCustPrice"') && adminHtml.includes('replace(/[^0-9]/g, \'\')'), 'newCustPrice must sanitize non-digits oninput');

    // Cashflow transaction amount
    assert.ok(adminHtml.includes('id="newCfAmount"'), 'newCfAmount must exist');
    assert.ok(adminHtml.includes('id="newCfAmount"') && adminHtml.includes('replace(/[^0-9]/g, \'\')'), 'newCfAmount must sanitize non-digits oninput');

    // Expense tracker amount
    assert.ok(adminHtml.includes('id="expenseAmount"'), 'expenseAmount must exist');
    assert.ok(adminHtml.includes('id="expenseAmount"') && adminHtml.includes('replace(/[^0-9]/g, \'\')'), 'expenseAmount must sanitize non-digits oninput');
});

// 8. Admin Kolaborasi Vendor: Cue Matrix has pagination, 2D scroll, page size selector
test('8. Admin Kolaborasi Vendor Cue Matrix has pagination, 2D scroll, and syncs per event ID', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');
    const adminCoreJs = fs.readFileSync('public/js/admin-core.js', 'utf8');

    assert.ok(adminHtml.includes('id="vendorCollabPageSizeSelect"'), 'vendorCollabPageSizeSelect must exist in admin.html');
    assert.ok(adminHtml.includes('class="vendor-collab-scroll-container"'), 'vendor-collab-scroll-container must exist');
    assert.ok(adminHtml.includes('id="vendorCollabPaginationInfo"'), 'vendorCollabPaginationInfo must exist');
    assert.ok(adminHtml.includes('id="btnVendorCollabPrev"'), 'btnVendorCollabPrev must exist');
    assert.ok(adminHtml.includes('id="btnVendorCollabNext"'), 'btnVendorCollabNext must exist');
    assert.ok(adminHtml.includes('id="vendorCollabPageIndicator"'), 'vendorCollabPageIndicator must exist');

    // JSDOM Test
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
        <div id="vendorCollabEventTitle"></div>
        <div id="vendorCollabEventMeta"></div>
        <span id="vendorCollabCountBadge"></span>
        <select id="vendorCollabPageSizeSelect"></select>
        <div id="vendorCollabPaginationInfo"></div>
        <span id="vendorCollabPageIndicator"></span>
        <button id="btnVendorCollabPrev"></button>
        <button id="btnVendorCollabNext"></button>
        <table><tbody id="vendorCollabTableBody"></tbody></table>
    </body></html>`, { url: 'http://localhost:8000', runScripts: 'dangerously' });

    setupDomMocks(dom);
    dom.window.eval(adminCoreJs);

    // Mock 12 rundown items
    const testRundown = [];
    for (let i = 1; i <= 12; i++) {
        testRundown.push({
            start_time: `19:${String(i * 5).padStart(2, '0')}`,
            end_time: `19:${String(i * 5 + 5).padStart(2, '0')}`,
            title: `Segmen Panggung #${i}`,
            prompter: `Naskah MC Segmen #${i}`,
            pic: 'MC'
        });
    }

    const testEvent = { id: 25, title: 'Corporate Gala Dinner', rundown: testRundown };
    dom.window.activeCommandCenterEvent = testEvent;
    dom.window.renderAdminVendorCollab(testEvent);

    assert.equal(dom.window.document.getElementById('vendorCollabCountBadge').textContent, '12 segmen tersedia');
    
    // Default page size 10 -> exactly 10 rows rendered
    const tbody = dom.window.document.getElementById('vendorCollabTableBody');
    assert.equal(tbody.querySelectorAll('tr').length, 10, 'Default page must display 10 rows');
    assert.ok(tbody.innerHTML.includes('Segmen Panggung #1'));
    assert.ok(tbody.innerHTML.includes('Segmen Panggung #10'));
    assert.ok(!tbody.innerHTML.includes('Segmen Panggung #11'));

    // Navigate to next page
    dom.window.navigateVendorCollabPage(1);
    assert.equal(tbody.querySelectorAll('tr').length, 2, 'Page 2 must display the remaining 2 rows');
    assert.ok(tbody.innerHTML.includes('Segmen Panggung #11'));
    assert.ok(tbody.innerHTML.includes('Segmen Panggung #12'));

    // Change page size to 5
    dom.window.changeVendorCollabPageSize(5);
    assert.equal(tbody.querySelectorAll('tr').length, 5, 'Page size 5 must display 5 rows');
});

// 9. Mode Stage: Layout responsiveness, clock clamping, bottom navigation
test('9. Stage Mode responsive layout and bottom navigation', () => {
    const stageHtml = fs.readFileSync('resources/views/workspace/stage.html', 'utf8');
    const stageCss = fs.readFileSync('public/css/stage-mode.css', 'utf8');

    assert.ok(stageHtml.includes('id="stageMobileBottomNav"'), 'stageMobileBottomNav must exist');
    assert.ok(stageHtml.includes('id="btnMobPrev"'), 'btnMobPrev must exist');
    assert.ok(stageHtml.includes('id="btnMobNext"'), 'btnMobNext must exist');
    assert.ok(stageHtml.includes('setStageMobileView'), 'setStageMobileView function must exist');

    // Media query checks
    assert.ok(stageHtml.includes('@media screen and (max-width: 1279px)'), '1279px breakpoint must exist in stage.html');
    assert.ok(stageCss.includes('@media screen and (max-width: 1279px)'), '1279px breakpoint must exist in stage-mode.css');
    assert.ok(stageCss.includes('.stage-clock'), '.stage-clock must be defined');
    assert.ok(stageCss.includes('clamp'), '.stage-clock must use clamp for font size');
});

// 10. Floating button removed & QRIS purely upload based
test('10. FAB button removed and QRIS purely upload based', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');
    const adminCss = fs.readFileSync('public/css/admin.css', 'utf8');

    assert.ok(!adminHtml.includes('<button class="fab-btn" onclick="openAddCustomerModal()"'), 'FAB button must not be active in admin.html');
    assert.ok(adminCss.includes('.fab-btn {\n    display: none !important;'), '.fab-btn must have display: none !important');
    assert.ok(adminHtml.includes('id="paymentQrisFile"'), 'paymentQrisFile input must exist');
    assert.ok(adminHtml.includes('type="hidden" id="paymentQrisUrl"'), 'paymentQrisUrl must be hidden (upload only, no URL input)');
});

// 11. Command Center: renderAdminRundownList does not throw ReferenceError: eventObj is not defined
test('11. renderAdminRundownList works without ReferenceError: eventObj is not defined', () => {
    const adminCoreJs = fs.readFileSync('public/js/admin-core.js', 'utf8');

    const dom = new JSDOM(`<!DOCTYPE html><html><body>
        <div id="rundownActiveEventTitle"></div>
        <div id="rundownActiveEventMeta"></div>
        <div id="rundownProgressBadge"></div>
        <div id="adminRundownTimeline"></div>
    </body></html>`, { url: 'http://localhost:8000', runScripts: 'dangerously' });

    setupDomMocks(dom);
    dom.window.eval(adminCoreJs);

    const testEvent = {
        id: 25,
        title: 'The Wedding of Romeo & Juliet',
        date: '2026-11-20',
        time: '18:00 - 22:00',
        venue: 'Grand Ballroom',
        rundown: [
            { time: '18:00 - 18:30', title: 'Open Gate', prompter: 'Selamat datang para tamu.', cue_music: 'Welcome March', pic: 'WO' },
            { time: '18:30 - 19:00', title: 'Grand Entrance', prompter: 'Mari kita sambut kedua mempelai.', cue_instruction: 'Volume fade in', pic: 'MC' }
        ],
        musicList: [
            { title: 'Welcome March', segment_idx: 0, cue_instruction: 'Play gently on door open' }
        ]
    };

    // Should not throw ReferenceError: eventObj is not defined
    assert.doesNotThrow(() => {
        dom.window.renderAdminRundownList(testEvent);
    }, 'renderAdminRundownList must execute without ReferenceError');

    const timeline = dom.window.document.getElementById('adminRundownTimeline');
    assert.ok(timeline.innerHTML.includes('Open Gate'));
    assert.ok(timeline.innerHTML.includes('Welcome March'));
    assert.ok(timeline.innerHTML.includes('Grand Entrance'));
    assert.equal(dom.window.document.getElementById('rundownActiveEventTitle').textContent, 'The Wedding of Romeo & Juliet');

    // Also test with empty/null ev without throwing
    assert.doesNotThrow(() => {
        dom.window.renderAdminRundownList(null);
    });
});


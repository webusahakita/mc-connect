import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

function createMockDom() {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
        <div id="dashWelcomeName">Arkanza Radja Maulana</div>
        <div id="ccWaAutomationList"></div>
        <div id="sidebarMcName">Arkanza Radja Maulana</div>
    </body></html>`, { 
        url: 'http://localhost:8000',
        runScripts: "dangerously" 
    });

    dom.window.fetch = async () => ({
        ok: true,
        json: async () => ({ success: true, token: 'mock-token', data: [] })
    });
    dom.window.BroadcastChannel = class {
        postMessage() {}
        close() {}
    };

    return dom;
}

test('1. Post-Event Review feature is completely removed from admin.html and workspace view', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');
    
    // Check tab button
    assert.ok(!adminHtml.includes('data-tab="tab-review"'), 'tab-review button must not exist');
    assert.ok(!adminHtml.includes('Post-Event Review</span>'), 'Post-Event Review text in button must not exist');
    
    // Check tab panel
    assert.ok(!adminHtml.includes('id="tab-review"'), 'tab-review container must not exist');
    assert.ok(!adminHtml.includes('id="postEventReviewTemplate"'), 'postEventReviewTemplate textarea must not exist');
    assert.ok(!adminHtml.includes('⭐ Review Harvester via WhatsApp'), 'Review Harvester card must not exist');
});

test('2. WhatsApp Automation Gateway helper extracts client info and cleans phone numbers correctly', async () => {
    const adminCoreJs = fs.readFileSync('public/js/admin-core.js', 'utf8');
    const dom = createMockDom();

    dom.window.sessionStorage.setItem('mc_auth_user', JSON.stringify({ name: 'Arkanza Radja Maulana', nama_panggung: 'Arkanza Radja Maulana' }));
    dom.window.eval(adminCoreJs);

    // Test getEventClientInfo with format "Tes7 (09876789876543)"
    const ev1 = { id: 101, title: 'Wedding Natasha & Dimas', pic: 'Tes7 (09876789876543)' };
    const clientInfo1 = dom.window.getEventClientInfo(ev1);
    assert.equal(clientInfo1.name, 'Tes7');
    assert.equal(clientInfo1.phone, '09876789876543');
    assert.equal(clientInfo1.cleanPhone, '629876789876543');

    // Test getActiveMcName
    const mcName = dom.window.getActiveMcName();
    assert.equal(mcName, 'Arkanza Radja Maulana');
});

test('3. WhatsApp message template dynamically injects active MC name and client details', async () => {
    const adminCoreJs = fs.readFileSync('public/js/admin-core.js', 'utf8');
    const dom = createMockDom();

    dom.window.eval(adminCoreJs);

    const ev = { id: 202, title: 'Gala Premiere Movie Night', pic: 'Citra (081234567890)' };
    dom.window.activeCommandCenterEvent = ev;
    dom.window.currentWaTemplates = [
        {
            id: 't1',
            title: 'Sapaan Awal',
            body: 'Halo Kak {name}, salam hangat dari Vanya Arsyad (Master of Ceremony).\n\nTerkait persiapan acara "{event}"...'
        }
    ];

    dom.window.renderCcWaAutomationList();
    
    const container = dom.window.document.getElementById('ccWaAutomationList');
    assert.ok(container.innerHTML.includes('Sapaan Awal'));
    // Must contain actual MC name and NOT Vanya Arsyad
    assert.ok(container.innerHTML.includes('Arkanza Radja Maulana'), 'Template preview must include actual MC name');
    assert.ok(!container.innerHTML.includes('Vanya Arsyad'), 'Template preview must NOT contain hardcoded Vanya Arsyad');
    assert.ok(container.innerHTML.includes('Citra'), 'Template preview must include client name Citra');
});

test('4. sendWaTemplate produces direct WhatsApp URL with custom edited message and no template re-prompt', async () => {
    const adminCoreJs = fs.readFileSync('public/js/admin-core.js', 'utf8');
    const dom = createMockDom();

    let openedUrl = null;
    dom.window.open = (url) => {
        openedUrl = url;
    };

    // Mock uiCustomForm that simulates admin editing the text and clicking OK
    let customFormFields = null;
    dom.window.uiCustomForm = async (fields, title) => {
        customFormFields = fields;
        // Verify that only the message field is present (no phone field)
        return {
            message: fields[0].value + '\n\n[EDITED BY ADMIN]: Rundown terlampir.'
        };
    };

    dom.window.eval(adminCoreJs);

    const ev = { id: 303, title: 'Corporate Annual Meeting', pic: 'Budi (08567891234)' };
    dom.window.activeCommandCenterEvent = ev;

    const templateBody = 'Halo Kak {name}, terkait acara "{event}" dari {mc_name}.';
    await dom.window.sendWaTemplate(encodeURIComponent(templateBody));

    // Verify modal fields: must only have 1 field for message, NO phone field!
    assert.equal(customFormFields.length, 1, 'Modal must only contain 1 field (the message)');
    assert.equal(customFormFields[0].id, 'message', 'Field must be message');
    assert.ok(customFormFields[0].label.includes('Budi'), 'Label must display recipient name');
    assert.ok(customFormFields[0].label.includes('08567891234'), 'Label must display recipient phone');

    // Verify direct WhatsApp URL
    assert.ok(openedUrl, 'WhatsApp URL must be opened');
    assert.ok(openedUrl.startsWith('https://api.whatsapp.com/send?phone=628567891234&text='), 'Phone number must be clean and formatted');
    assert.ok(openedUrl.includes('%5BEDITED%20BY%20ADMIN%5D'), 'URL must encode the exact edited message');
    assert.ok(openedUrl.includes('Arkanza%20Radja%20Maulana'), 'URL must contain MC name');
});

test('5. Change password UI exists with security meter in admin layout', () => {
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');
    assert.ok(adminHtml.includes('id="web-security"'), 'Security tab pane must exist');
    assert.ok(adminHtml.includes('id="currPassword"'), 'Current password input must exist');
    assert.ok(adminHtml.includes('id="newPassword"'), 'New password input must exist');
    assert.ok(adminHtml.includes('id="confirmPassword"'), 'Confirm password input must exist');
    assert.ok(adminHtml.includes('id="passStrengthContainer"'), 'Password strength meter must exist');
    assert.ok(adminHtml.includes('id="btnSubmitChangePassword"'), 'Submit button must exist');
});

test('6. Mobile responsive classes and styles are configured properly', () => {
    const adminCss = fs.readFileSync('public/css/admin.css', 'utf8');
    assert.ok(adminCss.includes('.calendar-grid-container'), 'Calendar grid scrollable container must be styled');
    assert.ok(adminCss.includes('min-width: 500px'), 'Calendar grid must maintain min-width for responsive horizontal scrolling');
    assert.ok(adminCss.includes('.filter-tabs-scrollable'), 'Filter tabs scrollable class must exist');
    assert.ok(adminCss.includes('overflow-x: auto'), 'Scrollable elements must have overflow-x auto');
    assert.ok(adminCss.includes('.presskit-actions-bar'), 'Presskit actions bar responsive class must exist');
});

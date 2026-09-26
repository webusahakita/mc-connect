// Unit test for WhatsApp Automation Gateway logic
const fs = require('fs');
const path = require('path');

// Read admin-core.js
const adminCoreCode = fs.readFileSync(path.join(__dirname, '../../public/js/admin-core.js'), 'utf8');

// Mock browser globals
let lastOpenedUrl = null;
let toastMessage = null;
const mockLocalStorage = {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, val) { this._data[key] = String(val); }
};

const domElements = {
    waModalTitle: { textContent: '' },
    waModalEventTitle: { textContent: '' },
    waModalClientName: { textContent: '' },
    waModalClientPhone: { textContent: '' },
    waModalMessageText: { value: '' },
    waAutomationModal: { classList: { add(c) { this[c] = true; }, remove(c) { this[c] = false; } } },
    postEventReviewTemplate: { value: '' },
    tabReviewSubtitle: { textContent: '' }
};

const windowMock = {
    open(url, target) {
        lastOpenedUrl = url;
    },
    localStorage: mockLocalStorage,
    document: {
        getElementById(id) {
            return domElements[id] || null;
        }
    }
};

const documentMock = windowMock.document;

function showToast(msg) {
    toastMessage = msg;
}

// Evaluate helper functions from admin-core in sandbox context
const testContext = {
    window: windowMock,
    document: documentMock,
    localStorage: mockLocalStorage,
    showToast,
    console,
    Math,
    Number,
    String,
    JSON,
    encodeURIComponent,
    adminEventsDb: [
        {
            id: 1,
            title: "Wedding Reception Farhan & Natasha",
            date: "2026-09-18",
            time: "19:00 - 22:00 WIB",
            venue: "Grand Ballroom Hotel Mulia Senayan, Jakarta",
            pic: "Natasha Hendrawan (081122334455)",
            status: "Terkunci",
            package: "Gold Luxury Wedding Package",
            rawPrice: 12500000,
            customerId: 1
        },
        {
            id: 2,
            title: "Fintech Innovations Summit 2026",
            date: "2026-10-05",
            time: "09:00 - 16:00 WIB",
            venue: "Indonesia Convention Exhibition (ICE) BSD",
            pic: "Bambang Wijaya (081299887766)",
            status: "Tentative",
            package: "Platinum Royal & Hybrid Festival",
            rawPrice: 16000000,
            customerId: 2
        }
    ],
    activeCommandCenterEventId: 1
};

const vm = require('vm');
vm.createContext(testContext);

// Execute relevant portions of admin-core.js in testContext
vm.runInContext(adminCoreCode, testContext);

console.log('=== TEST 1: formatWaPhoneNumber ===');
const testNumbers = [
    { in: '081122334455', expected: '6281122334455' },
    { in: '+62 812-9988-7766', expected: '6281299887766' },
    { in: '6281311223344', expected: '6281311223344' },
    { in: '0857-1234-5678', expected: '6285712345678' }
];

let allPassed = true;
for (const t of testNumbers) {
    const res = testContext.formatWaPhoneNumber(t.in);
    const pass = res === t.expected;
    console.log(`Input: ${t.in} -> Output: ${res} (Expected: ${t.expected}) [${pass ? 'PASS' : 'FAIL'}]`);
    if (!pass) allPassed = false;
}

console.log('\n=== TEST 2: getWaAutomationData for all 4 templates ===');
const types = ['confirm', 'dp', 'settlement', 'review'];
for (const type of types) {
    const data = testContext.getWaAutomationData(type);
    console.log(`Type: ${type}`);
    console.log(`  Client: ${data.clientName}`);
    console.log(`  Phone: ${data.cleanPhone}`);
    console.log(`  Title: ${data.templateTitle}`);
    console.log(`  Message Length: ${data.messageText.length} chars`);
    console.log(`  WA URL: ${data.waUrl.substring(0, 70)}...`);
    const valid = data.waUrl.startsWith('https://wa.me/6281122334455?text=') && data.messageText.length > 50;
    console.log(`  Valid: [${valid ? 'PASS' : 'FAIL'}]`);
    if (!valid) allPassed = false;
}

console.log('\n=== TEST 3: Direct sendWaAutomation() execution ===');
testContext.sendWaAutomation('confirm');
console.log(`Last Opened URL: ${lastOpenedUrl ? lastOpenedUrl.substring(0, 60) : 'null'}...`);
const test3Pass = lastOpenedUrl && lastOpenedUrl.startsWith('https://wa.me/6281122334455?text=');
console.log(`Direct send result: [${test3Pass ? 'PASS' : 'FAIL'}]`);
if (!test3Pass) allPassed = false;

console.log('\n=== TEST 4: simulateWa backward compatibility ===');
lastOpenedUrl = null;
testContext.simulateWa('dp');
const test4Pass = lastOpenedUrl && lastOpenedUrl.startsWith('https://wa.me/6281122334455?text=');
console.log(`simulateWa result: [${test4Pass ? 'PASS' : 'FAIL'}]`);
if (!test4Pass) allPassed = false;

console.log('\n=== TEST 5: Modal openWaPreviewModal & sendFromWaModal ===');
testContext.openWaPreviewModal('settlement');
console.log(`Modal Title: ${domElements.waModalTitle.textContent}`);
console.log(`Modal Client Phone: ${domElements.waModalClientPhone.textContent}`);
console.log(`Modal Message Text: ${domElements.waModalMessageText.value.substring(0, 40)}...`);
const test5Pass = domElements.waAutomationModal.active && domElements.waModalMessageText.value.includes('pelunasan');
console.log(`openWaPreviewModal result: [${test5Pass ? 'PASS' : 'FAIL'}]`);
if (!test5Pass) allPassed = false;

// Test sending edited message from modal
domElements.waModalMessageText.value = 'Halo Kak Natasha, ini naskah kustom yang diedit admin.';
lastOpenedUrl = null;
testContext.sendFromWaModal();
const test6Pass = lastOpenedUrl && lastOpenedUrl.includes(encodeURIComponent('naskah kustom yang diedit admin'));
console.log(`sendFromWaModal result: [${test6Pass ? 'PASS' : 'FAIL'}]`);
if (!test6Pass) allPassed = false;

console.log('\n=== TEST 6: Event Switching in Command Center updates WA context ===');
testContext.activeCommandCenterEventId = 2;
const event2Data = testContext.getWaAutomationData('confirm');
console.log(`Event 2 Client: ${event2Data.clientName}`);
console.log(`Event 2 Phone: ${event2Data.cleanPhone}`);
console.log(`Event 2 Title: ${event2Data.eventTitle}`);
const test7Pass = event2Data.cleanPhone === '6281299887766' && event2Data.eventTitle.includes('Fintech');
console.log(`Event 2 switch result: [${test7Pass ? 'PASS' : 'FAIL'}]`);
if (!test7Pass) allPassed = false;

console.log('\nOVERALL RESULT: ' + (allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'));
if (!allPassed) process.exit(1);

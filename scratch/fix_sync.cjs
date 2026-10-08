const fs = require('fs');
let adminCore = fs.readFileSync('public/js/admin-core.js', 'utf8');

// 1. Update syncEventMetadata payload
const syncMetadataRegex = /const payload = \{\s*metadata: \{\s*checklist: ev\.checklist \|\| \[\],\s*expenses: ev\.expenses \|\| \[\],\s*vipNotes: ev\.vipNotes \|\| '',\s*vipProtocol: ev\.vipProtocol \|\| \[\],\s*invoice_items: ev\.invoiceItems \|\| null,\s*wardrobeIds: ev\.wardrobeIds \|\| \[\]\s*\}\s*\};/g;

const newPayload = `const payload = {
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
        };`;

adminCore = adminCore.replace(syncMetadataRegex, newPayload);

// 2. Overwrite the disabled pushEventsToServer to actually sync the current event
const pushDisabledRegex = /async function pushEventsToServer\(\) \{\s*\/\/ Disabled per user request: data lokal tidak boleh menimpa server secara massal\s*console\.log\('\[Sync\] pushEventsToServer disabled\.'\);\s*\}/g;

const newPush = `async function pushEventsToServer() {
    let ev = _getEv();
    if (ev && typeof window.syncEventMetadata === 'function') {
        await window.syncEventMetadata(ev);
        console.log('[Sync] Event metadata synced via fallback pushEventsToServer.');
    } else {
        console.log('[Sync] pushEventsToServer fallback failed: No event selected.');
    }
}`;

adminCore = adminCore.replace(pushDisabledRegex, newPush);

// Also make sure window.syncEngine uses this if it exists
const injectSyncEngine = `
if (!window.syncEngine) {
    window.syncEngine = { pushEventsToServer: pushEventsToServer };
} else {
    window.syncEngine.pushEventsToServer = pushEventsToServer;
}
`;
adminCore += injectSyncEngine;

fs.writeFileSync('public/js/admin-core.js', adminCore, 'utf8');
console.log('Fixed sync payload and pushEventsToServer.');

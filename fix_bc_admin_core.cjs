const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Also fix in orig
let codeOrig = fs.readFileSync('scratch/admin-core.orig.js', 'utf8');

const newBc = `try {
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
}`;

// regex to find the block
const regex = /if \(typeof BroadcastChannel !== 'undefined'\) \{[\s\S]*?console\.warn\('\[SyncChannel\] BroadcastChannel is not supported in this environment\.'\);\s*\}/;

if (regex.test(code)) {
    code = code.replace(regex, newBc);
    fs.writeFileSync('public/js/admin-core.js', code);
    console.log("Patched admin-core.js");
} else {
    console.log("Not found in admin-core.js");
}

if (regex.test(codeOrig)) {
    codeOrig = codeOrig.replace(regex, newBc);
    fs.writeFileSync('scratch/admin-core.orig.js', codeOrig);
    console.log("Patched admin-core.orig.js");
} else {
    console.log("Not found in admin-core.orig.js");
}

const fs = require('fs');
let code = fs.readFileSync('scratch/admin-core.orig.js', 'utf8');
const search = "window.syncChannel = new BroadcastChannel('mc_sync_channel');";
if (code.includes(search)) {
    const newLines = [
        "if (typeof BroadcastChannel !== 'undefined') {",
        "    window.syncChannel = new BroadcastChannel('mc_sync_channel');",
        "    window.syncChannel.onmessage = (event) => {",
        "        if (event.data === 'RELOAD_CALENDAR') {",
        "            console.log('[SyncChannel] Sinyal update diterima, me-reload database calendar...');",
        "            if (typeof loadUnifiedEventsDatabase === 'function') {",
        "                loadUnifiedEventsDatabase();",
        "            }",
        "        }",
        "    };",
        "} else {",
        "    window.syncChannel = { postMessage: function(){} };",
        "    console.warn('[SyncChannel] BroadcastChannel is not supported in this environment.');",
        "}"
    ].join('\n');
    
    const before = code.substring(0, code.indexOf(search));
    let after = code.substring(code.indexOf(search));
    after = after.substring(after.indexOf("};") + 2);
    code = before + newLines + after;
    
    fs.writeFileSync('scratch/admin-core.orig.js', code);
    console.log("Patched admin-core.orig.js");
}

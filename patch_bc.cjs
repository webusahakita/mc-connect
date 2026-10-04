const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

// The original lines
const originalLines = [
    "window.syncChannel = new BroadcastChannel('mc_sync_channel');",
    "window.syncChannel.onmessage = (event) => {",
    "    if (event.data === 'RELOAD_CALENDAR') {",
    "        console.log('[SyncChannel] Sinyal update diterima, me-reload database calendar...');",
    "        if (typeof loadUnifiedEventsDatabase === 'function') {",
    "            loadUnifiedEventsDatabase();",
    "        }",
    "    }",
    "};"
].join('\n');

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

// Find the index of the first line
const firstLine = "window.syncChannel = new BroadcastChannel('mc_sync_channel');";
if (code.includes(firstLine)) {
    code = code.replace(originalLines, newLines);
    // If the exact multiline block failed, we replace it using a regex or simple split
    if (code.includes(firstLine)) {
        // Fallback replacement if whitespace differs
        const before = code.substring(0, code.indexOf(firstLine));
        let after = code.substring(code.indexOf(firstLine));
        after = after.substring(after.indexOf("};") + 2);
        code = before + newLines + after;
    }
    fs.writeFileSync('public/js/admin-core.js', code);
    console.log("Successfully patched admin-core.js");
} else {
    console.log("Could not find the target code block");
}

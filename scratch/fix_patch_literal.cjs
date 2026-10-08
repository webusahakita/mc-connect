const fs = require('fs');

let patchStr = fs.readFileSync('scratch/music_patch.js', 'utf8');

// Fix specific mojibake strings
patchStr = patchStr.replace(/âž¡ï¸/g, '➡️');
patchStr = patchStr.replace(/âœ ï¸/g, '✏️');
patchStr = patchStr.replace(/ðŸ—‘ï¸/g, '🗑️');

let adminCore = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Fix the _setEv bug in admin-core.js
adminCore = adminCore.replace(
    "    _setEv(ev);\n    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();", 
    "    // _setEv(ev);\n    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();"
);

// Fix the _setEv bug in patchStr as well
patchStr = patchStr.replace(
    "    _setEv(ev);\n    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();", 
    "    // _setEv(ev);\n    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();"
);

// Append the patch
adminCore += '\n' + patchStr;

fs.writeFileSync('public/js/admin-core.js', adminCore, 'utf8');
console.log('Fixed mojibake literally and appended patch!');

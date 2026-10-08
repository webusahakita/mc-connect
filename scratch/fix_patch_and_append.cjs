const fs = require('fs');

let patchContent = fs.readFileSync('scratch/music_patch.js');
let patchStr = patchContent.toString('utf-8');

// Check if double encoded
if (patchStr.includes('â') || patchStr.includes('ð')) {
    let fixedBuf = Buffer.from(patchStr, 'binary');
    patchStr = fixedBuf.toString('utf8');
    fs.writeFileSync('scratch/music_patch_fixed.js', patchStr, 'utf8');
} else {
    fs.writeFileSync('scratch/music_patch_fixed.js', patchStr, 'utf8');
}

// Read the fresh admin-core.js
let adminCore = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Also, we need to comment out `_setEv(ev);` in admin-core.js at line 4965
// Let's just do a string replace on it.
adminCore = adminCore.replace('    _setEv(ev);\n    if (typeof window.syncEngine !== \'undefined\' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();', '    // _setEv(ev);\n    if (typeof window.syncEngine !== \'undefined\' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();');

// In the patch, we also had a `_setEv(ev)` that was causing issues (around line 5954 after append).
// We should replace that one too.
patchStr = patchStr.replace('    _setEv(ev);\n    if (typeof window.syncEngine !== \'undefined\' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();', '    // _setEv(ev);\n    if (typeof window.syncEngine !== \'undefined\' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();');

// Append the fixed patch
adminCore += '\n' + patchStr;

fs.writeFileSync('public/js/admin-core.js', adminCore, 'utf8');
console.log('Fixed emojis and appended patch!');

const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

const regex = /metadata:\s*ev\.metadata\s*\|\|\s*\{\},\s*musicList:\s*Array\.isArray\(ev\.musicList\)\s*\?\s*ev\.musicList\s*:\s*\[\],\s*rundown:\s*Array\.isArray\(ev\.rundown\)\s*\?\s*ev\.rundown\s*:\s*\[\],/g;

const newMapping = `metadata: ev.metadata || {},
            musicList: (ev.metadata && Array.isArray(ev.metadata.music)) ? ev.metadata.music : (Array.isArray(ev.musicList) ? ev.musicList : []),
            soundboard: (ev.metadata && Array.isArray(ev.metadata.soundboard)) ? ev.metadata.soundboard : (Array.isArray(ev.soundboard) ? ev.soundboard : []),
            landingMusic: (ev.metadata && Array.isArray(ev.metadata.landingMusic)) ? ev.metadata.landingMusic : (Array.isArray(ev.landingMusic) ? ev.landingMusic : []),
            rundown: Array.isArray(ev.rundown) ? ev.rundown : [],`;

if (regex.test(code)) {
    code = code.replace(regex, newMapping);
    fs.writeFileSync('public/js/admin-core.js', code, 'utf8');
    console.log('Successfully patched loadUnifiedEventsDatabase mapping using Regex.');
} else {
    console.log('Regex did not match.');
}

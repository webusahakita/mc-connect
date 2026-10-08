const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

const targetOld = `            invoiceItems: ev.invoiceItems || null,
            metadata: ev.metadata || {},
            musicList: Array.isArray(ev.musicList) ? ev.musicList : [],
            rundown: Array.isArray(ev.rundown) ? ev.rundown : [],`;

const targetNew = `            invoiceItems: ev.invoiceItems || null,
            metadata: ev.metadata || {},
            musicList: (ev.metadata && Array.isArray(ev.metadata.music)) ? ev.metadata.music : (Array.isArray(ev.musicList) ? ev.musicList : []),
            soundboard: (ev.metadata && Array.isArray(ev.metadata.soundboard)) ? ev.metadata.soundboard : (Array.isArray(ev.soundboard) ? ev.soundboard : []),
            landingMusic: (ev.metadata && Array.isArray(ev.metadata.landingMusic)) ? ev.metadata.landingMusic : (Array.isArray(ev.landingMusic) ? ev.landingMusic : []),
            rundown: Array.isArray(ev.rundown) ? ev.rundown : [],`;

if (code.includes(targetOld)) {
    code = code.replace(targetOld, targetNew);
    fs.writeFileSync('public/js/admin-core.js', code, 'utf8');
    console.log('Successfully patched loadUnifiedEventsDatabase mapping.');
} else {
    console.log('Could not find the target mapping in loadUnifiedEventsDatabase.');
}

const fs = require('fs');
const path = 'c:\\Users\\Nawakara\\.gemini\\antigravity-ide\\scratch\\mc-connect\\public\\js\\admin-core.js';
let content = fs.readFileSync(path, 'utf8');

const regexSync = /window\.syncEventMetadata = async function\(ev\) \{[\s\S]*?wardrobeIds:\s*ev\.wardrobeIds\s*\|\|\s*\[\]\n\s*\}/;
const replacementSync = `window.syncEventMetadata = async function(ev) {
    if (!ev) return;
    try {
        const payload = {
            metadata: {
                checklist: ev.checklist || [],
                expenses: ev.expenses || [],
                vipNotes: ev.vipNotes || '',
                vipProtocol: ev.vipProtocol || [],
                invoice_items: ev.invoiceItems || null,
                wardrobeIds: ev.wardrobeIds || [],
                musicList: ev.musicList || [],
                landingMusic: ev.landingMusic || []
            }`;

content = content.replace(regexSync, replacementSync);

const regexSaveMusic = /ev\.metadata\.musicList\s*=\s*ev\.musicList;\n\s*if\s*\(typeof\s*window\.syncEngine\s*!==\s*'undefined'\s*&&\s*window\.syncEngine\.pushEventsToServer\)\s*window\.syncEngine\.pushEventsToServer\(\);/;
const replacementSaveMusic = `ev.metadata.musicList = ev.musicList;
    if (typeof window.syncEventMetadata === 'function') window.syncEventMetadata(ev);`;

content = content.replace(regexSaveMusic, replacementSaveMusic);

const regexDeleteMusic = /ev\.metadata\.musicList\s*=\s*ev\.musicList;\n\s*if\s*\(typeof\s*window\.syncEngine\s*!==\s*'undefined'\s*&&\s*window\.syncEngine\.pushEventsToServer\)\s*\{\n\s*window\.syncEngine\.pushEventsToServer\(\);\n\s*\}/;
const replacementDeleteMusic = `ev.metadata.musicList = ev.musicList;
    if (typeof window.syncEventMetadata === 'function') window.syncEventMetadata(ev);`;

content = content.replace(regexDeleteMusic, replacementDeleteMusic);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched syncEventMetadata and saveEventMusicForm successfully!");

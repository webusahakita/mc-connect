const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

const targetFunction = 'window.syncEventMetadata = async function(ev) {';
const startIdx = code.indexOf(targetFunction);
if (startIdx !== -1) {
    const endIdx = code.indexOf('function populateCommandCenterSelector()', startIdx);
    
    let newFunc = `window.syncEventMetadata = async function(ev) {
    if (!ev) return;
    try {
        const payload = {
            rundown: ev.rundown || [],
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
        };
        const actualId = ev.db_id || String(ev.id).replace('e_', '');
        await fetch('/api/cms/events/' + actualId, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: JSON.stringify(payload)
        });
        console.log('[Sync] Event metadata and rundown synced to server for event ID:', ev.id);
    } catch (err) {
        console.error("Gagal sync event metadata:", err);
    }
};

`;

    code = code.substring(0, startIdx) + newFunc + code.substring(endIdx);
    fs.writeFileSync('public/js/admin-core.js', code, 'utf8');
    console.log('Successfully patched syncEventMetadata to include rundown.');
} else {
    console.log('Could not find window.syncEventMetadata');
}

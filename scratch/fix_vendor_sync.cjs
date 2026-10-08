const fs = require('fs');

let code = fs.readFileSync('public/vendor.html', 'utf8');

// Patch populateEventSelector to NOT use localStorage
code = code.replace(/function populateEventSelector\(\) \{[\s\S]*?const sel = document\.getElementById\('vendorEventSelect'\);/g, `async function populateEventSelector() {
    let events = [];
    try {
        const res = await fetch('/api/cms/events');
        const json = await res.json();
        if (json.success && json.data) events = json.data;
    } catch(e) {
        console.error('Gagal fetch event dari server', e);
    }

    if (!events || events.length === 0) {
        events = [
            { id: 1, title: 'Menunggu koneksi server...', venue: '-' }
        ];
    }

    const sel = document.getElementById('vendorEventSelect');`);

// Patch playVendorCue to NOT use localStorage and USE vendorMusicList instead
code = code.replace(/let masterBank = \[\];\s*try \{\s*const rawBank = localStorage\.getItem\('mc_music_bank_data'\);\s*if \(rawBank\) masterBank = JSON\.parse\(rawBank\);\s*\} catch\(e\) \{\}\s*const musicItem = masterBank\.find\(m => m\.title === item\.cue_music\);/g, `
            const musicItem = vendorMusicList.find(m => m.title === item.cue_music || m.cue_instruction === item.cue_music);`);

fs.writeFileSync('public/vendor.html', code, 'utf8');
console.log('Successfully patched vendor.html');

const fs = require('fs');
const files = ['public/js/admin-core.js', 'scratch/admin-core.orig.js', 'scratch/music_patch.js'];
files.forEach(f => {
    try {
        let c = fs.readFileSync(f, 'utf8');
        if (!c.includes('// --- SYNC TO ALL EVENTS ---')) {
            const search = `    if (idxStr !== '') {
        bank[parseInt(idxStr)] = item;
        if (typeof window.showToast === 'function') window.showToast('Lagu berhasil diupdate!', 'green');`;
            const replace = `    if (idxStr !== '') {
        const oldItem = bank[parseInt(idxStr)];
        bank[parseInt(idxStr)] = item;

        // --- SYNC TO ALL EVENTS ---
        const allEventsRaw = localStorage.getItem('mc_events_data');
        if (allEventsRaw) {
            let allEvents = [];
            try { allEvents = JSON.parse(allEventsRaw); } catch(e){}
            let updatedAny = false;
            
            allEvents.forEach(ev => {
                if (ev.musicList && ev.musicList.length > 0) {
                    ev.musicList.forEach(m => {
                        if (m.title === oldItem.title && (m.artist || '') === (oldItem.artist || '')) {
                            m.title = item.title;
                            m.artist = item.artist;
                            m.url_link = item.url_link;
                            m.file_upload = item.file_upload;
                            updatedAny = true;
                        }
                    });
                }
            });
            
            if (updatedAny) {
                localStorage.setItem('mc_events_data', JSON.stringify(allEvents));
                if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) {
                    window.syncEngine.pushEventsToServer();
                }
                if (typeof _getEv === 'function') {
                    let currentEv = _getEv();
                    if (currentEv && currentEv.id) {
                        const matched = allEvents.find(e => e.id === currentEv.id);
                        if (matched && typeof _setEv === 'function') _setEv(matched);
                    }
                }
            }
        }
        // --------------------------

        if (typeof window.showToast === 'function') window.showToast('Lagu diupdate & disinkron ke seluruh acara!', 'green');`;
            
            if (c.includes(search)) {
                c = c.replace(search, replace);
                fs.writeFileSync(f, c);
                console.log('Patched ' + f);
            } else {
                console.log('Search string not found in ' + f);
            }
        }
    } catch(e) {
        console.log(e);
    }
});

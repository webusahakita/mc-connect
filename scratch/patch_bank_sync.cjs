const fs = require('fs');
const path = 'c:\\Users\\Nawakara\\.gemini\\antigravity-ide\\scratch\\mc-connect\\public\\js\\admin-core.js';
let content = fs.readFileSync(path, 'utf8');

const regexSync = /\/\/ --- SYNC TO ALL EVENTS ---[\s\S]*?\/\/ --------------------------/g;

const replacement = `// --- SYNC TO ALL EVENTS ---
        if (window.adminEventsDb && Array.isArray(window.adminEventsDb)) {
            let updatedAny = false;
            
            window.adminEventsDb.forEach(ev => {
                let evUpdated = false;
                if (ev.musicList && ev.musicList.length > 0) {
                    ev.musicList.forEach(m => {
                        if (m.title === oldItem.title && (m.artist || '') === (oldItem.artist || '')) {
                            m.title = item.title;
                            m.artist = item.artist;
                            m.url_link = item.url_link;
                            m.file_upload = item.file_upload;
                            evUpdated = true;
                            updatedAny = true;
                        }
                    });
                }
                
                if (evUpdated) {
                    ev.metadata = ev.metadata || {};
                    ev.metadata.musicList = ev.musicList;
                    if (typeof window.syncEventMetadata === 'function') {
                        window.syncEventMetadata(ev);
                    }
                }
            });
            
            if (updatedAny && typeof window.renderAdminMusicListWrapper === 'function' && typeof _getEv === 'function') {
                const cur = _getEv();
                if (cur) window.renderAdminMusicListWrapper(cur);
            }
        }
        // --------------------------`;

content = content.replace(regexSync, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched Master Bank sync logic to use API and in-memory events instead of local storage!");

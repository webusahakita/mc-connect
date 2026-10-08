const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

// 1. Inject syncMusicToRundown helper function
const helperFunc = `
window.syncMusicToRundown = function(ev) {
    if (!ev || !ev.rundown) return;
    // Bersihkan semua cue_music bawaan/dummy
    ev.rundown.forEach(r => r.cue_music = '');
    
    if (ev.musicList) {
        ev.musicList.forEach(m => {
            let idxs = Array.isArray(m.segment_idxs) ? m.segment_idxs : (m.segment_idx !== null && m.segment_idx !== undefined ? [m.segment_idx] : []);
            idxs.forEach(idx => {
                if (ev.rundown[idx]) {
                    // Jika ada lebih dari 1 lagu di segmen yg sama, gabungkan (meskipun idealnya 1 segmen 1 BGM utama)
                    if (ev.rundown[idx].cue_music) {
                        ev.rundown[idx].cue_music += ' & ' + m.title;
                    } else {
                        ev.rundown[idx].cue_music = m.title;
                    }
                }
            });
        });
    }
};
`;

if (!code.includes('window.syncMusicToRundown')) {
    code = code.replace('window.saveEventMusicForm = async function() {', helperFunc + '\nwindow.saveEventMusicForm = async function() {');
}

// 2. Patch saveEventMusicForm to prevent duplicates and use syncMusicToRundown
const saveFuncStart = code.indexOf('window.saveEventMusicForm = async function() {');
const saveFuncEnd = code.indexOf('window.deleteMusic =', saveFuncStart);
if (saveFuncStart !== -1) {
    let saveFunc = `window.saveEventMusicForm = async function() {
    const idxStr = document.getElementById('evmFormIdx').value;
    const bankIdxStr = document.getElementById('evmFormBankSelect').value;
    const cue_instruction = document.getElementById('evmFormCue').value.trim();
    
    const checkedBoxes = Array.from(document.querySelectorAll('.evm-segment-cb:checked'));
    const segment_idxs = checkedBoxes.map(cb => parseInt(cb.value));
    const segment_idx = segment_idxs.length > 0 ? segment_idxs[0] : null; 
    
    const category = document.getElementById('evmFormCategory').value;
    
    if (bankIdxStr === '') return window.uiAlert('Pilih lagu dari Master Bank terlebih dahulu!');
    
    let ev = _getEv();
    if (!ev) return;
    if (!ev.musicList) ev.musicList = [];
    
    const bank = window.getGlobalMusicBank();
    const selectedBankItem = bank[parseInt(bankIdxStr)];
    if (!selectedBankItem) return window.uiAlert('Lagu di Master Bank tidak ditemukan!');
    
    // Mencegah duplikasi lagu yang sama ditambahkan dua kali sebagai baris berbeda
    if (idxStr === '') {
        const isExist = ev.musicList.find(m => m.title === selectedBankItem.title);
        if (isExist) {
            return window.uiAlert('Lagu ini sudah ada di dalam daftar Playlist Acara. Silakan edit lagu yang sudah ada jika ingin mengubah segmennya.');
        }
    }
    
    const newItem = {
        id: (idxStr !== '') ? ev.musicList[parseInt(idxStr)].id : 'music_' + Date.now(),
        title: selectedBankItem.title,
        artist: selectedBankItem.artist,
        url_link: selectedBankItem.url_link,
        file_upload: selectedBankItem.file_upload,
        cue_instruction: cue_instruction,
        segment_idx: segment_idx,
        segment_idxs: segment_idxs,
        category: category
    };
    
    if (idxStr !== '') {
        ev.musicList[parseInt(idxStr)] = newItem;
    } else {
        ev.musicList.push(newItem);
    }
    
    // Sinkronisasi ulang secara menyeluruh
    window.syncMusicToRundown(ev);
    
    ev.metadata = ev.metadata || {};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList; 
    
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    
    document.getElementById('modalEventMusicForm').style.display = 'none';
    document.getElementById('modalEventMusicForm').classList.remove('active');
    
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
};

`;
    code = code.substring(0, saveFuncStart) + saveFunc + code.substring(saveFuncEnd);
}

// 3. Patch deleteMusic to use syncMusicToRundown
const deleteRegex = /window\.deleteMusic = async function\(index\) \{[\s\S]*?\};/g;
const newDelete = `window.deleteMusic = async function(index) {
    let ev = _getEv();
    if (!ev || !ev.musicList || !ev.musicList[index]) return;
    if (!(await window.uiConfirm(\`Hapus lagu: "\${ev.musicList[index].title}" dari playlist?\`))) return;
    
    ev.musicList.splice(index, 1);
    
    // Sinkronisasi ulang secara menyeluruh
    window.syncMusicToRundown(ev);
    
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList;
    
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
    
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};`;
code = code.replace(deleteRegex, newDelete);


// 4. Inject syncMusicToRundown when loading data to clear any lingering dummy data from the database
const loadDbRegex = /adminEventsDb = events\.map\(ev => \(\{[\s\S]*?created_at: ev\.created_at \|\| null\s*\}\)\);/g;
if (code.match(loadDbRegex)) {
    code = code.replace(loadDbRegex, (match) => {
        return match + `\n\n        // Bersihkan dan sinkronkan ulang seluruh rundown di lokal
        adminEventsDb.forEach(ev => {
            if(typeof window.syncMusicToRundown === 'function') window.syncMusicToRundown(ev);
        });`;
    });
}

fs.writeFileSync('public/js/admin-core.js', code, 'utf8');
console.log('Successfully patched sync logic and duplication protection.');

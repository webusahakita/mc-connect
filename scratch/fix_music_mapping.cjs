const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

const targetFunction = 'window.saveEventMusicForm = async function() {';
const startIdx = code.indexOf(targetFunction);
if (startIdx !== -1) {
    const endIdx = code.indexOf('window.deleteMusic =', startIdx);
    
    let newFunc = `window.saveEventMusicForm = async function() {
    const idxStr = document.getElementById('evmFormIdx').value;
    const bankIdxStr = document.getElementById('evmFormBankSelect').value;
    const cue_instruction = document.getElementById('evmFormCue').value.trim();
    const segment_idx = document.getElementById('evmFormSegment').value;
    const category = document.getElementById('evmFormCategory').value;
    
    if (bankIdxStr === '') return window.uiAlert('Pilih lagu dari Master Bank terlebih dahulu!');
    
    let ev = _getEv();
    if (!ev) return;
    if (!ev.musicList) ev.musicList = [];
    
    const bank = window.getGlobalMusicBank();
    const selectedBankItem = bank[parseInt(bankIdxStr)];
    if (!selectedBankItem) return window.uiAlert('Lagu di Master Bank tidak ditemukan!');
    
    const newItem = {
        id: (idxStr !== '') ? ev.musicList[parseInt(idxStr)].id : 'music_' + Date.now(),
        title: selectedBankItem.title,
        artist: selectedBankItem.artist,
        url_link: selectedBankItem.url_link,
        file_upload: selectedBankItem.file_upload,
        cue_instruction: cue_instruction,
        segment_idx: segment_idx !== '' ? parseInt(segment_idx) : null,
        category: category
    };
    
    // Check if modifying an existing mapped segment to remove the old mapping
    if (idxStr !== '') {
        const oldItem = ev.musicList[parseInt(idxStr)];
        if (oldItem.segment_idx !== null && oldItem.segment_idx !== undefined && oldItem.segment_idx !== newItem.segment_idx) {
            if (ev.rundown && ev.rundown[oldItem.segment_idx]) {
                ev.rundown[oldItem.segment_idx].cue_music = ''; // clear old mapping
            }
        }
        ev.musicList[parseInt(idxStr)] = newItem;
    } else {
        ev.musicList.push(newItem);
    }
    
    // Update the Rundown segment with the new mapping
    if (newItem.segment_idx !== null && ev.rundown && ev.rundown[newItem.segment_idx]) {
        ev.rundown[newItem.segment_idx].cue_music = newItem.title;
    }
    
    ev.metadata = ev.metadata || {};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList; // Sync top-level field just in case
    
    _setEv(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    
    document.getElementById('modalEventMusicForm').style.display = 'none';
    document.getElementById('modalEventMusicForm').classList.remove('active');
    
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    
    // Force re-render of rundown tab so we see the new cue text instantly
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
};

`;

    code = code.substring(0, startIdx) + newFunc + code.substring(endIdx);
    fs.writeFileSync('public/js/admin-core.js', code, 'utf8');
    console.log('Successfully patched saveEventMusicForm.');
} else {
    console.log('Could not find window.saveEventMusicForm');
}

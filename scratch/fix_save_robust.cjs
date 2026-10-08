const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

const regex = /window\.saveEventMusicForm = async function\(\) \{[\s\S]*?window\.deleteMusic = async function\(index\) \{[\s\S]*?\};/g;

const newLogic = `window.saveEventMusicForm = async function() {
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
        const oldItem = ev.musicList[parseInt(idxStr)];
        const oldIdxs = Array.isArray(oldItem.segment_idxs) ? oldItem.segment_idxs : (oldItem.segment_idx !== null && oldItem.segment_idx !== undefined ? [oldItem.segment_idx] : []);
        
        oldIdxs.forEach(oldIdx => {
            if (!segment_idxs.includes(oldIdx) && ev.rundown && ev.rundown[oldIdx]) {
                ev.rundown[oldIdx].cue_music = ''; 
            }
        });
        
        ev.musicList[parseInt(idxStr)] = newItem;
    } else {
        ev.musicList.push(newItem);
    }
    
    segment_idxs.forEach(idx => {
        if (ev.rundown && ev.rundown[idx]) {
            ev.rundown[idx].cue_music = newItem.title;
        }
    });
    
    ev.metadata = ev.metadata || {};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList; 
    
    _setEv(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    
    document.getElementById('modalEventMusicForm').style.display = 'none';
    document.getElementById('modalEventMusicForm').classList.remove('active');
    
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
};

window.deleteMusic = async function(index) {
    let ev = _getEv();
    if (!ev || !ev.musicList || !ev.musicList[index]) return;
    if (!(await window.uiConfirm(\`Hapus lagu: "\${ev.musicList[index].title}" dari playlist?\`))) return;
    
    const oldItem = ev.musicList[index];
    const oldIdxs = Array.isArray(oldItem.segment_idxs) ? oldItem.segment_idxs : (oldItem.segment_idx !== null && oldItem.segment_idx !== undefined ? [oldItem.segment_idx] : []);
    oldIdxs.forEach(oldIdx => {
        if (ev.rundown && ev.rundown[oldIdx]) ev.rundown[oldIdx].cue_music = '';
    });
    
    ev.musicList.splice(index, 1);
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList;
    
    _setEv(ev);
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
    
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};`;

if (regex.test(code)) {
    code = code.replace(regex, newLogic);
    fs.writeFileSync('public/js/admin-core.js', code, 'utf8');
    console.log('Successfully patched saveEventMusicForm and deleteMusic using Regex!');
} else {
    console.log('Regex failed to match saveEventMusicForm.');
}

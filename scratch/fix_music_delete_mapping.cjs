const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

const targetFunction = 'window.deleteMusic = async function(index) {';
const startIdx = code.indexOf(targetFunction);
if (startIdx !== -1) {
    const endIdx = code.indexOf('window.resetCurrentEventMusic =', startIdx);
    
    let newFunc = `window.deleteMusic = async function(index) {
    let ev = _getEv();
    if (!ev || !ev.musicList || !ev.musicList[index]) return;
    if (!(await window.uiConfirm(\`Hapus lagu: "\${ev.musicList[index].title}" dari playlist?\`))) return;
    
    // Check if it was mapped to a segment, and if so, clear the segment's cue_music
    const oldItem = ev.musicList[index];
    if (oldItem.segment_idx !== null && oldItem.segment_idx !== undefined && ev.rundown && ev.rundown[oldItem.segment_idx]) {
        ev.rundown[oldItem.segment_idx].cue_music = '';
    }
    
    ev.musicList.splice(index, 1);
    
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList;
    
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
    
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};

`;

    code = code.substring(0, startIdx) + newFunc + code.substring(endIdx);
    fs.writeFileSync('public/js/admin-core.js', code, 'utf8');
    console.log('Successfully patched deleteMusic.');
} else {
    console.log('Could not find window.deleteMusic');
}

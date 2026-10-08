const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

// 1. Update the modal HTML for evmFormSegment to support multiple selection
const targetModalOld = `<div class="form-group">
                    <label class="form-label">Terhubung ke Segmen Rundown</label>
                    <select class="form-select" id="evmFormSegment">
                        \${rundownOptions.map(opt => \`<option value="\${opt.value}" \${editItem && editItem.segment_idx == opt.value ? 'selected' : ''}>\${opt.label}</option>\`).join('')}
                    </select>
                </div>`;

const targetModalNew = `<div class="form-group">
                    <label class="form-label">Terhubung ke Segmen Rundown <span style="font-size:0.75rem; color:#888;">(Tahan CTRL untuk pilih banyak)</span></label>
                    <select multiple class="form-select" id="evmFormSegment" style="height: 150px;">
                        \${rundownOptions.map(opt => {
                            let isSelected = false;
                            if (editItem && Array.isArray(editItem.segment_idxs)) {
                                isSelected = editItem.segment_idxs.includes(parseInt(opt.value)) || editItem.segment_idxs.includes(opt.value);
                            } else if (editItem && editItem.segment_idx == opt.value) {
                                isSelected = true;
                            }
                            if (opt.value === '' && (!editItem || (editItem.segment_idx === null && (!editItem.segment_idxs || editItem.segment_idxs.length===0)))) {
                                isSelected = true;
                            }
                            return \`<option value="\${opt.value}" \${isSelected ? 'selected' : ''}>\${opt.label}</option>\`;
                        }).join('')}
                    </select>
                </div>`;
code = code.replace(targetModalOld, targetModalNew);

// 2. Update saveEventMusicForm to handle segment_idxs
const saveFuncStart = code.indexOf('window.saveEventMusicForm = async function() {');
const saveFuncEnd = code.indexOf('window.deleteMusic =', saveFuncStart);
if (saveFuncStart !== -1) {
    let saveFunc = `window.saveEventMusicForm = async function() {
    const idxStr = document.getElementById('evmFormIdx').value;
    const bankIdxStr = document.getElementById('evmFormBankSelect').value;
    const cue_instruction = document.getElementById('evmFormCue').value.trim();
    
    const segmentSelect = document.getElementById('evmFormSegment');
    const segment_idxs = Array.from(segmentSelect.selectedOptions).map(opt => opt.value).filter(v => v !== '').map(v => parseInt(v));
    const segment_idx = segment_idxs.length > 0 ? segment_idxs[0] : null; // Fallback for backward compatibility
    
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
    
    // Check if modifying an existing mapped segment to remove the old mapping
    if (idxStr !== '') {
        const oldItem = ev.musicList[parseInt(idxStr)];
        const oldIdxs = Array.isArray(oldItem.segment_idxs) ? oldItem.segment_idxs : (oldItem.segment_idx !== null && oldItem.segment_idx !== undefined ? [oldItem.segment_idx] : []);
        
        // Remove from old segments that are no longer selected
        oldIdxs.forEach(oldIdx => {
            if (!segment_idxs.includes(oldIdx) && ev.rundown && ev.rundown[oldIdx]) {
                ev.rundown[oldIdx].cue_music = ''; // clear old mapping
            }
        });
        
        ev.musicList[parseInt(idxStr)] = newItem;
    } else {
        ev.musicList.push(newItem);
    }
    
    // Update the Rundown segments with the new mapping
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

`;
    code = code.substring(0, saveFuncStart) + saveFunc + code.substring(saveFuncEnd);
}

// 3. Update the table renderer in renderAdminMusicListWrapper
// We need to find the part where segmentText is built.
const tableRenderOld = `        let segmentText = '<span style="display:inline-block; padding:0.25rem 0.5rem; background:rgba(255,255,255,0.05); border-radius:4px; font-size:0.75rem; color:var(--adm-text-muted);">Trek Standby (Bebas Main)</span>';
        if (item.segment_idx !== null && item.segment_idx !== undefined && item.segment_idx !== '' && currentEv.rundown && currentEv.rundown[item.segment_idx]) {
            segmentText = '<div style="color:#38BDF8; font-weight:600; font-size:0.85rem; margin-bottom:0.2rem;"><span style="background:rgba(56,189,248,0.15); padding:0.15rem 0.4rem; border-radius:4px; margin-right:0.4rem;">Segmen ' + (item.segment_idx + 1) + '</span>' + escapeHtml(currentEv.rundown[item.segment_idx].title || '') + '</div><div style="font-size:0.75rem; color:var(--adm-text-secondary);">➡️  Auto-cue di Stage Mode saat segmen ini aktif.</div>';
        }`;

const tableRenderNew = `        let segmentText = '<span style="display:inline-block; padding:0.25rem 0.5rem; background:rgba(255,255,255,0.05); border-radius:4px; font-size:0.75rem; color:var(--adm-text-muted);">Trek Standby (Bebas Main)</span>';
        
        let activeIdxs = [];
        if (Array.isArray(item.segment_idxs) && item.segment_idxs.length > 0) activeIdxs = item.segment_idxs;
        else if (item.segment_idx !== null && item.segment_idx !== undefined && item.segment_idx !== '') activeIdxs = [item.segment_idx];
        
        if (activeIdxs.length > 0 && currentEv.rundown) {
            segmentText = activeIdxs.map(s_idx => {
                if (currentEv.rundown[s_idx]) {
                    return '<div style="color:#38BDF8; font-weight:600; font-size:0.85rem; margin-bottom:0.3rem;"><span style="background:rgba(56,189,248,0.15); padding:0.15rem 0.4rem; border-radius:4px; margin-right:0.4rem;">Segmen ' + (s_idx + 1) + '</span>' + escapeHtml(currentEv.rundown[s_idx].title || '') + '</div>';
                }
                return '';
            }).join('');
            if(segmentText !== '') {
                segmentText += '<div style="font-size:0.75rem; color:var(--adm-text-secondary); margin-top:0.3rem;">➡️  Auto-cue di Stage Mode aktif.</div>';
            } else {
                segmentText = '<span style="display:inline-block; padding:0.25rem 0.5rem; background:rgba(255,255,255,0.05); border-radius:4px; font-size:0.75rem; color:var(--adm-text-muted);">Trek Standby (Bebas Main)</span>';
            }
        }`;

code = code.replace(tableRenderOld, tableRenderNew);

// 4. Update window.deleteMusic to clear all segment mappings
const deleteOld = `    const oldItem = ev.musicList[index];
    if (oldItem.segment_idx !== null && oldItem.segment_idx !== undefined && ev.rundown && ev.rundown[oldItem.segment_idx]) {
        ev.rundown[oldItem.segment_idx].cue_music = '';
    }`;
const deleteNew = `    const oldItem = ev.musicList[index];
    const oldIdxs = Array.isArray(oldItem.segment_idxs) ? oldItem.segment_idxs : (oldItem.segment_idx !== null && oldItem.segment_idx !== undefined ? [oldItem.segment_idx] : []);
    oldIdxs.forEach(oldIdx => {
        if (ev.rundown && ev.rundown[oldIdx]) ev.rundown[oldIdx].cue_music = '';
    });`;
code = code.replace(deleteOld, deleteNew);

fs.writeFileSync('public/js/admin-core.js', code, 'utf8');
console.log('Successfully patched multi-segment support!');

const fs = require('fs');

const newCode = `window.openAddMusicModal = async function(editIndex = -1) {
    let ev = _getEv();
    if (!ev) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    
    let editItem = null;
    if (editIndex >= 0 && ev.musicList && ev.musicList[editIndex]) {
        editItem = ev.musicList[editIndex];
    }
    
    const rundownOptions = [{value: '', label: '-- Tidak Terhubung (Standby) --'}];
    if (ev.rundown && ev.rundown.length > 0) {
        ev.rundown.forEach((r, idx) => {
            rundownOptions.push({value: idx, label: \`Segmen \${idx+1}: \${r.title || 'Untitled'}\`});
        });
    }
    
    const bank = window.getGlobalMusicBank();
    let bankOptionsHtml = '';
    if (bank && bank.length > 0) {
        bank.forEach((b, idx) => {
            // Check if this matches the editItem
            let isSelected = false;
            if (editItem && editItem.title === b.title && (editItem.artist || '') === (b.artist || '')) {
                isSelected = true;
            }
            bankOptionsHtml += \`<option value="\${idx}" \${isSelected ? 'selected' : ''}>\${b.title} \${b.artist ? '- ' + b.artist : ''}</option>\`;
        });
    } else {
        bankOptionsHtml = '<option value="" disabled>-- Master Bank Kosong, silakan isi dulu --</option>';
    }
    
    const modalId = 'modalEventMusicForm';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '999999';
        document.body.appendChild(overlay);
    }
    
    let html = \`
        <div class="modal-content" style="max-width:550px;">
            <div class="modal-header">
                <h3 class="modal-title">\${editItem ? '✏️ Edit Lagu Acara' : '🎵 Tambah Lagu Acara'}</h3>
                <button class="modal-close" onclick="document.getElementById('\${modalId}').style.display='none'; document.getElementById('\${modalId}').classList.remove('active');">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="evmFormIdx" value="\${editIndex >= 0 ? editIndex : ''}">
                
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1.5rem;">
                    <label class="form-label" style="color:var(--adm-gold); font-size:1.1rem; margin-bottom:0.8rem;">Pilih Lagu dari Master Bank *</label>
                    <select class="form-select" id="evmFormBankSelect" style="font-size:1.05rem; padding:0.6rem;">
                        <option value="">-- Pilih Lagu --</option>
                        \${bankOptionsHtml}
                    </select>
                    <div style="font-size:0.75rem; color:var(--adm-text-muted); margin-top:0.6rem;">
                        <i>💡 Mengunggah file audio atau memasukkan link YouTube sekarang hanya dapat dilakukan secara terpusat melalui menu <b>Master Bank Musik</b>.</i>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Terhubung ke Segmen Rundown</label>
                    <select class="form-select" id="evmFormSegment">
                        \${rundownOptions.map(opt => \`<option value="\${opt.value}" \${editItem && editItem.segment_idx == opt.value ? 'selected' : ''}>\${opt.label}</option>\`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Instruksi Cue (opsional, untuk Stage MC / Operator)</label>
                    <textarea class="form-input" id="evmFormCue" rows="2" placeholder="Contoh: Putar dari menit 1:15 saat MC memanggil nama"> \${editItem ? (editItem.cue_instruction || '') : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Kategori Momen</label>
                    <select class="form-select" id="evmFormCategory">
                        <option value="BGM" \${editItem && editItem.category==='BGM'?'selected':''}>General Background BGM</option>
                        <option value="Opening" \${editItem && editItem.category==='Opening'?'selected':''}>Opening & Welcoming</option>
                        <option value="Entrance" \${editItem && editItem.category==='Entrance'?'selected':''}>Grand Entrance</option>
                        <option value="Ceremony" \${editItem && editItem.category==='Ceremony'?'selected':''}>Ceremony & Sambutan</option>
                        <option value="Toast" \${editItem && editItem.category==='Toast'?'selected':''}>Toast & Cake Cutting</option>
                        <option value="Dinner" \${editItem && editItem.category==='Dinner'?'selected':''}>Dinner & Entertainment</option>
                        <option value="Games" \${editItem && editItem.category==='Games'?'selected':''}>Games & Bouquet Toss</option>
                        <option value="Closing" \${editItem && editItem.category==='Closing'?'selected':''}>Closing & Photo Session</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('\${modalId}').style.display='none'; document.getElementById('\${modalId}').classList.remove('active');">Batal</button>
                <button class="btn btn-primary" onclick="window.saveEventMusicForm()">Simpan Lagu</button>
            </div>
        </div>
    \`;
    
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.classList.add('active');
};

window.saveEventMusicForm = async function() {
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
    
    if (idxStr !== '') {
        ev.musicList[parseInt(idxStr)] = newItem;
    } else {
        ev.musicList.push(newItem);
    }
    
    ev.metadata = ev.metadata || {};
    ev.metadata.musicList = ev.musicList;
    _setEv(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    
    document.getElementById('modalEventMusicForm').style.display = 'none';
    document.getElementById('modalEventMusicForm').classList.remove('active');
    
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
};
`;

const files = ['public/js/admin-core.js', 'scratch/admin-core.orig.js', 'scratch/music_patch.js'];
files.forEach(file => {
    try {
        let code = fs.readFileSync(file, 'utf8');
        const startIdx = code.indexOf('window.openAddMusicModal =');
        if (startIdx > -1) {
            const endIdx = code.indexOf('window.deleteMusic =', startIdx);
            if (endIdx > -1) {
                const blockToReplace = code.substring(startIdx, endIdx);
                code = code.replace(blockToReplace, newCode + '\n\n');
                fs.writeFileSync(file, code);
                console.log("Patched architecture in " + file);
            }
        }
    } catch(e) {
        console.log("Error: " + e.message);
    }
});

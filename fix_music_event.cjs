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
                <button class="btn btn-primary" onclick="window.showMusicBankSelector()" style="width:100%; margin-bottom:1.5rem; background:linear-gradient(135deg, var(--adm-gold), #FDE047); color:#000; font-weight:bold;">
                    🎵 Pilih & Impor dari Master Bank Musik
                </button>
                
                <input type="hidden" id="evmFormIdx" value="\${editIndex >= 0 ? editIndex : ''}">
                <div class="form-group">
                    <label class="form-label">Judul Lagu *</label>
                    <input type="text" class="form-input" id="evmFormTitle" value="\${editItem ? editItem.title : ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Penyanyi / Artis</label>
                    <input type="text" class="form-input" id="evmFormArtist" value="\${editItem ? (editItem.artist || '') : ''}">
                </div>
                
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1rem;">
                    <label class="form-label">File Audio Lokal (.mp3, .wav)</label>
                    <input type="file" class="form-input" id="evmFormFile" accept="audio/*">
                    \${editItem && editItem.file_upload ? \`<div style="font-size:0.75rem; color:var(--adm-gold); margin-top:0.3rem;">File saat ini terhubung ke Server.</div>\` : ''}
                </div>
                <div style="text-align:center; font-size:0.8rem; color:var(--adm-text-muted); margin-bottom:1rem;">ATAU</div>
                <div class="form-group">
                    <label class="form-label">Link YouTube / Drive / Spotify</label>
                    <input type="text" class="form-input" id="evmFormUrl" value="\${editItem ? (editItem.url_link || '') : ''}" placeholder="https://youtube.com/...">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Instruksi Cue (opsional, untuk Stage & AI)</label>
                    <textarea class="form-input" id="evmFormCue" rows="2">\${editItem ? (editItem.cue_instruction || '') : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Terhubung ke Segmen Rundown</label>
                    <select class="form-select" id="evmFormSegment">
                        \${rundownOptions.map(opt => \`<option value="\${opt.value}" \${editItem && editItem.segment_idx == opt.value ? 'selected' : ''}>\${opt.label}</option>\`).join('')}
                    </select>
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
                
                <div class="form-group">
                    <label class="form-label">Simpan ke Master Bank (untuk acara lain)</label>
                    <select class="form-select" id="evmFormSaveBank">
                        <option value="1">Ya, Simpan ke Bank Master</option>
                        <option value="0" selected>Tidak perlu</option>
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
    
    // Toggle logic
    const fileInput = document.getElementById('evmFormFile');
    const urlInput = document.getElementById('evmFormUrl');
    function toggleInputs() {
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            urlInput.disabled = true; urlInput.style.opacity = '0.5'; urlInput.value = '';
        } else if (urlInput && urlInput.value.trim() !== '') {
            fileInput.disabled = true; fileInput.style.opacity = '0.5'; fileInput.value = '';
        } else {
            if (urlInput) { urlInput.disabled = false; urlInput.style.opacity = '1'; }
            if (fileInput) { fileInput.disabled = false; fileInput.style.opacity = '1'; }
        }
    }
    if (fileInput) fileInput.addEventListener('change', toggleInputs);
    if (urlInput) urlInput.addEventListener('input', toggleInputs);
    
    if (editItem && editItem.url_link) {
        if (fileInput) { fileInput.disabled = true; fileInput.style.opacity = '0.5'; }
    } else if (editItem && editItem.file_upload) {
        if (urlInput) { urlInput.disabled = true; urlInput.style.opacity = '0.5'; }
    }
};

window.saveEventMusicForm = async function() {
    const idxStr = document.getElementById('evmFormIdx').value;
    const title = document.getElementById('evmFormTitle').value.trim();
    const artist = document.getElementById('evmFormArtist').value.trim();
    const url_link = document.getElementById('evmFormUrl').value.trim();
    const cue_instruction = document.getElementById('evmFormCue').value.trim();
    const segment_idx = document.getElementById('evmFormSegment').value;
    const category = document.getElementById('evmFormCategory').value;
    const save_to_bank = document.getElementById('evmFormSaveBank').value === '1';
    const fileInput = document.getElementById('evmFormFile');
    
    if (!title) return window.uiAlert('Judul lagu wajib diisi!');
    
    let ev = _getEv();
    if (!ev) return;
    if (!ev.musicList) ev.musicList = [];
    
    let final_url = url_link;
    let final_file = '';

    if (idxStr !== '') {
        final_file = ev.musicList[parseInt(idxStr)].file_upload || '';
    }
    
    if (url_link && fileInput && fileInput.files && fileInput.files.length > 0) {
        return window.uiAlert('Silakan pilih salah satu: Upload File lokal ATAU masukkan Link URL.');
    }
    
    if (final_url !== '') {
        final_file = '';
    } else if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        try {
            document.getElementById('evmFormTitle').disabled = true;
            const res = await fetch('/api/cms/music-bank/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                final_file = data.url; 
            } else {
                document.getElementById('evmFormTitle').disabled = false;
                return window.uiAlert('Gagal upload file: ' + data.message);
            }
        } catch(e) {
            document.getElementById('evmFormTitle').disabled = false;
            return window.uiAlert('Error upload file: ' + e.message);
        }
    }
    
    // Optional: override with pending bank file if any
    if (window._pendingBankFile) {
        final_file = window._pendingBankFile;
        delete window._pendingBankFile;
    }
    
    const newItem = {
        id: (idxStr !== '') ? ev.musicList[parseInt(idxStr)].id : 'music_' + Date.now(),
        title: title,
        artist: artist,
        url_link: final_url,
        file_upload: final_file,
        cue_instruction: cue_instruction,
        segment_idx: segment_idx !== '' ? parseInt(segment_idx) : null,
        category: category
    };
    
    if (idxStr !== '') {
        ev.musicList[parseInt(idxStr)] = newItem;
    } else {
        ev.musicList.push(newItem);
    }
    
    // Sync to Master Bank if requested
    if (save_to_bank) {
        const bank = window.getGlobalMusicBank();
        bank.push({
            title: newItem.title,
            artist: newItem.artist,
            type: newItem.category === 'BGM' ? 'BGM' : (newItem.category === 'Entrance' || newItem.category === 'Opening' ? 'Lagu Utama' : 'Lainnya'),
            url_link: newItem.url_link,
            file_upload: newItem.file_upload
        });
        window.saveGlobalMusicBank(bank);
    }
    
    ev.metadata = ev.metadata || {};
    ev.metadata.musicList = ev.musicList;
    _setEv(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    
    document.getElementById('modalEventMusicForm').style.display = 'none';
    document.getElementById('modalEventMusicForm').classList.remove('active');
    
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
};

window.showMusicBankSelector = function() {
    const bank = window.getGlobalMusicBank();
    if (!bank || bank.length === 0) {
        return window.uiAlert('Master Bank Musik kosong. Silakan tambah lagu di menu Master Bank terlebih dahulu.');
    }
    
    const modalId = 'modalBankSelector';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '9999999';
        document.body.appendChild(overlay);
    }
    
    let listHtml = bank.map((b, i) => {
        return \`<div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:bold;">\${b.title}</div>
                <div style="font-size:0.8rem; color:var(--adm-text-muted);">\${b.artist || '-'}</div>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="window.selectFromBank(\${i})">Pilih</button>
        </div>\`;
    }).join('');
    
    overlay.innerHTML = \`
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3 class="modal-title">Pilih dari Master Bank</h3>
                <button class="modal-close" onclick="document.getElementById('\${modalId}').style.display='none'; document.getElementById('\${modalId}').classList.remove('active');">&times;</button>
            </div>
            <div class="modal-body" style="max-height:60vh; overflow-y:auto; padding:0;">
                \${listHtml}
            </div>
        </div>
    \`;
    overlay.style.display = 'flex';
    overlay.classList.add('active');
};

window.selectFromBank = function(idx) {
    const bank = window.getGlobalMusicBank();
    if (bank && bank[idx]) {
        document.getElementById('evmFormTitle').value = bank[idx].title || '';
        document.getElementById('evmFormArtist').value = bank[idx].artist || '';
        document.getElementById('evmFormUrl').value = bank[idx].url_link || '';
        if (bank[idx].file_upload) {
            window._pendingBankFile = bank[idx].file_upload;
        }
        
        // Trigger toggle logic manually
        const urlInput = document.getElementById('evmFormUrl');
        const fileInput = document.getElementById('evmFormFile');
        if (bank[idx].url_link) {
            fileInput.disabled = true; fileInput.style.opacity = '0.5';
        } else if (bank[idx].file_upload) {
            urlInput.disabled = true; urlInput.style.opacity = '0.5';
        }
    }
    document.getElementById('modalBankSelector').style.display = 'none';
    document.getElementById('modalBankSelector').classList.remove('active');
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
                console.log("Patched openAddMusicModal in " + file);
            }
        }
    } catch(e) {
        console.log("Error: " + e.message);
    }
});

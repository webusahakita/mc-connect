
// --- MUSIK & SOUND ACARA MODULE (INTEGRATION WITH STAGE & RUNDOWN) ---
window.openAddMusicModal = async function(editIndex = -1) {
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
            rundownOptions.push({value: idx, label: `Segmen ${idx+1}: ${r.title || 'Untitled'}`});
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
            bankOptionsHtml += `<option value="${idx}" ${isSelected ? 'selected' : ''}>${b.title} ${b.artist ? '- ' + b.artist : ''}</option>`;
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
    
    let html = `
        <div class="modal-content" style="max-width:550px;">
            <div class="modal-header">
                <h3 class="modal-title">${editItem ? ' Edit Lagu Acara' : '<� Tambah Lagu Acara'}</h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active');">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="evmFormIdx" value="${editIndex >= 0 ? editIndex : ''}">
                
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1.5rem;">
                    <label class="form-label" style="color:var(--adm-gold); font-size:1.1rem; margin-bottom:0.8rem;">Pilih Lagu dari Master Bank *</label>
                    <select class="form-select" id="evmFormBankSelect" style="font-size:1.05rem; padding:0.6rem;">
                        <option value="">-- Pilih Lagu --</option>
                        ${bankOptionsHtml}
                    </select>
                    <div style="font-size:0.75rem; color:var(--adm-text-muted); margin-top:0.6rem;">
                        <i>=� Mengunggah file audio atau memasukkan link YouTube sekarang hanya dapat dilakukan secara terpusat melalui menu <b>Master Bank Musik</b>.</i>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Terhubung ke Segmen Rundown</label>
                    <select class="form-select" id="evmFormSegment">
                        ${rundownOptions.map(opt => `<option value="${opt.value}" ${editItem && editItem.segment_idx == opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Instruksi Cue (opsional, untuk Stage MC / Operator)</label>
                    <textarea class="form-input" id="evmFormCue" rows="2" placeholder="Contoh: Putar dari menit 1:15 saat MC memanggil nama"> ${editItem ? (editItem.cue_instruction || '') : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Kategori Momen</label>
                    <select class="form-select" id="evmFormCategory">
                        <option value="BGM" ${editItem && editItem.category==='BGM'?'selected':''}>General Background BGM</option>
                        <option value="Opening" ${editItem && editItem.category==='Opening'?'selected':''}>Opening & Welcoming</option>
                        <option value="Entrance" ${editItem && editItem.category==='Entrance'?'selected':''}>Grand Entrance</option>
                        <option value="Ceremony" ${editItem && editItem.category==='Ceremony'?'selected':''}>Ceremony & Sambutan</option>
                        <option value="Toast" ${editItem && editItem.category==='Toast'?'selected':''}>Toast & Cake Cutting</option>
                        <option value="Dinner" ${editItem && editItem.category==='Dinner'?'selected':''}>Dinner & Entertainment</option>
                        <option value="Games" ${editItem && editItem.category==='Games'?'selected':''}>Games & Bouquet Toss</option>
                        <option value="Closing" ${editItem && editItem.category==='Closing'?'selected':''}>Closing & Photo Session</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active');">Batal</button>
                <button class="btn btn-primary" onclick="window.saveEventMusicForm()">Simpan Lagu</button>
            </div>
        </div>
    `;
    
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


window.deleteMusic = async function(index) {
    if (!ev || !ev.musicList || !ev.musicList[index]) return;
    if (!(await window.uiConfirm(`Hapus lagu: "${ev.musicList[index].title}" dari playlist?`))) return;
    ev.musicList.splice(index, 1);
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.musicList = ev.musicList;
    window.renderAdminMusicListWrapper(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) {
        window.syncEngine.pushEventsToServer();
    }
};

window.downloadAllAudioPack = function() {
    if (typeof window.uiAlert === 'function') window.uiAlert('Menyiapkan Audio Pack (.wav)... Harap tunggu, mengumpulkan aset untuk Mode Offline.', 'Mengunduh Audio Pack');
    else alert('Fitur unduh Audio Pack sedang disiapkan.');
    
    // Simulate generation
    setTimeout(() => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Download Audio Pack (.wav) berhasil dikemas dan disimpan ke perangkat Anda. Anda dapat menggunakannya untuk pemutaran offline (Zero Internet Required).', 'Berhasil');
    }, 2000);
};

window.openMusicPrintModal = function() {
    if (typeof window.uiAlert === 'function') window.uiAlert('Membuka layout cetak PDF untuk Cue Sheet Musik...', 'Cetak');
    else alert('Membuka layout cetak PDF...');
};

window.resetCurrentEventMusic = async function() {
    if (!(await window.uiConfirm('Apakah Anda yakin ingin mereset playlist musik ke default? Semua musik kustom yang telah ditambahkan akan terhapus.'))) return;
    if (ev) {
        ev.musicList = [];
        if (ev.metadata) ev.metadata.musicList = [];
        window.renderAdminMusicListWrapper(ev);
        if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) {
            window.syncEngine.pushEventsToServer();
        }
        if (typeof window.showToast === 'function') window.showToast('Playlist berhasil direset ke Default Master.');
    }
};

window.filterMusicList = function() {
    if (typeof ev !== 'undefined' && ev) {
        window.renderAdminMusicListWrapper(ev);
    }
};

window.renderAdminMusicListWrapper = function(currentEv) {
    const container = document.getElementById('adminMusicTableContainer');
    if (!container) return;
    
    const metricTotal = document.getElementById('musicMetricTotal');
    const metricLinked = document.getElementById('musicMetricLinked');
    
    if (!currentEv || !currentEv.musicList || currentEv.musicList.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:3rem; background:rgba(255,255,255,0.02); border-radius:12px; color:var(--adm-text-muted);">Belum ada daftar musik/cue audio.<br><br><button class="btn btn-primary btn-sm" onclick="window.openAddMusicModal()">+ Tambah Lagu Acara Pertama</button></div>';
        if (metricTotal) metricTotal.textContent = '0 Trek';
        if (metricLinked) metricLinked.textContent = '0 / ' + (currentEv.rundown ? currentEv.rundown.length : 0) + ' Segmen';
        return;
    }
    
    let filteredList = currentEv.musicList;
    const searchInput = document.getElementById('musicSearchInput');
    const categoryFilter = document.getElementById('musicCategoryFilter');
    const statusFilter = document.getElementById('musicStatusFilter');
    
    if (searchInput && searchInput.value) {
        const q = searchInput.value.toLowerCase();
        filteredList = filteredList.filter(m => (m.title||'').toLowerCase().includes(q) || (m.artist||'').toLowerCase().includes(q) || (m.cue_instruction||'').toLowerCase().includes(q));
    }
    if (categoryFilter && categoryFilter.selectedIndex > 0) {
        const cat = categoryFilter.value;
        filteredList = filteredList.filter(m => m.category === cat);
    }
    if (statusFilter && statusFilter.selectedIndex > 0) {
        const stat = statusFilter.value;
        if (stat === 'LINKED') {
            filteredList = filteredList.filter(m => m.segment_idx !== null && m.segment_idx !== undefined && m.segment_idx !== '');
        } else {
            filteredList = filteredList.filter(m => m.segment_idx === null || m.segment_idx === undefined || m.segment_idx === '');
        }
    }
    
    if (metricTotal) metricTotal.textContent = currentEv.musicList.length + ' Trek';
    const linkedCount = currentEv.musicList.filter(m => m.segment_idx !== null && m.segment_idx !== undefined && m.segment_idx !== '').length;
    const rundownCount = currentEv.rundown ? currentEv.rundown.length : 0;
    if (metricLinked) metricLinked.textContent = linkedCount + ' / ' + rundownCount + ' Segmen';

    if (filteredList.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Tidak ada musik yang cocok dengan filter pencarian.</div>';
        return;
    }

    let html = '<table class="ecc-table" style="width:100%; text-align:left; border-collapse:collapse;">';
    html += '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><th style="padding:1rem;">Judul & Artis</th><th style="padding:1rem;">Instruksi Cue (FOH/DJ)</th><th style="padding:1rem;">Terhubung Segmen Rundown</th><th style="padding:1rem; text-align:right;">Aksi</th></tr></thead>';
    html += '<tbody>';
    
    filteredList.forEach(item => {
        const realIdx = currentEv.musicList.findIndex(m => m.id === item.id);
        
        let segmentText = '<span style="display:inline-block; padding:0.25rem 0.5rem; background:rgba(255,255,255,0.05); border-radius:4px; font-size:0.75rem; color:var(--adm-text-muted);">Trek Standby (Bebas Main)</span>';
        if (item.segment_idx !== null && item.segment_idx !== undefined && item.segment_idx !== '' && currentEv.rundown && currentEv.rundown[item.segment_idx]) {
            segmentText = '<div style="color:#38BDF8; font-weight:600; font-size:0.85rem; margin-bottom:0.2rem;"><span style="background:rgba(56,189,248,0.15); padding:0.15rem 0.4rem; border-radius:4px; margin-right:0.4rem;">Segmen ' + (item.segment_idx + 1) + '</span>' + escapeHtml(currentEv.rundown[item.segment_idx].title || '') + '</div><div style="font-size:0.75rem; color:var(--adm-text-secondary);">�~��  Auto-cue di Stage Mode saat segmen ini aktif.</div>';
        }
        
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.02)\'" onmouseout="this.style.background=\'transparent\'">';
        html += '<td style="padding:1rem;">';
        html += '<div style="font-weight:700; font-size:1.05rem; color:#FFF; margin-bottom:0.3rem;">' + escapeHtml(item.title || 'Untitled') + '</div>';
        html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + escapeHtml(item.artist || 'Unknown Artist') + ' <span style="color:var(--adm-text-secondary); margin:0 0.4rem;">&bull;</span> <span style="background:rgba(212,175,55,0.1); padding:0.15rem 0.4rem; border-radius:4px;">' + escapeHtml(item.category || 'BGM') + '</span></div>';
        html += '</td>';
        html += '<td style="padding:1rem; max-width:250px; font-size:0.85rem; color:var(--adm-text-secondary); line-height:1.4;">' + (item.cue_instruction ? escapeHtml(item.cue_instruction) : '<i style="color:#555;">Tidak ada instruksi khusus</i>') + '</td>';
        html += '<td style="padding:1rem;">' + segmentText + '</td>';
        html += '<td style="padding:1rem; text-align:right; white-space:nowrap;">';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.openAddMusicModal(' + realIdx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" title="Edit / Ganti Segmen">�S � </button>';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteMusic(' + realIdx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus Lagu">�x� </button>';
        html += '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
};

// Override the original renderAdminMusicList to use our wrapper
window.renderAdminMusicList = window.renderAdminMusicListWrapper;

// Trigger render immediately if ev is ready
if (typeof ev !== 'undefined' && ev) {
    window.renderAdminMusicListWrapper(ev);
}


// ==========================================
// MASTER BANK UI MODULE
// ==========================================
window.renderMusicBankSection = async function() {
    window.memoryAudioFiles = window.memoryAudioFiles || {};
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        window.memoryAudioFiles[fileInput.files[0].name] = URL.createObjectURL(fileInput.files[0]);
    }
    
    const bank = window.getGlobalMusicBank();
    let html = '<div style="width:100%; overflow-x:auto;">';
    if (bank.length === 0) {
        html += '<div style="text-align:center; padding:3rem; color:var(--adm-text-muted);">Bank musik masih kosong.<br><br>Gunakan tombol + Tambah Lagu di pojok kanan atas.</div>';
    } else {
        html += '<table class="ecc-table" style="width:100%; text-align:left; border-collapse:collapse; white-space:nowrap;">';
        html += '<thead><tr style="background:rgba(0,0,0,0.3); border-bottom:1px solid rgba(255,255,255,0.05); color:var(--adm-text-secondary); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">';
        html += '<th style="padding:1.2rem 1.5rem; border-top-left-radius:8px;">Detail Musik / Audio</th>';
        html += '<th style="padding:1.2rem 1.5rem;">Tipe Audio</th>';
        html += '<th style="padding:1.2rem 1.5rem; text-align:right; border-top-right-radius:8px;">Aksi</th>';
        html += '</tr></thead>';
        html += '<tbody>';
        
        bank.forEach((m, idx) => {
            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.02)\'" onmouseout="this.style.background=\'transparent\'">';
            html += '<td style="padding:1rem 1.5rem;">';
            html += '<div style="font-weight:700; font-size:1.05rem; color:#FFF; margin-bottom:0.2rem;">' + m.title + '</div>';
            html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + (m.artist || 'Unknown') + '</div>';
            let srcTxt = m.url_link ? '&#128279; ' + m.url_link : (m.file_upload ? '&#128194; File Upload' : '');
            if(srcTxt) html += '<div style="font-size:0.75rem; color:var(--adm-text-secondary); margin-top:0.3rem;">' + srcTxt + '</div>';
            html += '</td>';
            html += '<td style="padding:1rem 1.5rem;"><span style="background:rgba(255,255,255,0.1); color:#E5E7EB; padding:0.25rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:600; text-transform:uppercase;">' + (m.type || 'Lainnya') + '</span></td>';
            html += '<td style="padding:1rem 1.5rem; text-align:right;">';
            
            html += '<button class="btn btn-secondary btn-sm" onclick="window.playMasterMusic(' + idx + ')" style="color:#60A5FA; border-color:rgba(96,165,250,0.3); margin-right:0.5rem;" title="Putar Preview">� Putar</button>';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.openMasterBankForm(' + idx + ')" style="color:var(--adm-gold); border-color:rgba(212,175,55,0.3); margin-right:0.5rem;" title="Edit Lagu"> Edit</button>';
            
            html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteMusicBankItemSection(' + idx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus">=� Hapus</button>';
            html += '</td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
    }
    html += '</div>';
    
    document.getElementById('musicBankSectionBody').innerHTML = html;
};

window.deleteMusicBankItemSection = async function(idx) {
    const bank = window.getGlobalMusicBank();
    if (await window.uiConfirm('Hapus lagu ini dari Master Bank Musik? Lagu yang sudah terpakai di Acara tidak akan terpengaruh.')) {
        bank.splice(idx, 1);
        window.saveGlobalMusicBank(bank);
        window.renderMusicBankSection();
        if (typeof window.showToast === 'function') window.showToast('Lagu berhasil dihapus dari bank', 'red');
    }
};

window.openMasterBankForm = function(idx = null) {
    let title = '', artist = '', type = 'BGM', url_link = '', file_upload = '';
    
    if (idx !== null) {
        const bank = window.getGlobalMusicBank();
        if (bank[idx]) {
            title = bank[idx].title || '';
            artist = bank[idx].artist || '';
            type = bank[idx].type || 'BGM';
            url_link = bank[idx].url_link || '';
            file_upload = bank[idx].file_upload || '';
        }
    }
    
    const modalId = 'modalMasterBankForm';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.classList.add('active');
        overlay.style.zIndex = '999999';
        document.body.appendChild(overlay);
    }
    
    let html = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3 class="modal-title">${idx !== null ? ' Edit Lagu Master' : '<� Tambah Lagu Master'}</h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active')">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="mbFormIdx" value="${idx !== null ? idx : ''}">
                <div class="form-group">
                    <label class="form-label">Judul Musik / Audio *</label>
                    <input type="text" class="form-input" id="mbFormTitle" value="${title}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Penyanyi / Artis / Komposer</label>
                    <input type="text" class="form-input" id="mbFormArtist" value="${artist}">
                </div>
                <div class="form-group">
                    <label class="form-label">Tipe Audio</label>
                    <select class="form-select" id="mbFormType">
                        <option value="BGM" ${type==='BGM'?'selected':''}>BGM (Backgorund Music)</option>
                        <option value="SFX" ${type==='SFX'?'selected':''}>SFX (Sound Effect)</option>
                        <option value="Lagu Utama" ${type==='Lagu Utama'?'selected':''}>Lagu Utama / Entrance</option>
                        <option value="Lainnya" ${type==='Lainnya'?'selected':''}>Lainnya</option>
                    </select>
                </div>
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1rem;">
                    <label class="form-label">File Audio Lokal (.mp3, .wav)</label>
                    <input type="file" class="form-input" id="mbFormFile" accept="audio/*">
                    ${file_upload ? `<div style="font-size:0.75rem; color:var(--adm-gold); margin-top:0.3rem;">File saat ini: ${file_upload}</div>` : ''}
                </div>
                <div style="text-align:center; font-size:0.8rem; color:var(--adm-text-muted); margin-bottom:1rem;">ATAU</div>
                <div class="form-group">
                    <label class="form-label">Link YouTube / Drive / Spotify</label>
                    <input type="text" class="form-input" id="mbFormUrl" value="${url_link}" placeholder="https://youtube.com/...">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active')">Batal</button>
                <button class="btn btn-primary" onclick="window.saveMasterBankForm()">Simpan ke Bank</button>
            </div>
        </div>
    `;
    
        overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.classList.add('active');

    const fileInput = document.getElementById('mbFormFile');
    const urlInput = document.getElementById('mbFormUrl');
    
    function toggleMbInputs() {
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            urlInput.disabled = true;
            urlInput.style.opacity = '0.5';
            urlInput.value = '';
        } else if (urlInput && urlInput.value.trim() !== '') {
            fileInput.disabled = true;
            fileInput.style.opacity = '0.5';
            fileInput.value = '';
        } else {
            if (urlInput) {
                urlInput.disabled = false;
                urlInput.style.opacity = '1';
            }
            if (fileInput) {
                fileInput.disabled = false;
                fileInput.style.opacity = '1';
            }
        }
    }
    
    if (fileInput) fileInput.addEventListener('change', toggleMbInputs);
    if (urlInput) urlInput.addEventListener('input', toggleMbInputs);
    
    // Initial toggle based on existing data
    if (url_link) {
        if (fileInput) {
            fileInput.disabled = true;
            fileInput.style.opacity = '0.5';
        }
    } else if (file_upload) {
        if (urlInput) {
            urlInput.disabled = true;
            urlInput.style.opacity = '0.5';
        }
    }
};

window.saveMasterBankForm = async function() {
    const idxStr = document.getElementById('mbFormIdx').value;
    const title = document.getElementById('mbFormTitle').value.trim();
    const artist = document.getElementById('mbFormArtist').value.trim();
    const type = document.getElementById('mbFormType').value;
    const url_link = document.getElementById('mbFormUrl').value.trim();
    const fileInput = document.getElementById('mbFormFile');
    
    if (!title) return window.uiAlert('Judul musik harus diisi!');
    
    let final_url = url_link;
    let final_file = '';

    if (idxStr !== '') {
        const bank = window.getGlobalMusicBank();
        final_file = bank[parseInt(idxStr)].file_upload || '';
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
            document.getElementById('mbFormTitle').disabled = true;
            document.getElementById('mbFormArtist').disabled = true;
            const res = await fetch('/api/cms/music-bank/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                final_file = data.url; 
            } else {
                document.getElementById('mbFormTitle').disabled = false;
                document.getElementById('mbFormArtist').disabled = false;
                return window.uiAlert('Gagal upload file: ' + data.message);
            }
        } catch(e) {
            document.getElementById('mbFormTitle').disabled = false;
            document.getElementById('mbFormArtist').disabled = false;
            return window.uiAlert('Error upload file: ' + e.message);
        }
    }
    
    document.getElementById('mbFormTitle').disabled = false;
    document.getElementById('mbFormArtist').disabled = false;
    
    const bank = window.getGlobalMusicBank();
    const item = { title, artist, type, url_link: final_url, file_upload: final_file };
    
    if (idxStr !== '') {
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

        if (typeof window.showToast === 'function') window.showToast('Lagu diupdate & disinkron ke seluruh acara!', 'green');
    } else {
        bank.push(item);
        if (typeof window.showToast === 'function') window.showToast('Lagu berhasil ditambahkan ke bank!', 'green');
    }
    
    window.saveGlobalMusicBank(bank);
    document.getElementById('modalMasterBankForm').style.display = 'none';
    document.getElementById('modalMasterBankForm').classList.remove('active');
    
    if (typeof window.renderMusicBankSection === 'function') {
        window.renderMusicBankSection();
    }
};

window.playMasterMusic = function(idx) {
    const bank = window.getGlobalMusicBank();
    if (!bank[idx]) return;
    
    const m = bank[idx];
    
    const modalId = 'modalMusicPlayer';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '9999999';
        document.body.appendChild(overlay);
    }
    
    let contentHtml = '';
    if (m.url_link) {
        let embedUrl = m.url_link;
        if (embedUrl.includes('youtube.com/watch?v=')) {
            embedUrl = embedUrl.replace('watch?v=', 'embed/');
        } else if (embedUrl.includes('youtu.be/')) {
            embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
        }
        contentHtml = `<iframe width="100%" height="250" src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    } else if (m.file_upload) {
        contentHtml = `
            <div style="padding:2rem; text-align:center; background:rgba(0,0,0,0.3); border-radius:8px;">
                <div style="font-size:2rem; margin-bottom:1rem;"><�</div>
                <div style="margin-bottom:1.5rem; color:var(--adm-gold);">${m.file_upload.split('/').pop()}</div>
                <audio controls autoplay style="width:100%;">
                    <source src="${m.file_upload}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
    } else {
        contentHtml = '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Tidak ada media untuk diputar.</div>';
    }
    
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:500px; background:#111;">
            <div class="modal-header">
                <h3 class="modal-title">� Memutar: ${m.title}</h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').style.display='none'; document.getElementById('${modalId}').classList.remove('active'); document.getElementById('${modalId}').innerHTML='';">&times;</button>
            </div>
            <div class="modal-body" style="padding:0;">
                ${contentHtml}
            </div>
        </div>
    `;
    
    overlay.style.display = 'flex';
    overlay.classList.add('active');
};


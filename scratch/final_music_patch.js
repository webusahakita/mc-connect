// --- FINAL MUSIC & SOUNDBOARD OVERRIDES ---

// Helper to get current event
function _getEv() {
    return window.activeCommandCenterEvent || (typeof currentEv !== 'undefined' ? currentEv : null);
}

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
    
    const fields = [
        { id: 'title', label: 'Judul Lagu *', type: 'text', value: editItem ? editItem.title : '' },
        { id: 'artist', label: 'Penyanyi / Artis', type: 'text', value: editItem ? editItem.artist : '' },
        { id: 'cue_instruction', label: 'Instruksi Cue (opsional, untuk Stage & AI)', type: 'textarea', value: editItem ? editItem.cue_instruction : '' },
        { id: 'segment_idx', label: 'Terhubung ke Segmen Rundown (Otomatis main saat segmen aktif di Stage)', type: 'select', options: rundownOptions, value: (editItem && editItem.segment_idx !== null) ? editItem.segment_idx : '' },
        { id: 'category', label: 'Kategori Momen', type: 'select', options: [
            {value: 'BGM', label: 'General Background BGM'},
            {value: 'Opening', label: 'Opening & Welcoming'},
            {value: 'Entrance', label: 'Grand Entrance'},
            {value: 'Ceremony', label: 'Ceremony & Sambutan'},
            {value: 'Toast', label: 'Toast & Cake Cutting'},
            {value: 'Dinner', label: 'Dinner & Entertainment'},
            {value: 'Games', label: 'Games & Bouquet Toss'},
            {value: 'Closing', label: 'Closing & Photo Session'}
        ], value: editItem ? editItem.category : 'BGM' }
    ];

    const result = await window.uiFormModal(editItem ? 'Edit Lagu Acara' : 'Tambah Lagu Acara (Terintegrasi)', fields);
    if (result) {
        if (!result.title) {
            if (typeof window.uiAlert === 'function') window.uiAlert('Judul lagu wajib diisi!');
            return;
        }
        
        if (!ev.musicList) ev.musicList = [];
        
        const newItem = {
            id: editItem ? editItem.id : 'music_' + Date.now(),
            title: result.title,
            artist: result.artist || '',
            cue_instruction: result.cue_instruction || '',
            segment_idx: result.segment_idx === '' ? null : parseInt(result.segment_idx),
            category: result.category || 'BGM'
        };
        
        if (editIndex >= 0) {
            ev.musicList[editIndex] = newItem;
        } else {
            ev.musicList.push(newItem);
        }
        
        if (!ev.metadata) ev.metadata = {};
        ev.metadata.musicList = ev.musicList;
        
        if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
        
        if (typeof window.showToast === 'function') window.showToast('Lagu berhasil disimpan!');
        if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    }
};

window.deleteMusic = async function(index) {
    let ev = _getEv();
    if (!ev || !ev.musicList || !ev.musicList[index]) return;
    if (!(await window.uiConfirm(`Hapus lagu: "${ev.musicList[index].title}" dari playlist?`))) return;
    ev.musicList.splice(index, 1);
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.musicList = ev.musicList;
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};

window.resetCurrentEventMusic = async function() {
    let ev = _getEv();
    if (!(await window.uiConfirm('Apakah Anda yakin ingin mereset playlist musik ke default? Semua musik kustom yang telah ditambahkan akan terhapus.'))) return;
    if (ev) {
        ev.musicList = [];
        if (ev.metadata) ev.metadata.musicList = [];
        if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
        if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
        if (typeof window.showToast === 'function') window.showToast('Playlist berhasil direset ke Default Master.');
    }
};

window.filterMusicList = function() {
    let ev = _getEv();
    if (ev && typeof window.renderAdminMusicListWrapper === 'function') {
        window.renderAdminMusicListWrapper(ev);
    }
};

window.openAddLandingMusicModal = async function(editIndex = -1) {
    let ev = _getEv();
    if (!ev) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    
    let editItem = null;
    if (editIndex >= 0 && ev.landingMusic && ev.landingMusic[editIndex]) {
        editItem = ev.landingMusic[editIndex];
    }
    
    const fields = [
        { id: 'title', label: 'Judul Lagu *', type: 'text', value: editItem ? editItem.title : '' },
        { id: 'artist', label: 'Penyanyi / Pembuat', type: 'text', value: editItem ? editItem.artist : '' },
        { id: 'is_active', label: 'Status', type: 'select', options: [
            {value: '1', label: 'Aktif (Auto-play di web)'},
            {value: '0', label: 'Tidak Aktif'}
        ], value: editItem ? (editItem.is_active ? '1' : '0') : '1' }
    ];

    const result = await window.uiFormModal(editItem ? 'Edit Musik Landing Page' : 'Tambah Musik Landing Page', fields);
    if (result) {
        if (!result.title) {
            if (typeof window.uiAlert === 'function') window.uiAlert('Judul wajib diisi!');
            return;
        }
        
        if (!ev.landingMusic) ev.landingMusic = [];
        
        const newItem = {
            id: editItem ? editItem.id : 'landing_' + Date.now(),
            title: result.title,
            artist: result.artist || '',
            is_active: result.is_active === '1'
        };
        
        if (newItem.is_active) {
            ev.landingMusic.forEach(m => m.is_active = false);
        }
        
        if (editIndex >= 0) {
            ev.landingMusic[editIndex] = newItem;
        } else {
            ev.landingMusic.push(newItem);
        }
        
        if (!ev.metadata) ev.metadata = {};
        ev.metadata.landingMusic = ev.landingMusic;
        
        if (typeof window.renderAdminLandingMusicList === 'function') window.renderAdminLandingMusicList(ev);
        
        if (typeof window.showToast === 'function') window.showToast('Musik Landing Page berhasil disimpan!');
        if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    }
};

window.deleteLandingMusic = async function(index) {
    let ev = _getEv();
    if (!ev || !ev.landingMusic || !ev.landingMusic[index]) return;
    if (!(await window.uiConfirm(`Hapus musik: "${ev.landingMusic[index].title}"?`))) return;
    ev.landingMusic.splice(index, 1);
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.landingMusic = ev.landingMusic;
    if (typeof window.renderAdminLandingMusicList === 'function') window.renderAdminLandingMusicList(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};

window.toggleLandingMusic = function(index) {
    let ev = _getEv();
    if (!ev || !ev.landingMusic || !ev.landingMusic[index]) return;
    const currentState = ev.landingMusic[index].is_active;
    
    if (!currentState) {
        ev.landingMusic.forEach(m => m.is_active = false);
    }
    ev.landingMusic[index].is_active = !currentState;
    
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.landingMusic = ev.landingMusic;
    if (typeof window.renderAdminLandingMusicList === 'function') window.renderAdminLandingMusicList(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};

// --- SOUNDBOARD MODULE ---
window.checkAndGenerateDummySoundboard = function(currentEv) {
    if (!currentEv.soundboard || currentEv.soundboard.length === 0) {
        currentEv.soundboard = [
            { id: 'sb_1', title: 'Tepuk Tangan', shortcut: '1', is_brought: true },
            { id: 'sb_2', title: 'Drumroll', shortcut: '2', is_brought: true },
            { id: 'sb_3', title: 'Fanfare', shortcut: '3', is_brought: true },
            { id: 'sb_4', title: 'Laugh Track', shortcut: '4', is_brought: true },
            { id: 'sb_5', title: 'Buzzer Salah', shortcut: '5', is_brought: true },
            { id: 'sb_6', title: 'Chime Benar', shortcut: '6', is_brought: true }
        ];
        if (!currentEv.metadata) currentEv.metadata = {};
        currentEv.metadata.soundboard = currentEv.soundboard;
    }
};

window.renderAdminSoundboardList = function(currentEv) {
    if (!currentEv) return;
    window.checkAndGenerateDummySoundboard(currentEv);
    
    // Update Title
    const titleEl = document.getElementById('soundboardEventTitle');
    if (titleEl) titleEl.textContent = ' ' + (currentEv.title || '');
    
    const sbList = currentEv.soundboard || [];
    
    // Update KPI
    const kpiTotal = document.getElementById('sbMetricTotal');
    if (kpiTotal) kpiTotal.textContent = sbList.length + ' Sound';
    
    const kpiActive = document.getElementById('sbMetricActive'); // Assuming this exists or similar
    
    // 1. Render Grid Preview
    const gridContainer = document.getElementById('adminSoundboardGridPreview');
    if (gridContainer) {
        if (sbList.length === 0) {
            gridContainer.innerHTML = '<div style="color:var(--text-muted);">Belum ada sound effect.</div>';
        } else {
            let gridHtml = '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:1rem;">';
            sbList.forEach(item => {
                if (!item.is_brought) return;
                gridHtml += `
                    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:1rem; text-align:center; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='rgba(56,189,248,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'" onclick="alert('Memutar: ${item.title}')">
                        <div style="font-size:2rem; margin-bottom:0.5rem;">ðŸŽµ</div>
                        <div style="font-weight:700; font-size:0.85rem;">${item.title}</div>
                        <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:0.25rem;">[${item.shortcut}]</div>
                    </div>
                `;
            });
            gridHtml += '</div>';
            gridContainer.innerHTML = gridHtml;
        }
    }
    
    // 2. Render Table
    const tableContainer = document.getElementById('adminSoundboardTableContainer');
    if (tableContainer) {
        if (sbList.length === 0) {
            tableContainer.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-muted);">Belum ada efek suara.</div>';
            return;
        }
        
        let html = '<table class="ecc-table" style="width:100%; text-align:left; border-collapse:collapse;">';
        html += '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><th style="padding:1rem;">Judul Efek</th><th style="padding:1rem;">Tombol Shortcut</th><th style="padding:1rem;">Status Bawa (Stage Mode)</th><th style="padding:1rem; text-align:right;">Aksi</th></tr></thead>';
        html += '<tbody>';
        
        sbList.forEach((item, idx) => {
            let statusBadge = item.is_brought 
                ? '<span style="background:rgba(56,189,248,0.15); color:#38BDF8; padding:0.25rem 0.6rem; border-radius:9999px; font-size:0.75rem; font-weight:700;">ðŸ‘€ Dibawa</span>'
                : '<span style="background:rgba(255,255,255,0.1); color:var(--adm-text-secondary); padding:0.25rem 0.6rem; border-radius:9999px; font-size:0.75rem;">Disembunyikan</span>';
                
            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">';
            html += '<td style="padding:1rem; font-weight:700;">' + (item.title || 'Untitled') + '</td>';
            html += '<td style="padding:1rem;"><kbd style="background:#333; padding:0.2rem 0.5rem; border-radius:4px;">' + (item.shortcut || '-') + '</kbd></td>';
            html += '<td style="padding:1rem;">' + statusBadge + '</td>';
            html += '<td style="padding:1rem; text-align:right; white-space:nowrap;">';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.toggleSoundboardIsBrought(' + idx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);">' + (item.is_brought ? 'Sembunyikan' : 'Bawa') + '</button>';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.openAddSoundboardModal(' + idx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" title="Edit">âœ ï¸ </button>';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteSoundboard(' + idx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus">ðŸ—‘ï¸ </button>';
            html += '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        tableContainer.innerHTML = html;
    }
};

window.openAddSoundboardModal = async function(editIndex = -1) {
    let ev = _getEv();
    if (!ev) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    
    let editItem = null;
    if (editIndex >= 0 && ev.soundboard && ev.soundboard[editIndex]) {
        editItem = ev.soundboard[editIndex];
    }
    
    const fields = [
        { id: 'title', label: 'Judul Efek Suara *', type: 'text', value: editItem ? editItem.title : '' },
        { id: 'shortcut', label: 'Tombol Shortcut (Keyboard)', type: 'text', value: editItem ? editItem.shortcut : '' },
        { id: 'is_brought', label: 'Bawa ke Stage Mode?', type: 'select', options: [
            {value: '1', label: 'Ya, Tampilkan di Stage Mode'},
            {value: '0', label: 'Tidak, Sembunyikan'}
        ], value: editItem ? (editItem.is_brought ? '1' : '0') : '1' }
    ];

    const result = await window.uiFormModal(editItem ? 'Edit Sound Effect' : 'Tambah Sound Effect Baru', fields);
    if (result) {
        if (!result.title) {
            if (typeof window.uiAlert === 'function') window.uiAlert('Judul wajib diisi!');
            return;
        }
        
        if (!ev.soundboard) ev.soundboard = [];
        
        const newItem = {
            id: editItem ? editItem.id : 'sb_' + Date.now(),
            title: result.title,
            shortcut: result.shortcut || '',
            is_brought: result.is_brought === '1'
        };
        
        if (editIndex >= 0) {
            ev.soundboard[editIndex] = newItem;
        } else {
            ev.soundboard.push(newItem);
        }
        
        if (!ev.metadata) ev.metadata = {};
        ev.metadata.soundboard = ev.soundboard;
        
        window.renderAdminSoundboardList(ev);
        if (typeof window.showToast === 'function') window.showToast('Soundboard berhasil disimpan!');
        if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    }
};

window.deleteSoundboard = async function(index) {
    let ev = _getEv();
    if (!ev || !ev.soundboard || !ev.soundboard[index]) return;
    if (!(await window.uiConfirm(`Hapus efek suara: "${ev.soundboard[index].title}"?`))) return;
    ev.soundboard.splice(index, 1);
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.soundboard = ev.soundboard;
    window.renderAdminSoundboardList(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};

window.toggleSoundboardIsBrought = function(index) {
    let ev = _getEv();
    if (!ev || !ev.soundboard || !ev.soundboard[index]) return;
    ev.soundboard[index].is_brought = !ev.soundboard[index].is_brought;
    
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.soundboard = ev.soundboard;
    window.renderAdminSoundboardList(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
};

window.resetCurrentEventSoundboard = async function() {
    let ev = _getEv();
    if (!(await window.uiConfirm('Reset soundboard ke preset standar (6 Sound bawaan)? Semua kustomisasi akan hilang.'))) return;
    if (ev) {
        ev.soundboard = [];
        window.renderAdminSoundboardList(ev);
        if (typeof window.showToast === 'function') window.showToast('Soundboard dikembalikan ke standar.');
        if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    }
};

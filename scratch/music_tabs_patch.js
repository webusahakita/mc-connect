
// --- MUSIC TABS & LANDING PAGE MODULE ---
window.switchMusicSubtab = function(tabName) {
    // Hide all panels
    const bgmPanel = document.getElementById('musicSubtabBgm');
    const soundboardPanel = document.getElementById('musicSubtabSoundboard');
    const landingPanel = document.getElementById('musicSubtabLanding');
    
    if (bgmPanel) bgmPanel.style.display = 'none';
    if (soundboardPanel) soundboardPanel.style.display = 'none';
    if (landingPanel) landingPanel.style.display = 'none';
    
    // Remove active class from buttons
    const btnBgm = document.getElementById('btnSubtabBgm');
    const btnSoundboard = document.getElementById('btnSubtabSoundboard');
    const btnLanding = document.getElementById('btnSubtabLanding');
    
    if (btnBgm) btnBgm.classList.remove('active');
    if (btnSoundboard) btnSoundboard.classList.remove('active');
    if (btnLanding) btnLanding.classList.remove('active');
    
    // Show selected panel & set active
    if (tabName === 'bgm') {
        if (bgmPanel) bgmPanel.style.display = 'block';
        if (btnBgm) btnBgm.classList.add('active');
        if (typeof ev !== 'undefined' && ev) {
            checkAndGenerateDummyMusic(ev);
            window.renderAdminMusicListWrapper(ev);
        }
    } else if (tabName === 'soundboard') {
        if (soundboardPanel) soundboardPanel.style.display = 'block';
        if (btnSoundboard) btnSoundboard.classList.add('active');
        if (typeof window.renderAdminSoundboardList === 'function' && typeof ev !== 'undefined' && ev) {
            window.renderAdminSoundboardList(ev);
        }
    } else if (tabName === 'landing') {
        if (landingPanel) landingPanel.style.display = 'block';
        if (btnLanding) btnLanding.classList.add('active');
        if (typeof ev !== 'undefined' && ev) {
            window.renderAdminLandingMusicList(ev);
        }
    }
};

window.checkAndGenerateDummyMusic = function(currentEv) {
    if (!currentEv.musicList || currentEv.musicList.length === 0) {
        // Generate Dummy Data for BGM
        currentEv.musicList = [
            {
                id: 'music_dummy_1',
                title: 'Beautiful In White (Instrumental)',
                artist: 'Westlife',
                cue_instruction: 'Mulai dengan volume 30% lalu naikkan ke 80% saat pintu dibuka.',
                segment_idx: currentEv.rundown && currentEv.rundown.length > 0 ? 0 : null,
                category: 'Entrance'
            },
            {
                id: 'music_dummy_2',
                title: 'A Thousand Years',
                artist: 'Christina Perri',
                cue_instruction: 'Putar dari reff.',
                segment_idx: null, // Standby
                category: 'Ceremony'
            },
            {
                id: 'music_dummy_3',
                title: 'Jazz Lounge Background',
                artist: 'Various',
                cue_instruction: 'Looping, volume rendah.',
                segment_idx: null,
                category: 'BGM'
            }
        ];
        if (!currentEv.metadata) currentEv.metadata = {};
        currentEv.metadata.musicList = currentEv.musicList;
        
        if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) {
            window.syncEngine.pushEventsToServer();
        }
        if (typeof window.showToast === 'function') window.showToast('Data dummy BGM berhasil dimuat.');
    }
    
    // Generate Dummy Data for Landing
    if (!currentEv.landingMusic || currentEv.landingMusic.length === 0) {
        currentEv.landingMusic = [
            {
                id: 'landing_dummy_1',
                title: 'Romantic Piano Wedding',
                artist: 'Audio Library',
                is_active: true
            }
        ];
        if (!currentEv.metadata) currentEv.metadata = {};
        currentEv.metadata.landingMusic = currentEv.landingMusic;
    }
};

window.renderAdminLandingMusicList = function(currentEv) {
    const container = document.getElementById('adminLandingMusicContainer');
    if (!container) return;
    
    if (!currentEv || !currentEv.landingMusic || currentEv.landingMusic.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:3rem; background:rgba(255,255,255,0.02); border-radius:12px; color:var(--adm-text-muted);">Belum ada musik khusus landing page.<br><br><button class="btn btn-primary btn-sm" onclick="window.openAddLandingMusicModal()">+ Tambah Musik Pertama</button></div>';
        return;
    }
    
    let html = '<table class="ecc-table" style="width:100%; text-align:left; border-collapse:collapse;">';
    html += '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><th style="padding:1rem;">Judul Musik / Audio</th><th style="padding:1rem;">Status Putar</th><th style="padding:1rem; text-align:right;">Aksi</th></tr></thead>';
    html += '<tbody>';
    
    currentEv.landingMusic.forEach((item, idx) => {
        let statusBadge = item.is_active 
            ? '<span style="background:rgba(16,185,129,0.15); color:#34D399; border:1px solid #10B981; padding:0.25rem 0.6rem; border-radius:9999px; font-size:0.75rem; font-weight:700;">Aktif (Auto-play di web)</span>'
            : '<span style="background:rgba(255,255,255,0.1); color:var(--adm-text-secondary); padding:0.25rem 0.6rem; border-radius:9999px; font-size:0.75rem;">Tidak Aktif</span>';
            
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.02)\'" onmouseout="this.style.background=\'transparent\'">';
        html += '<td style="padding:1rem;">';
        html += '<div style="font-weight:700; font-size:1.05rem; color:#FFF; margin-bottom:0.3rem;">' + escapeHtml(item.title || 'Untitled') + '</div>';
        html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + escapeHtml(item.artist || 'Unknown') + '</div>';
        html += '</td>';
        html += '<td style="padding:1rem;">' + statusBadge + '</td>';
        html += '<td style="padding:1rem; text-align:right; white-space:nowrap;">';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.toggleLandingMusic(' + idx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);">' + (item.is_active ? 'Nonaktifkan' : 'Aktifkan') + '</button>';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.openAddLandingMusicModal(' + idx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" title="Edit">âœ ï¸ </button>';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteLandingMusic(' + idx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus">ðŸ—‘ï¸ </button>';
        html += '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
};

window.openAddLandingMusicModal = async function(editIndex = -1) {
    if (typeof ev === 'undefined' || !ev) {
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
        
        // If this one is active, deactivate others
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
        
        window.renderAdminLandingMusicList(ev);
        
        if (typeof window.showToast === 'function') window.showToast('Musik Landing Page berhasil disimpan!');
        if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) {
            window.syncEngine.pushEventsToServer();
        }
    }
};

window.deleteLandingMusic = async function(index) {
    if (!ev || !ev.landingMusic || !ev.landingMusic[index]) return;
    if (!(await window.uiConfirm(`Hapus musik: "${ev.landingMusic[index].title}"?`))) return;
    ev.landingMusic.splice(index, 1);
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.landingMusic = ev.landingMusic;
    window.renderAdminLandingMusicList(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) {
        window.syncEngine.pushEventsToServer();
    }
};

window.toggleLandingMusic = function(index) {
    if (!ev || !ev.landingMusic || !ev.landingMusic[index]) return;
    const currentState = ev.landingMusic[index].is_active;
    
    if (!currentState) {
        // If activating, deactivate others
        ev.landingMusic.forEach(m => m.is_active = false);
    }
    
    ev.landingMusic[index].is_active = !currentState;
    
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.landingMusic = ev.landingMusic;
    window.renderAdminLandingMusicList(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) {
        window.syncEngine.pushEventsToServer();
    }
};

// Hook into the original render wrapper to ensure checkAndGenerate is called on load
let originalRenderAdminMusicListWrapper = window.renderAdminMusicListWrapper;
window.renderAdminMusicListWrapper = function(currentEv) {
    if (currentEv) {
        checkAndGenerateDummyMusic(currentEv);
    }
    if (typeof originalRenderAdminMusicListWrapper === 'function') {
        originalRenderAdminMusicListWrapper(currentEv);
    }
};

// Initialize if ev exists and music tab is active
if (typeof ev !== 'undefined' && ev) {
    const bgmPanel = document.getElementById('musicSubtabBgm');
    if (bgmPanel && bgmPanel.style.display !== 'none') {
        checkAndGenerateDummyMusic(ev);
        window.renderAdminMusicListWrapper(ev);
    }
}

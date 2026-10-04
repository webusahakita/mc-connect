const fs = require('fs');
const file = 'public/js/admin-core.js';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const missingCode = `
window.switchMusicSubtab = function(tabName) {
    let ev = _getEv();
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
        if (ev) {
            if (typeof window.checkAndGenerateDummyMusic === 'function') window.checkAndGenerateDummyMusic(ev);
            if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
        }
    } else if (tabName === 'soundboard') {
        if (soundboardPanel) soundboardPanel.style.display = 'block';
        if (btnSoundboard) btnSoundboard.classList.add('active');
        if (ev) {
            window.renderAdminSoundboardList(ev);
        }
    } else if (tabName === 'landing') {
        if (landingPanel) landingPanel.style.display = 'block';
        if (btnLanding) btnLanding.classList.add('active');
        if (ev) {
            window.renderAdminLandingMusicList(ev);
        }
    }
};

window.checkAndGenerateDummyMusic = function(currentEv) {
    if (!currentEv) return;
    
    if (!currentEv.musicList || currentEv.musicList.length === 0) {
        currentEv.musicList = [
            {
                id: 'dummy_bgm_1',
                title: 'Beautiful In White',
                artist: 'Westlife',
                category: 'Entrance',
                segment_idx: null,
                cue_instruction: 'Mainkan reff saat pintu terbuka'
            },
            {
                id: 'dummy_bgm_2',
                title: 'A Thousand Years',
                artist: 'Christina Perri',
                category: 'BGM',
                segment_idx: null,
                cue_instruction: 'Volume rendah sebagai background'
            }
        ];
        if (!currentEv.metadata) currentEv.metadata = {};
        currentEv.metadata.musicList = currentEv.musicList;
    }
    
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
            
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background=\\'rgba(255,255,255,0.02)\\'" onmouseout="this.style.background=\\'transparent\\'">';
        html += '<td style="padding:1rem;">';
        html += '<div style="font-weight:700; font-size:1.05rem; color:#FFF; margin-bottom:0.3rem;">' + (item.title || 'Untitled') + '</div>';
        html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + (item.artist || 'Unknown') + '</div>';
        html += '</td>';
        html += '<td style="padding:1rem;">' + statusBadge + '</td>';
        html += '<td style="padding:1rem; text-align:right; white-space:nowrap;">';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.toggleLandingMusic(' + idx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);">' + (item.is_active ? 'Nonaktifkan' : 'Aktifkan') + '</button>';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.openAddLandingMusicModal(' + idx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" title="Edit">✏️</button>';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteLandingMusic(' + idx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus">🗑️</button>';
        html += '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
};

// Hook into the original render wrapper to ensure checkAndGenerate is called on load
if (typeof window.originalRenderAdminMusicListWrapper === 'undefined') {
    window.originalRenderAdminMusicListWrapper = window.renderAdminMusicListWrapper || function(){};
}
window.renderAdminMusicListWrapper = function(currentEv) {
    if (currentEv) {
        window.checkAndGenerateDummyMusic(currentEv);
    }
    if (typeof window.originalRenderAdminMusicListWrapper === 'function') {
        window.originalRenderAdminMusicListWrapper(currentEv);
    }
};

// Initialize if ev exists and music tab is active
setTimeout(() => {
    let ev = _getEv();
    if (ev) {
        const bgmPanel = document.getElementById('musicSubtabBgm');
        if (bgmPanel && bgmPanel.style.display !== 'none') {
            window.checkAndGenerateDummyMusic(ev);
            window.renderAdminMusicListWrapper(ev);
        }
    }
}, 500);
`;

lines.push(missingCode);
fs.writeFileSync(file, lines.join('\n'));
console.log('Restored missing functions: switchMusicSubtab, renderAdminLandingMusicList, checkAndGenerateDummyMusic, renderAdminMusicListWrapper');

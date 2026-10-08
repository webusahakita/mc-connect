const fs = require('fs');

let adminCore = fs.readFileSync('public/js/admin-core.js', 'utf8');

// The original openAddLandingMusicModal ends around line 5003 where it has `window.renderAdminLandingMusicListWrapper(ev);`
// Let's use regex to replace the whole function.

const newFunction = `window.openAddLandingMusicModal = async function(editIndex = -1) {
    let ev = _getEv();
    if (!ev) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    
    let editItem = null;
    if (editIndex >= 0 && ev.landingMusic && ev.landingMusic[editIndex]) {
        editItem = ev.landingMusic[editIndex];
    }
    
    const bank = window.getGlobalMusicBank();
    let bankOptionsHtml = '';
    if (bank && bank.length > 0) {
        bank.forEach((b, idx) => {
            let isSelected = false;
            if (editItem && editItem.title === b.title && (editItem.artist || '') === (b.artist || '')) {
                isSelected = true;
            }
            bankOptionsHtml += \`<option value="\${idx}" \${isSelected ? 'selected' : ''}>\${b.title} \${b.artist ? '- ' + b.artist : ''}</option>\`;
        });
    } else {
        bankOptionsHtml = '<option value="" disabled>-- Master Bank Kosong, silakan isi dulu --</option>';
    }
    
    const modalId = 'modalLandingMusicForm';
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
                <h3 class="modal-title">\${editItem ? '✏️ Edit Musik Landing Page' : '🎵 Tambah Musik Landing Page'}</h3>
                <button class="modal-close" onclick="document.getElementById('\${modalId}').style.display='none'; document.getElementById('\${modalId}').classList.remove('active');">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="lmFormIdx" value="\${editIndex >= 0 ? editIndex : ''}">
                
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1.5rem;">
                    <label class="form-label" style="color:var(--adm-gold); font-size:1.1rem; margin-bottom:0.8rem;">Pilih Lagu dari Master Bank *</label>
                    <select class="form-select" id="lmFormBankSelect" style="font-size:1.05rem; padding:0.6rem;">
                        <option value="">-- Pilih Lagu --</option>
                        \${bankOptionsHtml}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Status Auto-play di Landing Page</label>
                    <select class="form-select" id="lmFormStatus">
                        <option value="1" \${editItem && editItem.is_active ? 'selected' : ''}>Aktif (Berputar Otomatis)</option>
                        <option value="0" \${editItem && !editItem.is_active ? 'selected' : ''}>Tidak Aktif (Mute Default)</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('\${modalId}').style.display='none'; document.getElementById('\${modalId}').classList.remove('active');">Batal</button>
                <button class="btn btn-primary" onclick="window.saveLandingMusicForm()">Simpan Musik</button>
            </div>
        </div>
    \`;
    
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.classList.add('active');
};

window.saveLandingMusicForm = async function() {
    const idxStr = document.getElementById('lmFormIdx').value;
    const bankIdxStr = document.getElementById('lmFormBankSelect').value;
    const is_active = document.getElementById('lmFormStatus').value === '1';
    
    if (bankIdxStr === '') return window.uiAlert('Pilih lagu dari Master Bank terlebih dahulu!');
    
    let ev = _getEv();
    if (!ev) return;
    if (!ev.landingMusic) ev.landingMusic = [];
    
    const bank = window.getGlobalMusicBank();
    const selectedBankItem = bank[parseInt(bankIdxStr)];
    if (!selectedBankItem) return window.uiAlert('Lagu di Master Bank tidak ditemukan!');
    
    const newItem = {
        id: (idxStr !== '') ? ev.landingMusic[parseInt(idxStr)].id : 'landing_' + Date.now(),
        title: selectedBankItem.title,
        artist: selectedBankItem.artist,
        url_link: selectedBankItem.url_link,
        file_upload: selectedBankItem.file_upload,
        is_active: is_active
    };
    
    if (idxStr !== '') {
        ev.landingMusic[parseInt(idxStr)] = newItem;
    } else {
        ev.landingMusic.push(newItem);
    }
    
    ev.metadata = ev.metadata || {};
    ev.metadata.landingMusic = ev.landingMusic;
    // _setEv(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    
    document.getElementById('modalLandingMusicForm').style.display = 'none';
    document.getElementById('modalLandingMusicForm').classList.remove('active');
    
    if (typeof window.renderAdminLandingMusicListWrapper === 'function') {
        window.renderAdminLandingMusicListWrapper(ev);
    } else if (typeof window.renderAdminLandingMusicList === 'function') {
        window.renderAdminLandingMusicList(ev);
    }
};
`;

// Replace the old function. It starts at `window.openAddLandingMusicModal = async function(editIndex = -1) {`
// and ends right before `window.deleteLandingMusic = async function(index) {`

const startIndex = adminCore.indexOf('window.openAddLandingMusicModal = async function(editIndex = -1) {');
const endIndex = adminCore.indexOf('window.deleteLandingMusic = async function(index) {');

if (startIndex !== -1 && endIndex !== -1) {
    adminCore = adminCore.substring(0, startIndex) + newFunction + '\n\n' + adminCore.substring(endIndex);
    fs.writeFileSync('public/js/admin-core.js', adminCore, 'utf8');
    console.log('Successfully replaced openAddLandingMusicModal and added saveLandingMusicForm');
} else {
    console.error('Could not find start or end index for replacement');
}

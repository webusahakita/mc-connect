const fs = require('fs');

let adminCore = fs.readFileSync('public/js/admin-core.js', 'utf8');

const newFunction = `window.openAddSoundboardModal = async function(editIndex = -1) {
    let ev = _getEv();
    if (!ev) {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pilih acara terlebih dahulu!');
        return;
    }
    
    let editItem = null;
    if (editIndex >= 0 && ev.soundboard && ev.soundboard[editIndex]) {
        editItem = ev.soundboard[editIndex];
    }
    
    const bank = window.getGlobalMusicBank();
    let bankOptionsHtml = '';
    if (bank && bank.length > 0) {
        bank.forEach((b, idx) => {
            let isSelected = false;
            if (editItem && editItem.title === b.title) {
                isSelected = true;
            }
            bankOptionsHtml += \`<option value="\${idx}" \${isSelected ? 'selected' : ''}>\${b.title} \${b.artist ? '- ' + b.artist : ''}</option>\`;
        });
    } else {
        bankOptionsHtml = '<option value="" disabled>-- Master Bank Kosong, silakan isi dulu --</option>';
    }
    
    const modalId = 'modalSoundboardForm';
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
                <h3 class="modal-title">\${editItem ? '✏️ Edit Sound Effect' : '🎵 Tambah Sound Effect Baru'}</h3>
                <button class="modal-close" onclick="document.getElementById('\${modalId}').style.display='none'; document.getElementById('\${modalId}').classList.remove('active');">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="sbFormIdx" value="\${editIndex >= 0 ? editIndex : ''}">
                
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1.5rem;">
                    <label class="form-label" style="color:var(--adm-gold); font-size:1.1rem; margin-bottom:0.8rem;">Pilih Sound Effect dari Master Bank *</label>
                    <select class="form-select" id="sbFormBankSelect" style="font-size:1.05rem; padding:0.6rem;">
                        <option value="">-- Pilih Efek Suara --</option>
                        \${bankOptionsHtml}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Tombol Shortcut (Keyboard 0-9)</label>
                    <input type="text" class="form-input" id="sbFormShortcut" value="\${editItem ? editItem.shortcut : ''}" placeholder="Misal: 1">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Bawa ke Stage Mode?</label>
                    <select class="form-select" id="sbFormBrought">
                        <option value="1" \${editItem && editItem.is_brought ? 'selected' : ''}>Ya, Tampilkan di Stage Mode</option>
                        <option value="0" \${editItem && !editItem.is_brought ? 'selected' : ''}>Tidak, Sembunyikan</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('\${modalId}').style.display='none'; document.getElementById('\${modalId}').classList.remove('active');">Batal</button>
                <button class="btn btn-primary" onclick="window.saveSoundboardForm()">Simpan Sound Effect</button>
            </div>
        </div>
    \`;
    
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.classList.add('active');
};

window.saveSoundboardForm = async function() {
    const idxStr = document.getElementById('sbFormIdx').value;
    const bankIdxStr = document.getElementById('sbFormBankSelect').value;
    const shortcut = document.getElementById('sbFormShortcut').value;
    const is_brought = document.getElementById('sbFormBrought').value === '1';
    
    if (bankIdxStr === '') return window.uiAlert('Pilih lagu dari Master Bank terlebih dahulu!');
    
    let ev = _getEv();
    if (!ev) return;
    if (!ev.soundboard) ev.soundboard = [];
    
    const bank = window.getGlobalMusicBank();
    const selectedBankItem = bank[parseInt(bankIdxStr)];
    if (!selectedBankItem) return window.uiAlert('Lagu di Master Bank tidak ditemukan!');
    
    const newItem = {
        id: (idxStr !== '') ? ev.soundboard[parseInt(idxStr)].id : 'sb_' + Date.now(),
        title: selectedBankItem.title,
        shortcut: shortcut,
        is_brought: is_brought
    };
    
    if (idxStr !== '') {
        ev.soundboard[parseInt(idxStr)] = newItem;
    } else {
        ev.soundboard.push(newItem);
    }
    
    ev.metadata = ev.metadata || {};
    ev.metadata.soundboard = ev.soundboard;
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    
    document.getElementById('modalSoundboardForm').style.display = 'none';
    document.getElementById('modalSoundboardForm').classList.remove('active');
    
    window.renderAdminSoundboardList(ev);
    if (typeof window.showToast === 'function') window.showToast('Soundboard berhasil disimpan!');
};
`;

const startIndex = adminCore.indexOf('window.openAddSoundboardModal = async function(editIndex = -1) {');
const endIndex = adminCore.indexOf('window.deleteSoundboard = async function(index) {');

if (startIndex !== -1 && endIndex !== -1) {
    adminCore = adminCore.substring(0, startIndex) + newFunction + '\n\n' + adminCore.substring(endIndex);
    fs.writeFileSync('public/js/admin-core.js', adminCore, 'utf8');
    console.log('Successfully replaced openAddSoundboardModal');
} else {
    console.error('Could not find start or end index for replacement');
}

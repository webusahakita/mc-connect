const fs = require('fs');

// 1. UPDATE admin.html
const htmlFile = 'public/admin.html';
let htmlCode = fs.readFileSync(htmlFile, 'utf8');

const targetHtml = `                                <button class="btn music-subtab-btn" id="btnSubtabLanding"
                                    onclick="switchMusicSubtab('landing')">
                                    <span>&#127760; Musik Landing Page</span>
                                </button>
                            </div>`;
const newHtml = `                                <button class="btn music-subtab-btn" id="btnSubtabLanding"
                                    onclick="switchMusicSubtab('landing')">
                                    <span>&#127760; Musik Landing Page</span>
                                </button>
                                <button class="btn music-subtab-btn" style="margin-left:auto; border:1px solid rgba(212,175,55,0.4) !important; color:var(--adm-gold) !important;" onclick="window.openManageMusicBank()">
                                    <span>&#128194; Kelola Bank Musik Master</span>
                                </button>
                            </div>`;

// Use simple replacement ignoring exact spacing by replacing just the ending div
htmlCode = htmlCode.replace(/(onclick="switchMusicSubtab\('landing'\)">\s*<span>.*Musik Landing Page<\/span>\s*<\/button>\s*)<\/div>/, '$1<button class="btn music-subtab-btn" style="margin-left:auto; border:1px solid rgba(212,175,55,0.4) !important; color:var(--adm-gold) !important; background:rgba(212,175,55,0.1) !important;" onclick="window.openManageMusicBank()"><span>&#128194; Kelola Bank Musik Master</span></button></div>');
htmlCode = htmlCode.replace(/&#127760;/g, '&#127760;').replace(/ðŸŒ /g, '&#127760;'); // fix garbled globe icon while at it
fs.writeFileSync(htmlFile, htmlCode);
console.log('Modified admin.html to add Kelola Bank button');

// 2. UPDATE admin-core.js
const jsFile = 'public/js/admin-core.js';
let jsCode = fs.readFileSync(jsFile, 'utf8');

const bankLogic = `
// ==========================================
// MASTER MUSIC BANK MODULE
// ==========================================
window.getGlobalMusicBank = function() {
    let bank = [];
    try {
        const raw = localStorage.getItem('mc_music_bank_data');
        if (raw) bank = JSON.parse(raw);
    } catch(e){}
    
    // If empty, supply dummies
    if (!Array.isArray(bank) || bank.length === 0) {
        bank = [
            { id: 'bank_1', title: 'Wedding March (Bridal Chorus)', artist: 'Richard Wagner', url_link: '', file_upload: 'wedding_march.mp3', type: 'BGM' },
            { id: 'bank_2', title: 'A Thousand Years', artist: 'Christina Perri', url_link: 'https://youtube.com/watch?v=rtOvBOTyX00', file_upload: '', type: 'BGM' },
            { id: 'bank_3', title: 'Drumroll Suspens', artist: 'SFX', url_link: '', file_upload: 'drumroll.wav', type: 'SFX' },
            { id: 'bank_4', title: 'Applause / Tepuk Tangan', artist: 'SFX', url_link: '', file_upload: 'applause.wav', type: 'SFX' }
        ];
        localStorage.setItem('mc_music_bank_data', JSON.stringify(bank));
        if (window.syncEngine && window.syncEngine.push) {
            window.syncEngine.push('/api/cms/music-bank', { data: bank });
        }
    }
    return bank;
};

window.saveGlobalMusicBank = function(bank) {
    localStorage.setItem('mc_music_bank_data', JSON.stringify(bank));
    if (window.syncEngine && window.syncEngine.push) {
        window.syncEngine.push('/api/cms/music-bank', { data: bank });
    }
};

window.openManageMusicBank = async function() {
    const bank = window.getGlobalMusicBank();
    let html = '<div style="max-height:500px; overflow-y:auto; padding-right:0.5rem;">';
    if (bank.length === 0) {
        html += '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Bank musik masih kosong.</div>';
    } else {
        bank.forEach((m, idx) => {
            html += '<div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border:1px solid rgba(255,255,255,0.1); border-radius:8px; margin-bottom:0.75rem; background:rgba(0,0,0,0.2);">';
            html += '<div>';
            html += '<div style="font-weight:bold; color:#FFF; font-size:1.1rem; margin-bottom:0.2rem;">' + m.title + '</div>';
            html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + (m.artist || 'Unknown') + ' | ' + (m.type || 'Lainnya') + '</div>';
            html += '<div style="font-size:0.75rem; color:var(--adm-text-secondary); margin-top:0.3rem;">' + (m.url_link ? '&#128279; ' + m.url_link : (m.file_upload ? '&#128194; ' + m.file_upload : '')) + '</div>';
            html += '</div>';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteMusicBankItem(' + idx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);">Hapus</button>';
            html += '</div>';
        });
    }
    html += '</div>';
    
    // Show using simple uiAlert but with a big trick: we can't easily put custom HTML in uiAlert.
    // Let's create a custom modal for it!
    const modalId = 'modalMusicBankManage';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.style.zIndex = '999999';
        overlay.innerHTML = \`
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h3 class="modal-title">&#128194; Manajemen Bank Musik Master</h3>
                    <button class="modal-close" onclick="document.getElementById('\${modalId}').style.display='none'">&times;</button>
                </div>
                <div class="modal-body" id="musicBankBody">\${html}</div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('\${modalId}').style.display='none'">Tutup</button>
                    <button class="btn btn-primary" onclick="window.uiAlert('Untuk menambah lagu ke bank, gunakan tombol + Tambah Lagu pada acara, dan pilih Opsi \\'Simpan ke Bank Musik Master\\'.')">+ Cara Tambah Lagu</button>
                </div>
            </div>
        \`;
        document.body.appendChild(overlay);
    } else {
        document.getElementById('musicBankBody').innerHTML = html;
        overlay.style.display = 'flex';
    }
};

window.deleteMusicBankItem = async function(idx) {
    const bank = window.getGlobalMusicBank();
    if (await window.uiConfirm('Hapus lagu ini dari Bank Musik Master? Lagu yang sudah di-import ke acara tidak akan terhapus.')) {
        bank.splice(idx, 1);
        window.saveGlobalMusicBank(bank);
        window.openManageMusicBank();
    }
};

window.showMusicBankSelector = function() {
    const bank = window.getGlobalMusicBank();
    
    const modalId = 'modalMusicBankSelect';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.style.zIndex = '9999999'; // above uiFormModal
        document.body.appendChild(overlay);
    }
    
    let html = '<div style="max-height:400px; overflow-y:auto;">';
    if (bank.length === 0) {
        html += '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Bank musik masih kosong.</div>';
    } else {
        bank.forEach((m, idx) => {
            html += '<div onclick="window.selectBankItem(' + idx + ')" style="display:flex; flex-direction:column; padding:0.8rem; border:1px solid rgba(255,255,255,0.1); border-radius:8px; margin-bottom:0.5rem; cursor:pointer; background:rgba(0,0,0,0.2);" onmouseover="this.style.background=\\'rgba(212,175,55,0.1)\\'" onmouseout="this.style.background=\\'rgba(0,0,0,0.2)\\'">';
            html += '<div style="font-weight:bold; color:#FFF; margin-bottom:0.2rem;">' + m.title + '</div>';
            html += '<div style="font-size:0.8rem; color:var(--adm-gold);">' + (m.artist || 'Unknown') + '</div>';
            html += '</div>';
        });
    }
    html += '</div>';
    
    overlay.innerHTML = \`
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3 class="modal-title">🎵 Impor dari Bank Musik</h3>
                <button class="modal-close" onclick="document.getElementById('\${modalId}').style.display='none'">&times;</button>
            </div>
            <div class="modal-body">\${html}</div>
            <div class="modal-footer">
                <button class="btn btn-secondary" style="width:100%;" onclick="document.getElementById('\${modalId}').style.display='none'">Batal</button>
            </div>
        </div>
    \`;
    overlay.style.display = 'flex';
};

window.selectBankItem = function(idx) {
    const bank = window.getGlobalMusicBank();
    const m = bank[idx];
    if (m) {
        const titleIn = document.getElementById('title');
        const artistIn = document.getElementById('artist');
        const urlIn = document.getElementById('url_link');
        const fileIn = document.getElementById('file_upload');
        
        if (titleIn) titleIn.value = m.title;
        if (artistIn) artistIn.value = m.artist || '';
        
        if (m.url_link && urlIn) {
            urlIn.value = m.url_link;
            urlIn.dispatchEvent(new Event('input'));
        } else if (m.file_upload) {
            // Cannot programmatically set file input value, so we alert/hint
            if (urlIn) {
                urlIn.value = '';
                urlIn.dispatchEvent(new Event('input'));
            }
            if (fileIn) {
                fileIn.disabled = true;
                fileIn.parentElement.innerHTML += '<div style="margin-top:0.5rem; font-size:0.8rem; color:#10B981;">&#10004; Menggunakan file tersimpan: ' + m.file_upload + '</div>';
                // Fake a file object in the custom form logic by attaching data to the window? 
                // Better yet, just put it in a hidden field or window variable.
                window._pendingBankFile = m.file_upload;
            }
        }
        document.getElementById('modalMusicBankSelect').style.display = 'none';
        window.showToast('Lagu berhasil di-impor dari Bank!', 'green');
    }
};
`;

// Insert the new logic before window.openAddMusicModal
jsCode = jsCode.replace('window.openAddMusicModal = async function', bankLogic + '\nwindow.openAddMusicModal = async function');

// Add "save_to_bank" field to openAddMusicModal
const addMusicFieldRegex = /{ id: 'category', label: 'Kategori Momen'/;
jsCode = jsCode.replace(addMusicFieldRegex, `{ id: 'save_to_bank', label: 'Simpan ke Bank Musik Master untuk dipakai lagi di acara lain', type: 'select', options: [{value: '1', label: 'Ya, Simpan'}, {value: '0', label: 'Tidak perlu'}], value: '1' },\n          { id: 'category', label: 'Kategori Momen'`);

// Add the import button injection inside the setTimeout of openAddMusicModal
const injectionLogic = `
          // Inject "Import from Bank" button
          const modalBody = document.querySelector('.modal-body');
          if (modalBody && !document.getElementById('btnImportBank')) {
              const btn = document.createElement('button');
              btn.id = 'btnImportBank';
              btn.className = 'btn btn-primary';
              btn.style.width = '100%';
              btn.style.marginBottom = '1.5rem';
              btn.style.background = 'linear-gradient(135deg, var(--adm-gold), #FDE047)';
              btn.style.color = '#000';
              btn.style.fontWeight = 'bold';
              btn.innerHTML = '🎵 Impor Lagu dari Bank Master';
              btn.onclick = () => window.showMusicBankSelector();
              modalBody.insertBefore(btn, modalBody.firstChild);
          }
`;
jsCode = jsCode.replace('if (linkInput && fileInput) {', injectionLogic + '\n              if (linkInput && fileInput) {');

// Handle saving to global bank and parsing _pendingBankFile
const saveLogic = `
        let finalFileUpload = result.file_upload ? (typeof result.file_upload === 'object' ? result.file_upload.name : result.file_upload) : (editItem ? editItem.file_upload : '');
        if (window._pendingBankFile) {
            finalFileUpload = window._pendingBankFile;
            delete window._pendingBankFile;
        }
        
        const newItem = {
            id: editItem ? editItem.id : 'music_' + Date.now(),
            title: result.title,
            artist: result.artist || '',
            url_link: result.url_link || '',
            file_upload: finalFileUpload,
            cue_instruction: result.cue_instruction || '',
            segment_idx: result.segment_idx === '' ? null : parseInt(result.segment_idx),
            category: result.category || 'BGM'
        };
        
        if (result.save_to_bank === '1') {
            const bank = window.getGlobalMusicBank();
            const exists = bank.find(m => m.title.toLowerCase() === newItem.title.toLowerCase());
            if (!exists) {
                bank.push({
                    id: 'bank_' + Date.now(),
                    title: newItem.title,
                    artist: newItem.artist,
                    url_link: newItem.url_link,
                    file_upload: newItem.file_upload,
                    type: 'BGM'
                });
                window.saveGlobalMusicBank(bank);
            }
        }
`;
// Replace the old newItem creation block
const oldNewItemBlockRegex = /const newItem = {[\s\S]*?category: result\.category \|\| 'BGM'\s*};/;
jsCode = jsCode.replace(oldNewItemBlockRegex, saveLogic);

// Repeat similar injection for openAddLandingMusicModal
const landingFieldRegex = /{ id: 'is_active', label: 'Status', type: 'select'/;
jsCode = jsCode.replace(landingFieldRegex, `{ id: 'save_to_bank', label: 'Simpan ke Bank Musik Master untuk dipakai lagi', type: 'select', options: [{value: '1', label: 'Ya, Simpan'}, {value: '0', label: 'Tidak perlu'}], value: '1' },\n          { id: 'is_active', label: 'Status', type: 'select'`);
jsCode = jsCode.replace('if (linkInput && fileInput) {', injectionLogic + '\n              if (linkInput && fileInput) {');

// Handle landing saving logic
const saveLogicLanding = `
        let finalFileUpload = result.file_upload ? (typeof result.file_upload === 'object' ? result.file_upload.name : result.file_upload) : (editItem ? editItem.file_upload : '');
        if (window._pendingBankFile) {
            finalFileUpload = window._pendingBankFile;
            delete window._pendingBankFile;
        }
        
        const newItem = {
            id: editItem ? editItem.id : 'landing_' + Date.now(),
            title: result.title,
            artist: result.artist || '',
            url_link: result.url_link || '',
            file_upload: finalFileUpload,
            is_active: result.is_active === '1'
        };
        
        if (result.save_to_bank === '1') {
            const bank = window.getGlobalMusicBank();
            const exists = bank.find(m => m.title.toLowerCase() === newItem.title.toLowerCase());
            if (!exists) {
                bank.push({
                    id: 'bank_' + Date.now(),
                    title: newItem.title,
                    artist: newItem.artist,
                    url_link: newItem.url_link,
                    file_upload: newItem.file_upload,
                    type: 'BGM'
                });
                window.saveGlobalMusicBank(bank);
            }
        }
`;
const oldNewItemLandingBlockRegex = /const newItem = {[\s\S]*?is_active: result\.is_active === '1'\s*};/;
jsCode = jsCode.replace(oldNewItemLandingBlockRegex, saveLogicLanding);

fs.writeFileSync(jsFile, jsCode);
console.log('Modified admin-core.js to implement Master Music Bank logic');

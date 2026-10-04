const fs = require('fs');

let code = fs.readFileSync('scratch/admin-core.orig.js', 'utf8');

// 0. APPEND MISSING PATCHES FROM PREVIOUS SESSION
code += '\n' + fs.readFileSync('scratch/final_music_patch.js', 'utf8');

let missingFn = fs.readFileSync('scratch/restore_missing_functions.cjs', 'utf8');
missingFn = missingFn.split('const missingCode = `')[1].split('`')[0];
code += '\n' + missingFn;

let fullRender = fs.readFileSync('scratch/restore_full_renderer.cjs', 'utf8');
fullRender = fullRender.split('const hookStr = `')[1].split('`')[0];
code += '\n' + fullRender;

// 1. FIX ALERTS AND ICONS
code = code.replace(
    "previewAction = \"alert('Hanya lagu dengan Link URL (Spotify/Youtube) yang dapat di-preview secara langsung.')\";",
    "previewAction = \"window.uiAlert('Hanya lagu dengan Link URL (Spotify/Youtube) yang dapat di-preview secara langsung.')\";"
);
code = code.replace(
    "previewAction = \"alert('File audio tersimpan secara lokal. Putar musik ini di Stage Mode (FOH/DJ).')\";",
    "previewAction = \"window.uiAlert('File audio tersimpan secara lokal. Putar musik ini di Stage Mode (FOH/DJ).')\";"
);
code = code.replace(/onclick="alert\('Memutar/g, "onclick=\"window.uiAlert('Memutar");

const editSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
const trashSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
const arrowSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
const checkSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
const xSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

code = code.replace(/âœ ï¸ /g, editSvg);
code = code.replace(/âœ /g, editSvg);
code = code.replace(/âœT_/g, editSvg);
code = code.replace(/âœT/g, editSvg);
code = code.replace(/ðŸ—‘ï¸ /g, trashSvg);
code = code.replace(/ðŸ—‘/g, trashSvg);
code = code.replace(/ðŸ—‘\./g, trashSvg);
code = code.replace(/âž¡ï¸ /g, arrowSvg);
code = code.replace(/âž¡/g, arrowSvg);
code = code.replace(/âœ…/g, checkSvg);
code = code.replace(/âœ•/g, xSvg);
code = code.replace(/ðŸ—_/g, trashSvg);

// 2. PATCH MUSIC EXCLUSION
const targetStr = "const result = await window.uiFormModal(editItem ? 'Edit Lagu Acara' : 'Tambah Lagu Acara (Terintegrasi)', fields);";
const mutualExclusionLogic = `
      setTimeout(() => {
          const linkInput = document.getElementById('url_link');
          const fileInput = document.getElementById('file_upload');
          if (linkInput && fileInput) {
              if (linkInput.value.trim() !== '') {
                  fileInput.disabled = true;
                  fileInput.parentElement.style.opacity = '0.5';
              }
              linkInput.addEventListener('input', () => {
                  if (linkInput.value.trim() !== '') {
                      fileInput.disabled = true;
                      fileInput.parentElement.style.opacity = '0.5';
                      fileInput.title = 'Hapus URL link terlebih dahulu untuk upload file';
                  } else {
                      fileInput.disabled = false;
                      fileInput.parentElement.style.opacity = '1';
                      fileInput.title = '';
                  }
              });
              fileInput.addEventListener('change', () => {
                  if (fileInput.files.length > 0) {
                      linkInput.disabled = true;
                      linkInput.value = '';
                      linkInput.parentElement.style.opacity = '0.5';
                      linkInput.placeholder = 'Hapus file untuk mengisi link URL';
                  } else {
                      linkInput.disabled = false;
                      linkInput.parentElement.style.opacity = '1';
                      linkInput.placeholder = '';
                  }
              });
          }
      }, 100);
      const result = await window.uiFormModal(editItem ? 'Edit Lagu Acara' : 'Tambah Lagu Acara (Terintegrasi)', fields);`;
code = code.replace(targetStr, mutualExclusionLogic);

const targetStr2 = "const result = await window.uiFormModal(editItem ? 'Edit Musik Landing Page' : 'Tambah Musik Landing Page', fields);";
const mutualExclusionLogic2 = `
      setTimeout(() => {
          const linkInput = document.getElementById('url_link');
          const fileInput = document.getElementById('file_upload');
          if (linkInput && fileInput) {
              if (linkInput.value.trim() !== '') {
                  fileInput.disabled = true;
                  fileInput.parentElement.style.opacity = '0.5';
              }
              linkInput.addEventListener('input', () => {
                  if (linkInput.value.trim() !== '') {
                      fileInput.disabled = true;
                      fileInput.parentElement.style.opacity = '0.5';
                      fileInput.title = 'Hapus URL link terlebih dahulu untuk upload file';
                  } else {
                      fileInput.disabled = false;
                      fileInput.parentElement.style.opacity = '1';
                      fileInput.title = '';
                  }
              });
              fileInput.addEventListener('change', () => {
                  if (fileInput.files.length > 0) {
                      linkInput.disabled = true;
                      linkInput.value = '';
                      linkInput.parentElement.style.opacity = '0.5';
                      linkInput.placeholder = 'Hapus file untuk mengisi link URL';
                  } else {
                      linkInput.disabled = false;
                      linkInput.parentElement.style.opacity = '1';
                      linkInput.placeholder = '';
                  }
              });
          }
      }, 100);
      const result = await window.uiFormModal(editItem ? 'Edit Musik Landing Page' : 'Tambah Musik Landing Page', fields);`;
code = code.replace(targetStr2, mutualExclusionLogic2);

// 3. INJECT MUSIC BANK
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
            if (urlIn) {
                urlIn.value = '';
                urlIn.dispatchEvent(new Event('input'));
            }
            if (fileIn) {
                fileIn.disabled = true;
                fileIn.parentElement.innerHTML += '<div style="margin-top:0.5rem; font-size:0.8rem; color:#10B981;">&#10004; Menggunakan file tersimpan: ' + m.file_upload + '</div>';
                window._pendingBankFile = m.file_upload;
            }
        }
        document.getElementById('modalMusicBankSelect').style.display = 'none';
        window.showToast('Lagu berhasil di-impor dari Bank!', 'green');
    }
};
`;
code = code.replace('window.openAddMusicModal = async function', bankLogic + '\nwindow.openAddMusicModal = async function');

const addMusicFieldRegex = /{ id: 'category', label: 'Kategori Momen'/;
code = code.replace(addMusicFieldRegex, `{ id: 'save_to_bank', label: 'Simpan ke Bank Musik Master untuk dipakai lagi di acara lain', type: 'select', options: [{value: '1', label: 'Ya, Simpan'}, {value: '0', label: 'Tidak perlu'}], value: '1' },\n          { id: 'category', label: 'Kategori Momen'`);

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
code = code.replace('if (linkInput && fileInput) {', injectionLogic + '\n              if (linkInput && fileInput) {');

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
const oldNewItemBlockRegex = /const newItem = {[^{}]*?category: result\.category \|\| 'BGM'\s*};/;
code = code.replace(oldNewItemBlockRegex, saveLogic);

const landingFieldRegex = /{ id: 'is_active', label: 'Status', type: 'select'/;
code = code.replace(landingFieldRegex, `{ id: 'save_to_bank', label: 'Simpan ke Bank Musik Master untuk dipakai lagi', type: 'select', options: [{value: '1', label: 'Ya, Simpan'}, {value: '0', label: 'Tidak perlu'}], value: '1' },\n          { id: 'is_active', label: 'Status', type: 'select'`);
code = code.replace('if (linkInput && fileInput) {', injectionLogic + '\n              if (linkInput && fileInput) {');

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
const oldNewItemLandingBlockRegex = /const newItem = {[^{}]*?is_active: result\.is_active === '1'\s*};/;
code = code.replace(oldNewItemLandingBlockRegex, saveLogicLanding);

fs.writeFileSync('public/js/admin-core.js', code);
console.log('Restored and successfully patched admin-core.js completely!');

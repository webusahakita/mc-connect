const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

const newFunctions = `
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
        overlay.style.zIndex = '999999';
        document.body.appendChild(overlay);
    }
    
    let html = \`
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3 class="modal-title">\${idx !== null ? '✏️ Edit Lagu Master' : '🎵 Tambah Lagu Master'}</h3>
                <button class="modal-close" onclick="document.getElementById('\${modalId}').style.display='none'">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="mbFormIdx" value="\${idx !== null ? idx : ''}">
                <div class="form-group">
                    <label class="form-label">Judul Musik / Audio *</label>
                    <input type="text" class="form-input" id="mbFormTitle" value="\${title}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Penyanyi / Artis / Komposer</label>
                    <input type="text" class="form-input" id="mbFormArtist" value="\${artist}">
                </div>
                <div class="form-group">
                    <label class="form-label">Tipe Audio</label>
                    <select class="form-select" id="mbFormType">
                        <option value="BGM" \${type==='BGM'?'selected':''}>BGM (Backgorund Music)</option>
                        <option value="SFX" \${type==='SFX'?'selected':''}>SFX (Sound Effect)</option>
                        <option value="Lagu Utama" \${type==='Lagu Utama'?'selected':''}>Lagu Utama / Entrance</option>
                        <option value="Lainnya" \${type==='Lainnya'?'selected':''}>Lainnya</option>
                    </select>
                </div>
                <div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1rem;">
                    <label class="form-label">File Audio Lokal (.mp3, .wav)</label>
                    <input type="file" class="form-input" id="mbFormFile" accept="audio/*">
                    \${file_upload ? \`<div style="font-size:0.75rem; color:var(--adm-gold); margin-top:0.3rem;">File saat ini: \${file_upload}</div>\` : ''}
                </div>
                <div style="text-align:center; font-size:0.8rem; color:var(--adm-text-muted); margin-bottom:1rem;">ATAU</div>
                <div class="form-group">
                    <label class="form-label">Link YouTube / Drive / Spotify</label>
                    <input type="text" class="form-input" id="mbFormUrl" value="\${url_link}" placeholder="https://youtube.com/...">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('\${modalId}').style.display='none'">Batal</button>
                <button class="btn btn-primary" onclick="window.saveMasterBankForm()">Simpan ke Bank</button>
            </div>
        </div>
    \`;
    
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
};

window.saveMasterBankForm = function() {
    const idxStr = document.getElementById('mbFormIdx').value;
    const title = document.getElementById('mbFormTitle').value.trim();
    const artist = document.getElementById('mbFormArtist').value.trim();
    const type = document.getElementById('mbFormType').value;
    const url_link = document.getElementById('mbFormUrl').value.trim();
    const fileInput = document.getElementById('mbFormFile');
    
    if (!title) return window.uiAlert('Judul musik harus diisi!');
    
    let file_upload = '';
    if (fileInput && fileInput.files.length > 0) {
        file_upload = fileInput.files[0].name;
    } else if (idxStr !== '') {
        const bank = window.getGlobalMusicBank();
        file_upload = bank[parseInt(idxStr)].file_upload || '';
    }
    
    if (url_link && fileInput && fileInput.files.length > 0) {
        return window.uiAlert('Silakan pilih salah satu: Upload File lokal ATAU masukkan Link URL, tidak boleh keduanya untuk menghindari konflik pemutaran.');
    }
    
    const bank = window.getGlobalMusicBank();
    const item = { title, artist, type, url_link, file_upload };
    
    if (idxStr !== '') {
        bank[parseInt(idxStr)] = item;
        if (typeof window.showToast === 'function') window.showToast('Lagu berhasil diupdate!', 'green');
    } else {
        bank.push(item);
        if (typeof window.showToast === 'function') window.showToast('Lagu berhasil ditambahkan ke bank!', 'green');
    }
    
    window.saveGlobalMusicBank(bank);
    document.getElementById('modalMasterBankForm').style.display = 'none';
    
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
        contentHtml = \`<iframe width="100%" height="250" src="\${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>\`;
    } else if (m.file_upload) {
        contentHtml = \`
            <div style="padding:2rem; text-align:center; background:rgba(0,0,0,0.3); border-radius:8px;">
                <div style="font-size:2rem; margin-bottom:1rem;">🎵</div>
                <div style="margin-bottom:1.5rem; color:var(--adm-gold);">\${m.file_upload}</div>
                <audio controls autoplay style="width:100%;">
                    <source src="#" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
                <div style="margin-top:0.5rem; font-size:0.75rem; color:var(--adm-text-muted);">Preview file lokal belum diunggah ke CDN</div>
            </div>
        \`;
    } else {
        contentHtml = '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Tidak ada media untuk diputar.</div>';
    }
    
    overlay.innerHTML = \`
        <div class="modal-content" style="max-width:500px; background:#111;">
            <div class="modal-header">
                <h3 class="modal-title">▶️ Memutar: \${m.title}</h3>
                <button class="modal-close" onclick="document.getElementById('\${modalId}').style.display='none'; document.getElementById('\${modalId}').innerHTML='';">&times;</button>
            </div>
            <div class="modal-body" style="padding:0;">
                \${contentHtml}
            </div>
        </div>
    \`;
    
    overlay.style.display = 'flex';
};
`;

const oldRenderer = /window\.renderMusicBankSection = async function\(\) \{[\s\S]*?\};\n\nwindow\.deleteMusicBankItemSection = async function\(idx\) \{[\s\S]*?\};/;
let newRenderer = `
window.renderMusicBankSection = async function() {
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
            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background=\\'rgba(255,255,255,0.02)\\'" onmouseout="this.style.background=\\'transparent\\'">';
            html += '<td style="padding:1rem 1.5rem;">';
            html += '<div style="font-weight:700; font-size:1.05rem; color:#FFF; margin-bottom:0.2rem;">' + m.title + '</div>';
            html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + (m.artist || 'Unknown') + '</div>';
            let srcTxt = m.url_link ? '&#128279; ' + m.url_link : (m.file_upload ? '&#128194; File Upload' : '');
            if(srcTxt) html += '<div style="font-size:0.75rem; color:var(--adm-text-secondary); margin-top:0.3rem;">' + srcTxt + '</div>';
            html += '</td>';
            html += '<td style="padding:1rem 1.5rem;"><span style="background:rgba(255,255,255,0.1); color:#E5E7EB; padding:0.25rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:600; text-transform:uppercase;">' + (m.type || 'Lainnya') + '</span></td>';
            html += '<td style="padding:1rem 1.5rem; text-align:right;">';
            
            html += '<button class="btn btn-secondary btn-sm" onclick="window.playMasterMusic(' + idx + ')" style="color:#60A5FA; border-color:rgba(96,165,250,0.3); margin-right:0.5rem;" title="Putar Preview">▶️ Putar</button>';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.openMasterBankForm(' + idx + ')" style="color:var(--adm-gold); border-color:rgba(212,175,55,0.3); margin-right:0.5rem;" title="Edit Lagu">✏️ Edit</button>';
            
            html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteMusicBankItemSection(' + idx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus">🗑️ Hapus</button>';
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
};`;

code = code.replace(oldRenderer, newRenderer);
code += '\n' + newFunctions;
fs.writeFileSync('public/js/admin-core.js', code);
console.log('Added add/edit/play logic to Master Bank Musik');

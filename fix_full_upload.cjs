const fs = require('fs');

const files = ['public/js/admin-core.js', 'scratch/admin-core.orig.js', 'scratch/music_patch.js'];

files.forEach(file => {
    try {
        let code = fs.readFileSync(file, 'utf8');
        
        // 1. Rewrite saveMasterBankForm entirely
        const saveStart = code.indexOf('window.saveMasterBankForm =');
        if (saveStart > -1) {
            let saveEnd = code.indexOf('};', saveStart);
            const oldSave = code.substring(saveStart, saveEnd + 2);
            
            const newSave = `window.saveMasterBankForm = async function() {
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
        bank[parseInt(idxStr)] = item;
        if (typeof window.showToast === 'function') window.showToast('Lagu berhasil diupdate!', 'green');
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
};`;
            code = code.replace(oldSave, newSave);
        }

        // 2. Rewrite playMasterMusic to use direct server URL
        const playStart = code.indexOf('window.playMasterMusic =');
        if (playStart > -1) {
            let playEnd = code.indexOf('};', playStart);
            const oldPlay = code.substring(playStart, playEnd + 2);
            
            const newPlay = `window.playMasterMusic = function(idx) {
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
                <div style="margin-bottom:1.5rem; color:var(--adm-gold);">\${m.file_upload.split('/').pop()}</div>
                <audio controls autoplay style="width:100%;">
                    <source src="\${m.file_upload}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            </div>
        \`;
    } else {
        contentHtml = '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Tidak ada media untuk diputar.</div>';
    }
    
    overlay.innerHTML = \`
        <div class="modal-content" style="max-width:500px; background:#111;">
            <div class="modal-header">
                <h3 class="modal-title">▶️ Memutar: \${m.title}</h3>
                <button class="modal-close" onclick="document.getElementById('\${modalId}').style.display='none'; document.getElementById('\${modalId}').classList.remove('active'); document.getElementById('\${modalId}').innerHTML='';">&times;</button>
            </div>
            <div class="modal-body" style="padding:0;">
                \${contentHtml}
            </div>
        </div>
    \`;
    
    overlay.style.display = 'flex';
    overlay.classList.add('active');
};`;
            code = code.replace(oldPlay, newPlay);
        }

        fs.writeFileSync(file, code);
        console.log("Patched " + file);
    } catch(e) {
        console.log("Error in " + file + ": " + e.message);
    }
});

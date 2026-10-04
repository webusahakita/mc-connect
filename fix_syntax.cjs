const fs = require('fs');

const correctSave = `window.saveMasterBankForm = async function() {
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

const files = ['public/js/admin-core.js', 'scratch/admin-core.orig.js', 'scratch/music_patch.js'];
files.forEach(file => {
    try {
        let code = fs.readFileSync(file, 'utf8');
        
        const startIdx = code.indexOf('window.saveMasterBankForm =');
        if (startIdx > -1) {
            // Find the start of window.playMasterMusic = 
            const endIdx = code.indexOf('window.playMasterMusic =', startIdx);
            if (endIdx > -1) {
                const brokenBlock = code.substring(startIdx, endIdx);
                code = code.replace(brokenBlock, correctSave + '\n\n');
                fs.writeFileSync(file, code);
                console.log("Fixed syntax in " + file);
            }
        }
    } catch (e) {
        console.log("Error: " + e.message);
    }
});

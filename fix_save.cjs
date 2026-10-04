const fs = require('fs');

const oldLogic = `    if (url_link && fileInput && fileInput.files.length > 0) {
        return window.uiAlert('Silakan pilih salah satu: Upload File lokal ATAU masukkan Link URL, tidak boleh keduanya untuk menghindari konflik pemutaran.');
    }
    
    const bank = window.getGlobalMusicBank();
    const item = { title, artist, type, url_link, file_upload };`;

const newLogic = `    if (url_link && fileInput && fileInput.files.length > 0) {
        return window.uiAlert('Silakan pilih salah satu: Upload File lokal ATAU masukkan Link URL, tidak boleh keduanya untuk menghindari konflik pemutaran.');
    }
    
    // Ensure exclusivity when updating
    let final_url = url_link;
    let final_file = file_upload;
    if (final_url !== '') {
        final_file = '';
    } else if (fileInput && fileInput.files && fileInput.files.length > 0) {
        // final_file is already set to the new file name above, final_url is empty
    }
    
    const bank = window.getGlobalMusicBank();
    const item = { title, artist, type, url_link: final_url, file_upload: final_file };`;

const files = ['public/js/admin-core.js', 'scratch/admin-core.orig.js', 'scratch/music_patch.js'];
files.forEach(file => {
    try {
        let code = fs.readFileSync(file, 'utf8');
        if (code.includes(oldLogic)) {
            code = code.replace(oldLogic, newLogic);
            
            // Also fix the document.getElementById('${modalId}').style.display='none' inside saveMasterBankForm if not fixed
            if (code.includes("document.getElementById('modalMasterBankForm').style.display = 'none';")) {
                if (!code.includes("document.getElementById('modalMasterBankForm').classList.remove('active');")) {
                    code = code.replace("document.getElementById('modalMasterBankForm').style.display = 'none';", 
                    "document.getElementById('modalMasterBankForm').style.display = 'none';\n    document.getElementById('modalMasterBankForm').classList.remove('active');");
                }
            }
            
            fs.writeFileSync(file, code);
            console.log("Patched " + file);
        }
    } catch(e) {}
});

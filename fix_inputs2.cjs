const fs = require('fs');

const newLogic = `    overlay.innerHTML = html;
    overlay.style.display = 'flex';
    overlay.classList.add('active');

    const fileInput = document.getElementById('mbFormFile');
    const urlInput = document.getElementById('mbFormUrl');
    
    function toggleMbInputs() {
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            urlInput.disabled = true;
            urlInput.style.opacity = '0.5';
            urlInput.value = '';
        } else if (urlInput && urlInput.value.trim() !== '') {
            fileInput.disabled = true;
            fileInput.style.opacity = '0.5';
            fileInput.value = '';
        } else {
            if (urlInput) {
                urlInput.disabled = false;
                urlInput.style.opacity = '1';
            }
            if (fileInput) {
                fileInput.disabled = false;
                fileInput.style.opacity = '1';
            }
        }
    }
    
    if (fileInput) fileInput.addEventListener('change', toggleMbInputs);
    if (urlInput) urlInput.addEventListener('input', toggleMbInputs);
    
    // Initial toggle based on existing data
    if (url_link) {
        if (fileInput) {
            fileInput.disabled = true;
            fileInput.style.opacity = '0.5';
        }
    } else if (file_upload) {
        if (urlInput) {
            urlInput.disabled = true;
            urlInput.style.opacity = '0.5';
        }
    }
};`;

const files = ['public/js/admin-core.js', 'scratch/admin-core.orig.js', 'scratch/music_patch.js'];
files.forEach(file => {
    try {
        let code = fs.readFileSync(file, 'utf8');
        const regex = /overlay\.innerHTML\s*=\s*html;\s*overlay\.style\.display\s*=\s*'flex';\s*overlay\.classList\.add\('active'\);\s*};/g;
        
        const start = code.indexOf('window.openMasterBankForm');
        if (start === -1) {
             console.log("No openMasterBankForm in " + file);
             return;
        }
        
        if (regex.test(code)) {
            code = code.replace(regex, newLogic);
            fs.writeFileSync(file, code);
            console.log("Patched " + file);
        } else {
            console.log("Regex not found in " + file);
        }
    } catch(e) {
        console.log("Error: " + e.message);
    }
});

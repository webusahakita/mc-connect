const fs = require('fs');
const files = ['public/js/admin-core.js', 'scratch/admin-core.orig.js', 'scratch/music_patch.js'];

files.forEach(file => {
    try {
        let code = fs.readFileSync(file, 'utf8');
        
        // 1. Add window.memoryAudioFiles logic to saveMasterBankForm
        // We will look for final_file assignment
        const saveStart = code.indexOf('window.saveMasterBankForm');
        if (saveStart > -1) {
            if (!code.includes('window.memoryAudioFiles = window.memoryAudioFiles || {};')) {
                const searchStr = `    const bank = window.getGlobalMusicBank();`;
                const replaceStr = `    window.memoryAudioFiles = window.memoryAudioFiles || {};
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        window.memoryAudioFiles[fileInput.files[0].name] = URL.createObjectURL(fileInput.files[0]);
    }
    
    const bank = window.getGlobalMusicBank();`;
                code = code.replace(searchStr, replaceStr);
            }
        }
        
        // 2. Modify playMasterMusic to use memoryAudioFiles
        const playStart = code.indexOf('window.playMasterMusic =');
        if (playStart > -1) {
            const oldPlayHtml = `<audio controls autoplay style="width:100%;">
                    <source src="#" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
                <div style="margin-top:0.5rem; font-size:0.75rem; color:var(--adm-text-muted);">Preview file lokal belum diunggah ke CDN</div>`;
                
            const newPlayHtml = `<audio controls autoplay style="width:100%;">
                    <source src="\${window.memoryAudioFiles && window.memoryAudioFiles[m.file_upload] ? window.memoryAudioFiles[m.file_upload] : '#'}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
                \${!(window.memoryAudioFiles && window.memoryAudioFiles[m.file_upload]) ? '<div style="margin-top:0.5rem; font-size:0.75rem; color:var(--adm-text-muted);">Hanya preview. Jika tidak berbunyi, Anda perlu memilih file kembali.</div>' : ''}`;
            
            if (code.includes('src="#"')) {
                code = code.replace(oldPlayHtml, newPlayHtml);
            }
        }
        
        fs.writeFileSync(file, code);
        console.log("Patched " + file);
    } catch(e) {
        console.log("Error in " + file + ": " + e.message);
    }
});

const fs = require('fs');
const files = ['public/js/admin-core.js', 'scratch/admin-core.orig.js', 'scratch/music_patch.js'];

files.forEach(file => {
    try {
        let code = fs.readFileSync(file, 'utf8');
        
        // Fix modal creation / open
        // Make sure not to double add if already there
        if (!code.includes("overlay.classList.add('active');")) {
            code = code.replace(/overlay\.style\.display = 'flex';/g, "overlay.style.display = 'flex';\n        overlay.classList.add('active');");
        }
        
        // Fix inline onclick closes
        // style.display='none'
        if (!code.includes("classList.remove('active')")) {
            code = code.replace(/style\.display='none'/g, "style.display='none'; document.getElementById('${modalId}').classList.remove('active')");
        }
        
        fs.writeFileSync(file, code);
        console.log("Patched " + file);
    } catch(e) {
        console.log("Error patching " + file + ": " + e.message);
    }
});

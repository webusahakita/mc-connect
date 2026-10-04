const fs = require('fs');
const file = 'public/js/admin-core.js';
let code = fs.readFileSync(file, 'utf8');

const hookStr = `if (typeof window.originalRenderAdminMusicListWrapper === 'undefined') {
    window.originalRenderAdminMusicListWrapper = window.renderAdminMusicList || function(){};
}
window.renderAdminMusicListWrapper = function(currentEv) {
    if (currentEv) {
        window.checkAndGenerateDummyMusic(currentEv);
    }
    if (typeof window.originalRenderAdminMusicListWrapper === 'function') {
        window.originalRenderAdminMusicListWrapper(currentEv);
    }
};`;

const renderFunc = fs.readFileSync('scratch/extract_render.js', 'utf8');

code = code.replace(hookStr, renderFunc);

fs.writeFileSync(file, code);
console.log('Restored the FULL table renderer to admin-core.js');

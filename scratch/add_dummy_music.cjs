const fs = require('fs');
const file = 'public/js/admin-core.js';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    'window.renderAdminMusicListWrapper = function(currentEv) {',
    'window.renderAdminMusicListWrapper = function(currentEv) {\n    if (typeof window.checkAndGenerateDummyMusic === "function") window.checkAndGenerateDummyMusic(currentEv);'
);

fs.writeFileSync(file, code);
console.log('Added checkAndGenerateDummyMusic to renderAdminMusicListWrapper');

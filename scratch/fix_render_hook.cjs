const fs = require('fs');
const file = 'public/js/admin-core.js';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    'window.originalRenderAdminMusicListWrapper = window.renderAdminMusicListWrapper || function(){};',
    'window.originalRenderAdminMusicListWrapper = window.renderAdminMusicList || function(){};'
);

fs.writeFileSync(file, code);
console.log('Fixed render wrapper hook');

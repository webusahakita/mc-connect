const fs = require('fs');
const path = 'c:\\Users\\Nawakara\\.gemini\\antigravity-ide\\scratch\\mc-connect\\public\\js\\admin-core.js';
let content = fs.readFileSync(path, 'utf8');

// Disable Dummy Soundboard
const regexDummySoundboard = /window\.checkAndGenerateDummySoundboard\s*=\s*function\(currentEv\)\s*\{[\s\S]*?\n\};/g;
content = content.replace(regexDummySoundboard, 'window.checkAndGenerateDummySoundboard = function(currentEv) {};');

// Disable Dummy Music
const regexDummyMusic = /window\.checkAndGenerateDummyMusic\s*=\s*function\(currentEv\)\s*\{[\s\S]*?\n\};/g;
content = content.replace(regexDummyMusic, 'window.checkAndGenerateDummyMusic = function(currentEv) {};');

// Fix Duplicated renderAdminMusicListWrapper implementations and invocations
const regexWrapperMess = /window\.renderAdminMusicListWrapper\s*=\s*function\(currentEv\)[\s\S]*?if\s*\(typeof\s*window\.originalRenderAdminMusicListWrapper\s*===\s*'undefined'\)\s*\{\s*window\.originalRenderAdminMusicListWrapper\s*=\s*window\.renderAdminMusicList\s*\|\|\s*function\(\)\{\};\s*\}\s*window\.renderAdminMusicListWrapper\s*=\s*function\(currentEv\)\s*\{[\s\S]*?window\.originalRenderAdminMusicListWrapper\(currentEv\);\s*\}\s*\};/g;
content = content.replace(regexWrapperMess, `
window.renderAdminMusicListWrapper = function(currentEv) {
    if (typeof window.renderAdminMusicList === 'function') {
        window.renderAdminMusicList(currentEv);
    }
};
`);

// Find leftover setTimeout that call checkAndGenerateDummyMusic
const regexTimeout = /\/\/ Initialize if ev exists and music tab is active[\s\S]*?\}, 500\);/g;
content = content.replace(regexTimeout, '');

fs.writeFileSync(path, content, 'utf8');
console.log("Patched admin-core.js: removed dummies and cleaned up wrappers!");

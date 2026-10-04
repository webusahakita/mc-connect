const fs = require('fs');

const path = 'c:\\Users\\Nawakara\\.gemini\\antigravity-ide\\scratch\\mc-connect\\public\\js\\admin-core.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /\/\/ Hook into the original render wrapper to ensure checkAndGenerate is called on load[\s\S]*?window\.originalRenderAdminMusicListWrapper\(currentEv\);\s*\}\s*\};/g;

const replacement = `// Hook into the original render wrapper to ensure checkAndGenerate is called on load
window.renderAdminMusicListWrapper = function(currentEv) {
    if (currentEv) {
        window.checkAndGenerateDummyMusic(currentEv);
    }
    if (typeof window.renderAdminMusicList === 'function') {
        window.renderAdminMusicList(currentEv);
    }
};

// Initialize if ev exists and music tab is active
setTimeout(() => {
    let ev = _getEv();
    if (ev) {
        const bgmPanel = document.getElementById('musicSubtabBgm');
        if (bgmPanel && bgmPanel.style.display !== 'none') {
            window.checkAndGenerateDummyMusic(ev);
            window.renderAdminMusicListWrapper(ev);
        }
    }
}, 500);`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log("Replaced wrapper successfully!");

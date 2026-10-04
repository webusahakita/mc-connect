const fs = require('fs');
const path = 'c:\\Users\\Nawakara\\.gemini\\antigravity-ide\\scratch\\mc-connect\\public\\js\\admin-core.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add previewMusic function
const previewCode = `
window.previewMusic = function(btn, fileUrl, linkUrl) {
    if (fileUrl) {
        if (window._currentAudio) {
            window._currentAudio.pause();
            if (window._currentAudio.src.endsWith(fileUrl)) {
                window._currentAudio = null;
                btn.innerHTML = '▶️';
                return;
            }
            // Reset any other playing buttons
            document.querySelectorAll('.btn-preview-music').forEach(b => b.innerHTML = '▶️');
        }
        window._currentAudio = new Audio('/storage/' + fileUrl);
        window._currentAudio.play().then(() => {
            btn.innerHTML = '⏸️';
        }).catch(e => {
            console.error("Audio play failed:", e);
            if (typeof window.uiAlert === 'function') window.uiAlert('Tidak dapat memutar audio.');
        });
        window._currentAudio.onended = function() {
            btn.innerHTML = '▶️';
            window._currentAudio = null;
        };
    } else if (linkUrl) {
        window.open(linkUrl, '_blank');
    } else {
        if (typeof window.uiAlert === 'function') window.uiAlert('Tidak ada file audio atau link untuk diputar.');
    }
};

window.deleteMusic =`;
content = content.replace('window.deleteMusic =', previewCode);


// 2. Add button to renderAdminMusicList
const oldBtnCode = `html += '<button class="btn btn-secondary btn-sm" onclick="window.openAddMusicModal(' + realIdx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" title="Edit / Ganti Segmen">✏️</button>';`;

const newBtnCode = `
        const fUrl = item.file_upload ? item.file_upload.replace(/'/g, "\\'") : '';
        const lUrl = item.url_link ? item.url_link.replace(/'/g, "\\'") : '';
        html += '<button class="btn btn-secondary btn-sm btn-preview-music" onclick="window.previewMusic(this, \\'' + fUrl + '\\', \\'' + lUrl + '\\')" style="margin-right:0.5rem; color:#10B981; border-color:rgba(16,185,129,0.3);" title="Preview Musik">▶️</button>';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.openAddMusicModal(' + realIdx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" title="Edit / Ganti Segmen">✏️</button>';`;

content = content.replace(oldBtnCode, newBtnCode);

fs.writeFileSync(path, content, 'utf8');
console.log("Added preview functionality successfully!");
